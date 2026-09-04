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
  TrendingUp, 
  Package, 
  Lightbulb, 
  ArrowRight,
  Database,
  RefreshCw
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
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    title: 'Financial & Sales Pulse',
    desc: 'Review gross sales, net profit, margins, and cash remaining for today.',
    prompt: 'How is my business performing today? Give me gross sales, net profit, total expenses, and margin breakdown.',
  },
  {
    icon: ShieldAlert,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    title: 'Audit & Anomaly Forensics',
    desc: 'Scan for extreme discounts (>25%), off-hours activity, and undocumented cashouts.',
    prompt: 'Audit my stores for suspicious transactions, excessive discounts, and abnormal expenses in the last 7 days.',
  },
  {
    icon: Package,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    title: 'Inventory & Product Health',
    desc: 'Identify top revenue drivers, dead stock items, and low stock warnings.',
    prompt: 'Which products are our top sellers, and which items are dead stock with zero sales?',
  },
  {
    icon: Lightbulb,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    title: 'Strategic Growth Advice',
    desc: 'Get data-backed strategies to optimize margins and reduce operating costs.',
    prompt: 'Analyze our current business data and give me 3 actionable strategies to boost net profit and reduce expenses.',
  },
]

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
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-violet-500 text-white shadow-md shadow-primary/20">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">Jun Fue AI</h1>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
                Live Data Engine
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Intelligent Executive Advisor & Forensic Audit Assistant
            </p>
          </div>
        </div>

        {/* Controls: Store filter, Date filter, Clear chat */}
        <div className="flex items-center gap-2.5">
          {/* Store Selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground">
            <Store className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-transparent border-none outline-none text-foreground cursor-pointer pr-1"
            >
              {allBranches.map((b) => (
                <option key={b.id} value={b.id} className="bg-card text-foreground">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Context */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-foreground cursor-pointer pr-1"
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
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
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
          <div className="max-w-3xl mx-auto py-8 sm:py-12 space-y-8 animate-fade-in">
            {/* Hero Welcome */}
            <div className="text-center space-y-3">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/10 to-violet-500/20 border border-primary/20 shadow-inner mb-2">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                How can Jun Fue AI assist your business today?
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                Ask anything about your store's sales, profit margins, inventory levels, or request a complete forensic audit for suspicious transactions.
              </p>
            </div>

            {/* Starter Prompt Cards */}
            <div className="grid sm:grid-cols-2 gap-3.5">
              {STARTER_PROMPTS.map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(starter.prompt)}
                  className="group flex flex-col justify-between p-4 rounded-xl border border-border bg-card text-left transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={cn("p-2 rounded-lg border", starter.color)}>
                        <starter.icon className="h-4 w-4" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {starter.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {starter.desc}
                    </p>
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
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-violet-500 text-white shadow-sm mt-0.5">
                    <Bot className="h-5 w-5" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-12 rounded-tr-xs'
                      : 'bg-card border border-border text-foreground rounded-tl-xs'
                  )}
                >
                  {/* Tools Used Badge (Assistant only) */}
                  {message.toolsUsed && message.toolsUsed.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-border/50 text-[11px] text-muted-foreground">
                      <Database className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium text-foreground">Data Analyzed:</span>
                      {message.toolsUsed.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-xs text-foreground font-mono text-[10px]"
                          title={t.summary}
                        >
                          {t.name.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className={cn(
                    'prose prose-sm max-w-none break-words dark:prose-invert',
                    message.role === 'user' ? 'text-primary-foreground prose-headings:text-primary-foreground' : 'text-foreground prose-table:text-xs'
                  )}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>

                  {/* Suggestions Pills (Assistant only) */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="pt-3 border-t border-border/40 space-y-1.5">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Suggested Follow-ups:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendMessage(suggestion)}
                            className="inline-flex items-center gap-1 text-xs rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-primary hover:bg-primary/10 transition-colors text-left"
                          >
                            <span>{suggestion}</span>
                            <ArrowRight className="h-3 w-3 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                    <span>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        title="Copy message"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
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
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent border border-border text-muted-foreground mt-0.5">
                    <UserIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading / Thinking Indicator */}
            {isLoading && (
              <div className="flex gap-3 sm:gap-4 animate-fade-in">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-violet-500 text-white shadow-sm">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="rounded-2xl rounded-tl-xs p-4 bg-card border border-border space-y-2">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
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
      <footer className="p-4 border-t border-border bg-card/80 backdrop-blur-md">
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              title="Send message (Enter)"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2">
            <span>
              Press <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">Enter</kbd> to send, <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">Shift+Enter</kbd> for newline
            </span>
            <span className="hidden sm:inline">
              Jun Fue AI powered by Gemini 2.5 & JunLink Real-time DB
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
