'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/Skeleton'

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'cancelled'
type ViewMode = 'list' | 'kanban'

interface Order {
  id: string
  reference: string | null
  product_name: string | null
  amount: number
  status: OrderStatus
  city: string | null
  created_at: string
  client_id: string | null
  clients: { name: string; phone: string | null } | null
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
  pending:   { label: 'En attente',  color: 'text-amber-700',  bg: 'bg-amber-50',    border: 'border-amber-200',  icon: '⏳' },
  confirmed: { label: 'Confirmée',   color: 'text-blue-700',   bg: 'bg-blue-50',     border: 'border-blue-200',   icon: '✅' },
  shipped:   { label: 'Expédiée',    color: 'text-purple-700', bg: 'bg-purple-50',   border: 'border-purple-200', icon: '🚚' },
  delivered: { label: 'Livrée',      color: 'text-green-700',  bg: 'bg-green-50',    border: 'border-green-200',  icon: '✓' },
  returned:  { label: 'Retournée',   color: 'text-red-700',    bg: 'bg-red-50',      border: 'border-red-200',    icon: '↩️' },
  cancelled: { label: 'Annulée',     color: 'text-gray-500',   bg: 'bg-gray-50',     border: 'border-gray-200',   icon: '✕' },
}

const PIPELINE: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered']

