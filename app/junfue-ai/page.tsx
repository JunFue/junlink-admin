'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  Bot, 
  User as UserIcon, 
  Store, 
  Calendar, 
  ShieldAlert, 
  AlertTriangle,
  TrendingUp, 
  Package, 
  Lightbulb, 
  ArrowRight,
  Database,
  RefreshCw,
  Info,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Flame,
  BadgeAlert
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useStores } from '@/app/stores/hooks/useStores'
import { cn } from '@/lib/utils/cn'

interface ToolExecutionInfo {
  name: string
  summary: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolsUsed?: ToolExecutionInfo[]
  suggestions?: string[]
  timestamp: Date
}

const STARTER_PROMPTS = [
  {
    icon: TrendingUp,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/40',
    title: 'Financial & Sales Pulse',
    badge: 'Real-time KPIs',
    desc: 'Review gross sales, net profit margins, expense distribution, and cash remaining for today.',
    prompt: 'How is my business performing today? Give me an executive summary with gross sales, net profit, total expenses, and profit margin breakdown in a clean comparison table.',
  },
  {
    icon: ShieldAlert,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40',
    title: 'Audit & Anomaly Forensics',
    badge: 'Risk Detection',
    desc: 'Audit store transactions for extreme discounts (>25%), unusual off-hours activity, and undocumented cashouts.',
    prompt: 'Perform a forensic audit on my stores for suspicious transactions, excessive discounts, off-hours sales, and abnormal expenses in the last 7 days.',
  },
  {
    icon: Package,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/40',
    title: 'Inventory & Product Health',
    badge: 'Velocity & Dead Stock',
    desc: 'Identify top revenue drivers, dead stock items with zero sales, and low inventory warnings.',
    prompt: 'Which products are our top revenue drivers, which items are dead stock with zero sales, and what items need restocking immediately?',
  },
  {
    icon: Lightbulb,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/40',
    title: 'Strategic Growth Advice',
    badge: 'CFO Insights',
    desc: 'Get concrete, data-backed recommendations to optimize profit margins and cut operating costs.',
    prompt: 'Analyze our current business data and give me 3 actionable strategies to boost our net profit margin, optimize item pricing, and reduce operating expenses.',
  },
]

// Custom Markdown Component Renderers for high readability
const MarkdownComponents = {
  h1: ({ children, ...props }: any) => (
    <h1 className="text-lg sm:text-xl font-bold text-foreground mt-4 mb-2 pb-1.5 border-b border-border/60 flex items-center gap-2" {...props}>
      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-base sm:text-lg font-bold text-foreground mt-4 mb-2 flex items-center gap-2 text-primary" {...props}>
      <Sparkles className="h-4 w-4 text-primary shrink-0" />
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-sm sm:text-base font-semibold text-foreground/95 mt-3 mb-1.5 flex items-center gap-1.5" {...props}>
      <span className="text-primary font-bold">▪</span>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: any) => (
    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-2.5 mb-1" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }: any) => (
    <p className="text-sm leading-relaxed text-foreground/90 my-2" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }: any) => {
    const text = String(children)
    // Check for critical/warning badge tags
    if (text.includes('CRITICAL')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive/15 text-destructive font-bold text-xs border border-destructive/30">
          <ShieldAlert className="h-3 w-3" />
          {children}
        </span>
      )
    }
    if (text.includes('WARNING')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/30">
          <AlertTriangle className="h-3 w-3" />
          {children}
        </span>
      )
    }
    if (text.includes('INFO') || text.includes('NOTE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-500/30">
          <Info className="h-3 w-3" />
          {children}
        </span>
      )
    }
    // Highlighting currency amounts (₱) or percentage (%)
    if (text.includes('₱') || text.includes('%')) {
      return (
        <strong className="font-semibold text-primary dark:text-primary-foreground bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 text-[13px] inline-block my-0.5" {...props}>
          {children}
        </strong>
      )
    }
    return (
      <strong className="font-semibold text-foreground tracking-tight" {...props}>
        {children}
      </strong>
    )
  },
  ul: ({ children, ...props }: any) => (
    <ul className="my-2.5 space-y-1.5 pl-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="my-2.5 space-y-2 pl-4 list-decimal text-sm text-foreground/90 marker:text-primary marker:font-semibold" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="flex items-start gap-2 text-sm text-foreground/90 leading-relaxed" {...props}>
      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  table: ({ children, ...props }: any) => (
    <div className="my-3.5 overflow-x-auto rounded-xl border border-border bg-card/70 shadow-xs">
      <table className="w-full text-xs text-left border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-muted/80 text-muted-foreground border-b border-border font-semibold text-[11px] uppercase tracking-wider" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-3.5 py-2.5 font-semibold text-foreground/80 whitespace-nowrap" {...props}>
      {children}
    </th>
  ),
  tbody: ({ children, ...props }: any) => (
    <tbody className="divide-y divide-border/40" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="hover:bg-primary/5 transition-colors even:bg-muted/20" {...props}>
      {children}
    </tr>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-3.5 py-2.5 text-xs text-foreground font-medium whitespace-nowrap" {...props}>
      {children}
    </td>
  ),
  blockquote: ({ children, ...props }: any) => {
    // Detect content severity to color blockquote appropriately
    const content = String(children)
    const isCritical = content.includes('CRITICAL') || content.includes('🚨')
    const isWarning = content.includes('WARNING') || content.includes('⚠️')
    const isSuccess = content.includes('STRATEGY') || content.includes('RECOMMENDATION') || content.includes('💡') || content.includes('✅')

    let borderClass = 'border-l-primary bg-primary/5 text-foreground'
    let IconComponent = Info

    if (isCritical) {
      borderClass = 'border-l-destructive bg-destructive/10 text-destructive-foreground'
      IconComponent = ShieldAlert
    } else if (isWarning) {
      borderClass = 'border-l-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-100'
      IconComponent = AlertTriangle
    } else if (isSuccess) {
      borderClass = 'border-l-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100'
      IconComponent = Lightbulb
    }

    return (
      <blockquote className={cn("my-3 rounded-xl border-l-4 p-3.5 text-sm shadow-xs flex gap-3 items-start", borderClass)} {...props}>
        <IconComponent className="h-4 w-4 shrink-0 mt-0.5 opacity-80" />
        <div className="flex-1 space-y-1">{children}</div>
      </blockquote>
    )
  },
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) {
      return (
        <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-primary border border-border/60" {...props}>
          {children}
        </code>
      )
    }
    return (
      <div className="my-2.5 rounded-xl bg-muted/90 p-3.5 font-mono text-xs text-foreground overflow-x-auto border border-border">
        <code {...props}>{children}</code>
      </div>
    )
  },
  hr: () => <hr className="my-4 border-border/60" />,
}

