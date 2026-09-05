import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { junfueToolDeclarations, executeJunfueTool } from '@/lib/ai/junfueTools'

export const maxDuration = 60 // Allow up to 60 seconds for multi-tool AI analysis

interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    // 2. Fetch accessible stores for this admin
    const { data: stores, error: storeErr } = await supabase
      .from('stores')
      .select('store_id, store_name')
      .or(`user_id.eq.${user.id},co_admins.cs.{${user.id}}`)
      .is('deleted_at', null)

    if (storeErr) {
      console.error('[junfue-ai/chat] Store fetch error:', storeErr)
    }

    const allowedStoreIds = (stores || []).map((s) => s.store_id)
    if (allowedStoreIds.length === 0) {
      return NextResponse.json({
        response:
          "Welcome! I am **Jun Fue AI**, your executive business advisor. However, I noticed you don't have any active stores registered yet. Once you create or link a store in the **Stores** tab, I can start analyzing your sales, finances, inventory, and transactions.",
        toolsUsed: [],
        suggestions: ['How do I add a new store?', 'What can Jun Fue AI do?'],
      })
    }

    // 3. Parse request payload
    const body = await req.json()
    const { messages = [], storeId, dateContext } = body as {
      messages: ChatMessage[]
      storeId?: string
      dateContext?: { from: string; to: string }
    }

    if (!messages.length) {
      return NextResponse.json({ error: 'Message history cannot be empty.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured in environment variables.' },
        { status: 500 }
      )
    }

    // 4. Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)

    const todayDate = new Date().toISOString().split('T')[0]
    const storeContextDesc =
      storeId && storeId !== 'all'
        ? `The user is currently focusing on store ID: "${storeId}" (${stores?.find((s) => s.store_id === storeId)?.store_name || 'Selected Store'}).`
        : `The user is viewing aggregated data across ALL ${stores?.length || 0} active stores (${stores?.map((s) => s.store_name).join(', ')}).`

    const dateContextDesc = dateContext
      ? `Current active date filter in UI: From ${dateContext.from} to ${dateContext.to}.`
      : `Current date context: Today is ${todayDate}.`

    const systemInstruction = `
You are "Jun Fue AI", the premier Executive Business Analyst, Financial Strategist, and Forensic Data Auditor for the JunLink POS platform.

TODAY'S SYSTEM DATE: ${todayDate}
CONTEXT:
- ${storeContextDesc}
- ${dateContextDesc}
- Currency: Philippine Peso (₱ / PHP). Always format currency clearly (e.g. ₱1,250.00).

MISSION & CAPABILITIES:
1. Business Status & Financials: Provide sharp, executive-level summaries of gross sales, net profit margins, COGS, OPEX, remittances, cash remaining, and average ticket size using real database tools.
2. Anomaly & Risk Detection: Identify suspicious patterns such as excessive discounts (>25%), off-hours activity, unusually high undocumented expenses, duplicate transactions, and voids. State the severity level clearly (🚨 CRITICAL, ⚠️ WARNING, ℹ️ INFO), provide details, and give actionable verification steps.
3. Inventory & Operations: Diagnose dead stock, low stock thresholds, fast-moving items, and stock movement trends.
4. Strategic Advisory & Growth: Provide data-backed recommendations on pricing optimization, expense reduction, cashier productivity, and inventory replenishment.

GUIDELINES:
- ALWAYS utilize your function tools to retrieve real facts, numbers, dates, and transactions before formulating your answers. Never invent fictional numbers.
- When the user asks about today, this week, this month, or a custom range, pass the appropriate YYYY-MM-DD dates to the tools.
- Structure responses cleanly using Markdown: headers (##, ###), bullet points, bold key metrics, and markdown tables for data comparisons.
- If anomalies are discovered, highlight them with clear callouts.
- Keep your tone sharp, professional, insightful, and confident like a top-tier retail CFO and business consultant.
`

    // Use supported and active Gemini models with fallback
    const modelCandidates = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-flash-latest', 'gemini-2.5-flash-lite']
    let lastError: any = null

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
          tools: [{ functionDeclarations: junfueToolDeclarations }],
        })

        // Prepare message history for multi-turn chat
        // Separate historical messages and the last prompt
        const history = messages.slice(0, -1).map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }))

        const lastUserMessage = messages[messages.length - 1].text

        const chat = model.startChat({
          history,
        })

        let chatResult = await chat.sendMessage(lastUserMessage)
        let response = chatResult.response

        const toolsUsed: Array<{ name: string; summary: string }> = []
        let iterations = 0
        const MAX_TOOL_ITERATIONS = 8

        // Handle tool calls loop
        while (response.functionCalls() && iterations < MAX_TOOL_ITERATIONS) {
          iterations++
          const calls = response.functionCalls()!
          const functionResponses = []

          for (const call of calls) {
            const toolName = call.name
            const toolArgs = (call.args || {}) as Record<string, any>

            const toolResult = await executeJunfueTool(toolName, toolArgs, {
              supabase,
              adminUserId: user.id,
              allowedStoreIds,
            })

            let summary = `Queried ${toolName.replace(/_/g, ' ')}`
            if (toolName === 'detect_anomalies') {
              summary = `Scanned for transaction anomalies (Found ${toolResult.anomaliesFoundCount ?? 0} flags)`
            } else if (toolName === 'get_financial_metrics') {
              summary = `Analyzed financial KPIs (Net Sales: ₱${Number(toolResult.netSales || 0).toLocaleString()})`
            } else if (toolName === 'get_top_and_worst_sellers') {
              summary = `Evaluated product velocity and dead stock`
            } else if (toolName === 'get_business_overview') {
              summary = `Retrieved overview of ${toolResult.totalStores || 0} stores`
            }

            toolsUsed.push({ name: toolName, summary })

            functionResponses.push({
              functionResponse: {
                name: toolName,
                response: toolResult,
              },
            })
          }

          // Pass tool results back to Gemini
          chatResult = await chat.sendMessage(functionResponses)
          response = chatResult.response
        }

        const finalText = response.text()

        // Generate dynamic follow-up suggestions based on context
        const suggestions = generateFollowUpSuggestions(lastUserMessage, finalText, toolsUsed)

        return NextResponse.json({
          response: finalText,
          toolsUsed,
          suggestions,
        })
      } catch (err: any) {
        console.warn(`[junfue-ai/chat] Model ${modelName} encountered error:`, err?.message || err)
        lastError = err
        // Try next candidate model
      }
    }

    throw lastError || new Error('All Gemini model candidates failed to respond.')
  } catch (error: any) {
    console.error('[junfue-ai/chat] Fatal API error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to process request with Jun Fue AI.',
      },
      { status: 500 }
    )
  }
}