export default function CommandesPage() {
  const supabase = createClient()
  const { success, error: toastError } = useToast()

  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [view, setView] = useState<ViewMode>('list')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('orders')
      .select('id, reference, product_name, amount, status, city, created_at, client_id, clients(name, phone)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setOrders((data as Order[]) || [])
    setLoading(false)
  }

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId)
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) toastError('Erreur mise à jour')
    else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      success(`Commande → ${STATUS_CONFIG[newStatus].label}`)
    }
    setUpdatingId(null)
  }

  const filtered = statusFilter ? orders.filter(o => o.status === statusFilter) : orders

  const pendingCount = orders.filter(o => o.status === 'pending').length
  const todayRevenue = orders
    .filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status) &&
      o.created_at.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((s, o) => s + o.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-navy px-5 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-white">Commandes</h1>
            <p className="text-blue-200 text-xs mt-0.5">
              {pendingCount > 0 ? `⚠️ ${pendingCount} en attente de confirmation` : `${orders.length} commande${orders.length !== 1 ? 's' : ''} au total`}
            </p>
          </div>
          <Link href="/crm/commandes/nouveau" className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/30">
            <Plus className="w-5 h-5 text-white" />
          </Link>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <div className="text-white font-black text-lg">{pendingCount}</div>
            <div className="text-blue-200 text-[10px]">En attente</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <div className="text-white font-black text-lg">{orders.filter(o => o.status === 'delivered').length}</div>
            <div className="text-blue-200 text-[10px]">Livrées</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <div className="text-accent font-black text-sm">{todayRevenue > 0 ? `${todayRevenue} MAD` : '—'}</div>
            <div className="text-blue-200 text-[10px]">CA aujourd'hui</div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {/* View toggle + filtres */}
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
            <button onClick={() => setView('list')} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', view === 'list' ? 'bg-navy text-white' : 'text-gray-500')}>
              📋 Liste
            </button>
            <button onClick={() => setView('kanban')} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', view === 'kanban' ? 'bg-navy text-white' : 'text-gray-500')}>
              🗂️ Kanban
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {([null, 'pending', 'confirmed', 'shipped', 'delivered', 'returned'] as (OrderStatus | null)[]).map(s => (
              <button key={s ?? 'all'} onClick={() => setStatusFilter(s)}
                className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                  statusFilter === s ? 'bg-navy text-white border-navy' : 'bg-white text-gray-500 border-gray-200')}>
                {s === null ? 'Toutes' : STATUS_CONFIG[s].icon + ' ' + STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && [1,2,3,4].map(i => (
          <div key={i} className="card flex items-center gap-3">
            <Skeleton className="flex-1 h-12" />
          </div>
        ))}

        {/* Empty */}
        {!loading && orders.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-5xl mb-3">📦</div>
            <div className="font-bold text-navy mb-1">Aucune commande</div>
            <p className="text-sm text-gray-400 mb-4">Saisis ta première commande manuellement ou connecte ta boutique.</p>
            <Link href="/crm/commandes/nouveau" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nouvelle commande
            </Link>
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {!loading && view === 'list' && filtered.map(order => {
          const cfg = STATUS_CONFIG[order.status]
          return (
            <div key={order.id} className={cn('card border-l-4', `border-l-${order.status === 'pending' ? 'amber' : order.status === 'confirmed' ? 'blue' : order.status === 'shipped' ? 'purple' : order.status === 'delivered' ? 'green' : order.status === 'returned' ? 'red' : 'gray'}-400`)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-navy text-sm">{order.reference || order.id.slice(0,8).toUpperCase()}</span>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.bg, cfg.color, cfg.border)}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {order.clients?.name || 'Client inconnu'} · {order.city || '—'} · {order.product_name || 'Produit'}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('fr-MA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="font-black text-accent">{order.amount} MAD</div>
                  {order.clients?.phone && (
                    <a href={`https://wa.me/${order.clients.phone.replace(/\s+/g,'').replace('+','')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-green-600 font-semibold mt-0.5 block hover:underline">
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              {order.status === 'pending' && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                  <button onClick={() => updateStatus(order.id, 'confirmed')} disabled={updatingId === order.id}
                    className="flex-1 bg-blue-500 text-white text-xs font-bold py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                    ✅ Confirmer
                  </button>
                  <button onClick={() => updateStatus(order.id, 'cancelled')} disabled={updatingId === order.id}
                    className="flex-1 bg-gray-100 text-gray-500 text-xs font-bold py-2 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">
                    ✕ Annuler
                  </button>
                </div>
              )}
              {order.status === 'confirmed' && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                  <button onClick={() => updateStatus(order.id, 'shipped')} disabled={updatingId === order.id}
                    className="flex-1 bg-purple-500 text-white text-xs font-bold py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                    🚚 Marquer expédiée
                  </button>
                </div>
              )}
              {order.status === 'shipped' && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                  <button onClick={() => updateStatus(order.id, 'delivered')} disabled={updatingId === order.id}
                    className="flex-1 bg-green-500 text-white text-xs font-bold py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                    ✓ Marquer livrée
                  </button>
                  <button onClick={() => updateStatus(order.id, 'returned')} disabled={updatingId === order.id}
                    className="flex-1 bg-red-100 text-red-600 text-xs font-bold py-2 rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50">
                    ↩️ Retour
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* ── KANBAN VIEW ── */}
        {!loading && view === 'kanban' && (
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
            {PIPELINE.map(status => {
              const cfg = STATUS_CONFIG[status]
              const col = orders.filter(o => o.status === status)
              return (
                <div key={status} className="flex-shrink-0 w-56">
                  <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl mb-2', cfg.bg, 'border', cfg.border)}>
                    <span>{cfg.icon}</span>
                    <span className={cn('text-xs font-black', cfg.color)}>{cfg.label}</span>
                    <span className={cn('ml-auto text-xs font-black w-5 h-5 rounded-full flex items-center justify-center bg-white', cfg.color)}>{col.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.length === 0 && (
                      <div className="text-center py-4 text-xs text-gray-300 bg-white rounded-xl border border-dashed border-gray-200">
                        Vide
                      </div>
                    )}
                    {col.map(order => (
                      <div key={order.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="font-bold text-navy text-xs truncate">{order.reference || order.id.slice(0,8).toUpperCase()}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5 truncate">{order.clients?.name || '—'}</div>
                        <div className="text-[10px] text-gray-400 truncate">{order.product_name || '—'}</div>
                        <div className="font-black text-accent text-xs mt-1">{order.amount} MAD</div>
                        {status === 'pending' && (
                          <button onClick={() => updateStatus(order.id, 'confirmed')} disabled={updatingId === order.id}
                            className="w-full mt-2 bg-blue-500 text-white text-[10px] font-bold py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                            ✅ Confirmer
                          </button>
                        )}
                        {status === 'confirmed' && (
                          <button onClick={() => updateStatus(order.id, 'shipped')} disabled={updatingId === order.id}
                            className="w-full mt-2 bg-purple-500 text-white text-[10px] font-bold py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                            🚚 Expédier
                          </button>
                        )}
                        {status === 'shipped' && (
                          <button onClick={() => updateStatus(order.id, 'delivered')} disabled={updatingId === order.id}
                            className="w-full mt-2 bg-green-500 text-white text-[10px] font-bold py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                            ✓ Livré
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
