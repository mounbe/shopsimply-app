'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, MapPin, MessageCircle, Bot, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { ClientDetailSkeleton } from '@/components/ui/Skeleton'

// ── Types ─────────────────────────────────────────────
type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'cancelled'

interface Order {
  id: string
  reference: string | null
  product_name: string | null
  amount: number
  status: OrderStatus
  payment_method: string | null
  created_at: string
}

interface Client {
  id: string
  name: string
  phone: string | null
  city: string | null
  email: string | null
  total_orders: number
  total_spent: number
  tags: string[]
  notes: string | null
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:   { label: 'En attente',  color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',   icon: '⏳' },
  confirmed: { label: 'Confirmée',   color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     icon: '✅' },
  shipped:   { label: 'Expédiée',    color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: '🚚' },
  delivered: { label: 'Livrée',      color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   icon: '✓' },
  returned:  { label: 'Retournée',   color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       icon: '↩️' },
  cancelled: { label: 'Annulée',     color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200',     icon: '✕' },
}

const WA_TEMPLATES = [
  {
    id: 'confirm',
    label: '📦 Confirmer commande',
    text: (name: string) =>
      `السلام عليكم ${name.split(' ')[0]} 😊\nكنتواصل معاك من ShopSimply بخصوص طلبيتك.\nواش تقدري تأكدي لنا الطلبية باش نبعتوها ليك؟\nشكرا 🙏`,
  },
  {
    id: 'shipped',
    label: '🚚 Commande expédiée',
    text: (name: string) =>
      `Bonjour ${name.split(' ')[0]} ! 😊\nVotre commande a été expédiée via Amana Express.\nNuméro de suivi : [TRACKING]\nLivraison prévue dans 24-48h.\nMerci pour votre confiance ! 🛍️`,
  },
  {
    id: 'feedback',
    label: '⭐ Demander avis',
    text: (name: string) =>
      `Salam ${name.split(' ')[0]}! J'espère que tu as bien reçu ta commande 😊\nComment tu trouves le produit ? Ton avis nous aide beaucoup !\nSi tu as aimé, n'hésite pas à le partager avec tes amis 🌸`,
  },
  {
    id: 'promo',
    label: '🎁 Offre fidélité',
    text: (name: string) =>
      `Salam ${name.split(' ')[0]}! 🎉\nEn tant que client(e) fidèle, on t'offre -15% sur ta prochaine commande.\nCode : VIP15\nValable jusqu'au 31/03. Profites-en ! 💫`,
  },
]

function CopiedButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
    </button>
  )
}

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const { success, error: toastError } = useToast()

  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<Client | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [activeTab, setActiveTab] = useState<'commandes' | 'relances' | 'notes'>('commandes')
  const [aiScript, setAiScript] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    const [clientRes, ordersRes] = await Promise.all([
      supabase
        .from('clients')
        .select('id, name, phone, city, email, total_orders, total_spent, tags, notes')
        .eq('id', id)
        .single(),
      supabase
        .from('orders')
        .select('id, reference, product_name, amount, status, payment_method, created_at')
        .eq('client_id', id)
        .order('created_at', { ascending: false }),
    ])

    if (clientRes.data) {
      setClient(clientRes.data)
      setNotes(clientRes.data.notes || '')
    }
    setOrders(ordersRes.data || [])
    setLoading(false)
  }

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrder(orderId)
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) {
      toastError('Erreur lors de la mise à jour du statut')
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      success(`Commande passée en "${STATUS_CONFIG[newStatus].label}"`)
    }
    setUpdatingOrder(null)
  }

  const saveNotes = async () => {
    if (!client) return
    setSavingNotes(true)
    const { error } = await supabase
      .from('clients')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', client.id)

    if (error) toastError('Erreur lors de la sauvegarde')
    else success('Notes sauvegardées !')
    setSavingNotes(false)
  }

  const generateAIScript = async () => {
    if (!client) return
    setLoadingAI(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Génère un message WhatsApp personnalisé en darija marocaine pour relancer le/la client(e) ${client.name} de ${client.city || 'Maroc'}. Il/elle a commandé ${client.total_orders} fois pour un total de ${client.total_spent} MAD. Message court, chaleureux, en darija, avec une offre ou une relance douce.`,
          }],
          context: { userName: 'ShopSimply', niche: 'e-commerce', platform: 'Youcan' },
        }),
      })

      if (!response.body) return
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6))
              if (parsed.text) content += parsed.text
            } catch {}
          }
        }
      }
      setAiScript(content)
    } catch {
      toastError("Erreur lors de la génération du script IA")
    } finally {
      setLoadingAI(false)
    }
  }

  if (loading) return <ClientDetailSkeleton />

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="text-4xl mb-3">❓</div>
        <div className="font-bold text-navy mb-1">Client introuvable</div>
        <Link href="/crm" className="btn-primary mt-4 inline-block">← Retour au CRM</Link>
      </div>
    )
  }

  const whatsappBase = client.phone
    ? `https://wa.me/${client.phone.replace(/\s+/g, '').replace('+', '')}`
    : null

  const deliveredOrders = orders.filter(o => o.status === 'delivered').length
  const conversionRate = orders.length > 0
    ? Math.round((deliveredOrders / orders.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-navy px-5 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="text-blue-200 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-black text-base truncate">{client.name}</h1>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {client.city && (
                <span className="text-blue-200 text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {client.city}
                </span>
              )}
              {client.phone && (
                <span className="text-blue-200 text-xs flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {client.phone}
                </span>
              )}
            </div>
          </div>
          {whatsappBase && (
            <a
              href={whatsappBase}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white text-lg hover:opacity-90 transition-opacity flex-shrink-0"
            >
              💬
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-white font-black text-lg">{client.total_orders}</div>
            <div className="text-blue-200 text-[10px]">Commandes</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className="text-white font-black text-lg">{client.total_spent.toLocaleString('fr-MA')}</div>
            <div className="text-blue-200 text-[10px]">MAD dépensés</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <div className={cn('font-black text-lg', conversionRate >= 80 ? 'text-green-400' : 'text-amber-300')}>
              {conversionRate}%
            </div>
            <div className="text-blue-200 text-[10px]">Taux livraison</div>
          </div>
        </div>

        {/* Tags */}
        {client.tags.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {client.tags.map(tag => (
              <span key={tag} className="bg-white/15 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100">
        {([
          { id: 'commandes', label: '📦 Commandes' },
          { id: 'relances', label: '💬 Relances' },
          { id: 'notes', label: '📝 Notes' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 py-3 text-sm font-bold transition-colors border-b-2',
              activeTab === tab.id
                ? 'text-accent border-accent'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-3 pb-8">

        {/* COMMANDES */}
        {activeTab === 'commandes' && (
          <>
            {orders.length === 0 && (
              <div className="card text-center py-8">
                <div className="text-3xl mb-2">📦</div>
                <div className="font-semibold text-navy">Aucune commande</div>
                <p className="text-sm text-gray-400 mt-1">Les commandes de ce client apparaîtront ici.</p>
              </div>
            )}
            {orders.map(order => {
              const cfg = STATUS_CONFIG[order.status]
              return (
                <div key={order.id} className={cn('card border', cfg.bg)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-bold text-navy text-sm truncate">
                        {order.product_name || 'Produit'}
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        {order.reference || order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString('fr-MA')} · {order.payment_method || 'COD'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-black text-navy text-sm">{order.amount} MAD</div>
                      <div className={cn('text-xs font-bold mt-0.5', cfg.color)}>
                        {cfg.icon} {cfg.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {(['confirmed', 'shipped', 'delivered', 'returned', 'cancelled'] as OrderStatus[]).map(s => {
                      const sCfg = STATUS_CONFIG[s]
                      return (
                        <button
                          key={s}
                          disabled={order.status === s || updatingOrder === order.id}
                          onClick={() => updateOrderStatus(order.id, s)}
                          className={cn(
                            'text-[10px] font-bold px-2 py-1 rounded-lg border transition-all',
                            order.status === s
                              ? `${sCfg.bg} ${sCfg.color} border-current`
                              : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300',
                            updatingOrder === order.id && order.status !== s && 'opacity-50 cursor-wait'
                          )}
                        >
                          {sCfg.icon} {sCfg.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* RELANCES */}
        {activeTab === 'relances' && (
          <>
            <div className="bg-navy rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🤖</span>
                <div>
                  <div className="text-white font-bold text-sm">Script IA personnalisé</div>
                  <div className="text-blue-200 text-xs">Généré selon l'historique de {client.name.split(' ')[0]}</div>
                </div>
              </div>

              {aiScript && (
                <div className="bg-white/10 rounded-xl p-3 text-sm text-white leading-relaxed mb-3 whitespace-pre-line">
                  {aiScript}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={generateAIScript}
                  disabled={loadingAI}
                  className="flex-1 bg-accent text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {loadingAI ? (
                    <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Génération...</>
                  ) : (
                    <><Bot className="w-3.5 h-3.5" /> Générer script IA</>
                  )}
                </button>
                {aiScript && whatsappBase && (
                  <a
                    href={`${whatsappBase}?text=${encodeURIComponent(aiScript)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1 hover:opacity-90"
                  >
                    💬 Envoyer
                  </a>
                )}
              </div>
            </div>

            <div className="section-title">Templates prêts à envoyer</div>
            {WA_TEMPLATES.map(template => {
              const text = template.text(client.name)
              const waUrl = whatsappBase
                ? `${whatsappBase}?text=${encodeURIComponent(text)}`
                : null

              return (
                <div key={template.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-navy">{template.label}</span>
                    <CopiedButton text={text} />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 whitespace-pre-line">{text}</p>
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 bg-green-500 text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Envoyer sur WhatsApp
                    </a>
                  ) : (
                    <div className="text-center text-xs text-gray-400">Pas de numéro WhatsApp enregistré</div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* NOTES */}
        {activeTab === 'notes' && (
          <div className="card">
            <label className="section-title">Notes client</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ajoute des notes sur ce client (préférences, historique, informations utiles...)"
              rows={6}
              className="w-full text-sm text-gray-700 leading-relaxed resize-none focus:outline-none"
            />
            <div className="h-px bg-gray-100 my-3" />
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className={cn('btn-primary text-sm py-3', savingNotes && 'opacity-60')}
            >
              {savingNotes ? 'Sauvegarde...' : 'Enregistrer les notes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