function generateFollowUpSuggestions(
  prompt: string,
  response: string,
  toolsUsed: Array<{ name: string; summary: string }>
): string[] {
  const p = prompt.toLowerCase()
  const r = response.toLowerCase()

  if (toolsUsed.some((t) => t.name === 'detect_anomalies') || p.includes('anomal') || p.includes('suspicious')) {
    return [
      'Which cashiers gave the highest discounts?',
      'Show me large undocumented expenses this month',
      'Give me recommendations to prevent unauthorized discounts',
    ]
  }

  if (p.includes('sales') || p.includes('financial') || p.includes('profit') || p.includes('revenue')) {
    return [
      'Check for anomalous or suspicious transactions',
      'What are our top selling and dead stock items?',
      'How can we increase our net profit margin?',
    ]
  }

  if (p.includes('inventory') || p.includes('stock') || p.includes('product') || p.includes('item')) {
    return [
      'Which items have zero sales this month?',
      'Show low stock items that need replenishment',
      'What is our total revenue breakdown by category?',
    ]
  }

  if (p.includes('advice') || p.includes('recommend') || p.includes('grow') || p.includes('strategy')) {
    return [
      'Summarize our financial performance today',
      'Scan for abnormal expenses or cashouts',
      'Compare store performances across all branches',
    ]
  }

  return [
    'How is my business doing today?',
    'Scan for suspicious or anomalous transactions',
    'What are my top selling and slow-moving items?',
  ]
}
