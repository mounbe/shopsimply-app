'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Send, ArrowLeft, Sparkles, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// ── Quick action prompts ──────────────────────────────
const QUICK_ACTIONS = [
  {
    id: 'fiche_produit',
    icon: '📝',
    label: 'Fiche produit',
    prompt: 'Génère-moi une fiche produit optimisée pour [nom du produit]. Inclus le titre, la description courte, les avantages clés et un CTA adapté au marché marocain.',
  },
  {
    id: 'pub_facebook',
    icon: '📣',
    label: 'Texte pub Facebook',
    prompt: 'Écris-moi un texte publicitaire pour Facebook Ads pour mon produit. Adapté au public marocain, avec accroche, avantages et CTA fort. Ton : direct et percutant.',
  },
  {
    id: 'ciblage',
    icon: '🎯',
    label: 'Ciblage Facebook',
    prompt: "Donne-moi une stratégie de ciblage Facebook Ads pour ma niche. Inclus les centres d'intérêt, les tranches d'âge, les villes marocaines prioritaires et le budget recommandé.",
  },
  {
    id: 'prix',
    icon: '💰',
    label: 'Stratégie prix',
    prompt: 'Aide-moi à définir ma stratégie de prix pour mon produit. Comment calculer ma marge en COD, les frais de livraison Amana, et le prix de vente optimal pour le marché marocain.',
  },
  {
    id: 'relance_cod',
    icon: '📱',
    label: 'Script relance COD',
    prompt: "Écris-moi un script WhatsApp pour relancer un client qui n'a pas confirmé sa commande COD. Court, poli, efficace. En darija ou français selon le client.",
  },
  {
    id: 'fournisseur',
    icon: '🏭',
    label: 'Trouver fournisseur',
    prompt: "Comment trouver un fournisseur fiable pour ma niche en dropshipping ? Donne-moi les meilleures plateformes, les critères de sélection et un template de message pour les contacter.",
  },
]

// ── Types ─────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UserContext {
  userName: string
  niche: string
  model: string
  platform: string
  progress: number
  currentWeek: number
}

const DEFAULT_CONTEXT: UserContext = {
  userName: 'toi',
  niche: 'e-commerce Maroc',
  model: 'Dropshipping',
  platform: 'Youcan',
  progress: 0,
  currentWeek: 1,
}