export default function JunfueAIPage() {
  const { data: stores } = useStores()
  const [selectedStore, setSelectedStore] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('today')
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [input])

  const getDateContext = (preset: string) => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    if (preset === 'today') {
      return { from: todayStr, to: todayStr }
    } else if (preset === '7d') {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      return { from: d.toISOString().split('T')[0], to: todayStr }
    } else if (preset === 'month') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from: d.toISOString().split('T')[0], to: todayStr }
    }
    return { from: todayStr, to: todayStr }
  }

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim()
    if (!query || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)
    setStatusText('Consulting Jun Fue AI...')

    // Format chat history payload for API
    const historyPayload = newMessages.map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      text: m.content,
    }))

    try {
      const dateCtx = getDateContext(dateFilter)
      const res = await fetch('/api/junfue-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          storeId: selectedStore,
          dateContext: dateCtx,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Server returned error (${res.status})`)
      }

      const data = await res.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'No response generated.',
        toolsUsed: data.toolsUsed || [],
        suggestions: data.suggestions || [],
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      console.error('Chat error:', err)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ **Unable to process query**: ${err.message || 'An unexpected error occurred. Please verify your connection or try again.'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setStatusText('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleClearChat = () => {
    setMessages([])
  }

  const allBranches = [
    { id: 'all', name: 'All Branches' },
    ...(stores?.map((s) => ({ id: s.store_id, name: s.store_name || 'Unnamed Store' })) || []),
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] animate-fade-in -m-4 sm:-m-6">
      {/* Top Header / Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary via-blue-600 to-violet-600 text-white shadow-md shadow-primary/25">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground tracking-tight">Jun Fue AI</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Database Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Executive Retail Advisor & Forensic Audit Intelligence
            </p>
          </div>
        </div>

        {/* Controls: Store filter, Date filter, Clear chat */}
        <div className="flex items-center gap-2.5">
          {/* Store Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:border-primary/40 transition-colors">
            <Store className="h-3.5 w-3.5 text-primary" />
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-transparent border-none outline-none text-foreground cursor-pointer pr-1 font-medium"
            >
              {allBranches.map((b) => (
                <option key={b.id} value={b.id} className="bg-card text-foreground">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Context */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:border-primary/40 transition-colors">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-foreground cursor-pointer pr-1 font-medium"
            >
              <option value="today" className="bg-card text-foreground">Today</option>
              <option value="7d" className="bg-card text-foreground">Last 7 Days</option>
              <option value="month" className="bg-card text-foreground">This Month</option>
            </select>
          </div>

          {/* Reset / Clear */}
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all shadow-xs"
              title="Clear chat history"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-8 animate-fade-in">
            {/* Hero Welcome */}
            <div className="text-center space-y-3.5">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/10 to-violet-500/20 border border-primary/25 shadow-md shadow-primary/10 mb-1">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                How can Jun Fue AI elevate your business today?
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Ask executive questions about gross sales, net profit margins, inventory dead stocks, or execute real-time forensic audits for suspicious discounts and cashouts.
              </p>
            </div>

            {/* Starter Prompt Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {STARTER_PROMPTS.map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(starter.prompt)}
                  className="group relative flex flex-col justify-between p-5 rounded-2xl border border-border/80 bg-card text-left transition-all duration-200 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={cn("p-2.5 rounded-xl border shadow-xs", starter.color)}>
                        <starter.icon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-accent text-muted-foreground border border-border/50">
                        {starter.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        {starter.title}
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" />
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        {starter.desc}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 sm:gap-4 animate-fade-in',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {/* Assistant Avatar */}
                {message.role === 'assistant' && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary via-blue-600 to-violet-600 text-white shadow-md shadow-primary/20 mt-0.5">
                    <Bot className="h-5 w-5" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5',
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-primary to-blue-600 text-white ml-12 rounded-tr-xs shadow-md shadow-primary/10'
                      : 'bg-card border border-border text-foreground rounded-tl-xs shadow-md shadow-black/5'
                  )}
                >
                  {/* Assistant Header Badge & Tool Execution Bar */}
                  {message.role === 'assistant' && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground tracking-tight">Jun Fue AI</span>
                        <span className="text-[10px] font-medium text-muted-foreground bg-accent px-2 py-0.5 rounded-full border border-border/40">
                          Executive Analysis
                        </span>
                      </div>

                      {/* Tool Execution Badges */}
                      {message.toolsUsed && message.toolsUsed.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Database className="h-3 w-3 text-primary" />
                          {message.toolsUsed.map((t, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary border border-primary/20"
                              title={t.summary}
                            >
                              {t.name.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Content with Custom High-Readability Markdown Renderers */}
                  <div className={cn(
                    'text-sm leading-relaxed',
                    message.role === 'user' ? 'text-white' : 'text-foreground'
                  )}>
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap font-medium">{message.content}</p>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>

                  {/* Suggestions Pills (Assistant only) */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="pt-3 border-t border-border/50 space-y-2">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-primary" />
                        Next Recommended Inquiries:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendMessage(suggestion)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium rounded-xl border border-primary/25 bg-primary/5 px-3 py-1.5 text-primary hover:bg-primary/15 hover:border-primary/40 transition-all text-left shadow-2xs active:scale-98"
                          >
                            <span>{suggestion}</span>
                            <ArrowRight className="h-3 w-3 shrink-0 opacity-70" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                    <span className="font-mono text-[10px]">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-accent hover:text-foreground transition-all font-medium text-[11px]"
                        title="Copy response"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-500 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {message.role === 'user' && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent border border-border text-foreground font-semibold shadow-xs mt-0.5">
                    <UserIcon className="h-5 w-5 text-primary" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading / Thinking Indicator */}
            {isLoading && (
              <div className="flex gap-3 sm:gap-4 animate-fade-in">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary via-blue-600 to-violet-600 text-white shadow-md shadow-primary/20">
                  <Bot className="h-5 w-5 animate-pulse" />
                </div>
                <div className="rounded-2xl rounded-tl-xs p-4 bg-card border border-border shadow-md space-y-2.5 max-w-md">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>{statusText || 'Jun Fue AI is querying database and analyzing trends...'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form Bar */}
      <footer className="p-4 border-t border-border bg-card/90 backdrop-blur-md shadow-xs">
        <div className="max-w-4xl mx-auto space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="relative flex items-end gap-2 rounded-2xl border border-input bg-background p-2 shadow-inner focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Jun Fue AI about sales, profit, finances, anomalous transactions, or business advice..."
              rows={1}
              className="flex-1 max-h-36 resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white shadow-md shadow-primary/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              title="Send message (Enter)"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2">
            <span>
              Press <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground font-semibold">Enter</kbd> to send, <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground font-semibold">Shift+Enter</kbd> for newline
            </span>
            <span className="hidden sm:inline font-medium">
              Jun Fue AI • Real-time DB Grounding Engine
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