// ── Message bubble ─────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-teal-brand flex items-center justify-center text-base flex-shrink-0 mt-1">
          🤖
        </div>
      )}
      <div className={cn('max-w-[85%] group', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-accent text-white rounded-br-sm'
              : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
          )}
        >
          {message.content.split('\n').map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </div>
        {!isUser && (
          <button
            onClick={copyToClipboard}
            className="mt-1 flex items-center gap-1 text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:text-gray-600"
          >
            {copied ? (
              <><Check className="w-3 h-3 text-green-500" /> Copié</>
            ) : (
              <><Copy className="w-3 h-3" /> Copier</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-teal-brand flex items-center justify-center text-base flex-shrink-0">
        🤖
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 150, 300].map(delay => (
            <div
              key={delay}
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main page (inner) ─────────────────────────────────
function AssistantInner() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const taskParam = searchParams.get('task')

  const [context, setContext] = useState<UserContext>(DEFAULT_CONTEXT)
  const [contextLoaded, setContextLoaded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [showQuickActions, setShowQuickActions] = useState(!taskParam)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load real user context from Supabase
  useEffect(() => {
    const loadContext = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setContextLoaded(true); return }

      const [profileRes, planRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single(),
        supabase
          .from('plans')
          .select('progress_pct, current_week, niche, model, platform')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
      ])

      const firstName = profileRes.data?.full_name?.split(' ')[0] || 'toi'
      const plan = planRes.data

      const ctx: UserContext = {
        userName: firstName,
        niche: plan?.niche || 'e-commerce Maroc',
        model: plan?.model || 'Dropshipping',
        platform: plan?.platform || 'Youcan',
        progress: plan?.progress_pct || 0,
        currentWeek: plan?.current_week || 1,
      }
      setContext(ctx)
      setContextLoaded(true)

      // Build initial greeting message
      const greeting: Message = {
        id: '0',
        role: 'assistant',
        content: taskParam
          ? `Salam ${firstName} ! 👋\n\nTu veux de l'aide pour :\n\n« ${taskParam} »\n\nC'est parti, dis-moi ce que tu veux accomplir exactement et je t'accompagne pas à pas.`
          : `Salam ${firstName} ! 👋\n\nJe suis ShopAI, ton assistant e-commerce personnel. Je connais ta boutique ${plan ? `de ${plan.niche} sur ${plan.platform}` : 'au Maroc'}.\n\nTu es en semaine ${plan?.current_week || 1} — ${plan?.progress_pct || 0}% accompli. Comment je peux t'aider aujourd'hui ?`,
        timestamp: new Date(),
      }
      setMessages([greeting])

      // If ?task= is set, pre-fill input
      if (taskParam) {
        setInput(`Aide-moi à accomplir cette tâche : ${taskParam}`)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }

    loadContext()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)
    setStreamingContent('')
    setShowQuickActions(false)

    if (inputRef.current) inputRef.current.style.height = 'auto'

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context,
        }),
      })

      if (!response.ok) throw new Error('API error')
      if (!response.body) throw new Error('No body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                fullContent += parsed.text
                setStreamingContent(fullContent)
              }
            } catch {}
          }
        }
      }

      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: fullContent, timestamp: new Date() },
      ])
      setStreamingContent('')
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Désolé, une erreur s'est produite. Réessaie dans quelques secondes.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  if (!contextLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-navy px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/dashboard" className="text-blue-200 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 rounded-full bg-teal-brand flex items-center justify-center text-lg flex-shrink-0">
          🤖
        </div>
        <div className="flex-1">
          <div className="text-white font-bold text-sm">ShopAI</div>
          <div className="text-teal-brand text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-teal-brand rounded-full animate-pulse" />
            En ligne · Répond en FR &amp; Darija
          </div>
        </div>
        <div className="bg-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-semibold truncate max-w-[100px]">
          {context.niche.split(' ').slice(0, 2).join(' ')}
        </div>
      </div>

      {/* Context bar */}
      <div className="bg-navy/5 border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {[
          { icon: '🛒', label: context.platform },
          { icon: '🚚', label: context.model },
          { icon: '📊', label: `${context.progress}% accompli` },
          { icon: '📅', label: `Sem. ${context.currentWeek}` },
        ].map(item => (
          <span
            key={item.label}
            className="flex items-center gap-1 bg-white border border-gray-100 rounded-full px-3 py-1 text-xs font-semibold text-navy whitespace-nowrap shadow-sm"
          >
            {item.icon} {item.label}
          </span>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming */}
        {streamingContent && (
          <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-teal-brand flex items-center justify-center text-base flex-shrink-0 mt-1">
              🤖
            </div>
            <div className="max-w-[85%] bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed text-gray-800 shadow-sm">
              {streamingContent.split('\n').map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
              <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse align-middle" />
            </div>
          </div>
        )}

        {isLoading && !streamingContent && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-bold text-gray-500">Actions rapides</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.id}
                onClick={() => sendMessage(action.prompt)}
                className="flex-shrink-0 flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-navy hover:border-accent hover:bg-orange-50 transition-all"
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-accent transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Pose ta question ou tape une action..."
              rows={1}
              className="w-full bg-transparent text-sm text-navy placeholder-gray-400 resize-none focus:outline-none leading-relaxed"
              style={{ maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className={cn(
              'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all',
              input.trim() && !isLoading
                ? 'bg-accent text-white hover:opacity-90 shadow-md shadow-accent/30'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
        </p>
      </div>
    </div>
  )
}

// ── Page export (Suspense boundary pour useSearchParams) ──
export default function AssistantPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-brand border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AssistantInner />
    </Suspense>
  )
}
