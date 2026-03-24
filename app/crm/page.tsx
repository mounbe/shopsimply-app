'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Phone, MapPin, ShoppingBag, TrendingUp, Users, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { CRMSkeleton } from '@/components/ui/Skeleton'

// ── Types ────────────────────────────────────
type Tag = 'VIP' | 'Fidèle' | 'Nouveau' | 'À relancer' | string

interface Client {
  id: string
  name: string
  phone: string | null
  city: string | null
  total_orders: number
  total_spent: number
  last_order_at: string | null
  tags: string[]
}

// ── Tag config ───────────────────────────────
const TAG_CONFIG: Record<string, { bg: string; text: string }> = {
  'VIP':        { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Fidèle':     { bg: 'bg-green-100', text: 'text-green-700' },
  'Nouveau':    { bg: 'bg-blue-100',  text: 'text-blue-700' },
  'À relancer': { bg: 'bg-red-100',   text: 'text-red-600' },
}

function tagStyle(tag: string) {
  return TAG_CONFIG[tag] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }
}

// ── KPI Stats ────────────────────────────────
interface Stats {
  totalClients: number
  totalOrders: number
  totalRevenue: number
  confirmationRate: number
}

export default function CRMPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<Stats>({ totalClients: 0, totalOrders: 0, totalRevenue: 0, confirmationRate: 0 })
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [clientsRes, ordersRes] = await Promise.all([
      supabase
        .from('clients')
        .select('id, name, phone, city, total_orders, total_spent, last_order_at, tags')
        .eq('user_id', user.id)
        .order('last_order_at', { ascending: false }),
      supabase
        .from('orders')
        .select('id, status, amount')
        .eq('user_id', user.id),
    ])

    const clientList = clientsRes.data || []
    const orderList = ordersRes.data || []

    const totalRevenue = orderList.filter(o => o.status === 'delivered').reduce((s, o) => s + o.amount, 0)
    const confirmedOrders = orderList.filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status)).length
    const confirmationRate = orderList.length > 0 ? Math.round((confirmedOrders / orderList.length) * 100) : 0

    setClients(clientList)
    setStats({
      totalClients: clientList.length,
      totalOrders: orderList.length,
      totalRevenue,
      confirmationRate,
    })
    setLoading(false)
  }

  const filtered = clients.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
    const matchTag = !activeTag || c.tags.includes(activeTag)
    return matchSearch && matchTag
  })

  const allTags = ['VIP', 'Fidèle', 'Nouveau', 'À relancer']

  if (loading) return <CRMSkeleton />

  // ── Empty state ──────────────────────────────
  const hasNoClients = clients.length === 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-navy px-5 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-white">CRM Clients</h1>
            <p className="text-blue-200 text-xs mt-0.5">{stats.totalClients} client{stats.totalClients !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/crm/nouveau"
            className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/30"
          >
            <Plus className="w-5 h-5 text-white" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Users className="w-3.5 h-3.5" />, label: 'Total clients', value: stats.totalClients.toString() },
            { icon: <ShoppingBag className="w-3.5 h-3.5" />, label: 'Commandes', value: stats.totalOrders.toString() },
            { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Taux confirm.', value: `${stats.confirmationRate}%` },
            { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'CA livré', value: `${stats.totalRevenue.toLocaleString('fr-MA')} MAD` },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-blue-200 text-[10px] font-semibold mb-1">
                {s.icon} {s.label}
              </div>
              <div className="text-white font-black text-lg leading-tight">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-4 space-y-3 max-w-2xl mx-auto w-full">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>

        {/* Tag filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all',
              !activeTag ? 'bg-navy text-white' : 'bg-white text-gray-500 border border-gray-200'
            )}
          >
            Tous
          </button>
          {allTags.map(tag => {
            const s = tagStyle(tag)
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all',
                  activeTag === tag ? `${s.bg} ${s.text} ring-2 ring-offset-1 ring-current` : 'bg-white text-gray-500 border border-gray-200'
                )}
              >
                {tag}
              </button>
            )
          })}
        </div>

        {/* Empty state */}
        {hasNoClients && (
          <div className="card text-center py-12">
            <div className="text-5xl mb-3">👥</div>
            <div className="font-bold text-navy mb-1">Aucun client encore</div>
            <p className="text-sm text-gray-400 mb-4">
              Tes clients apparaîtront ici dès que tu reçois des commandes ou que tu les ajoutes manuellement.
            </p>
            <Link href="/crm/nouveau" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Ajouter un client
            </Link>
          </div>
        )}

        {/* No results */}
        {!hasNoClients && filtered.length === 0 && (
          <div className="card text-center py-8">
            <div className="text-3xl mb-2">🔍</div>
            <div className="font-semibold text-navy">Aucun résultat</div>
            <p className="text-sm text-gray-400">Modifie ta recherche ou tes filtres.</p>
          </div>
        )}

        {/* Client cards */}
        {filtered.map(client => (
          <Link
            key={client.id}
            href={`/crm/${client.id}`}
            className="card flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-navy to-navy/70 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
              {client.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-navy text-sm truncate">{client.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                {client.phone && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {client.phone}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {client.city && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" /> {client.city}
                  </span>
                )}
                {client.tags.slice(0, 2).map(tag => {
                  const s = tagStyle(tag)
                  return (
                    <span key={tag} className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', s.bg, s.text)}>
                      {tag}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Stats + WhatsApp */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {client.phone && (
                <a
                  href={`https://wa.me/${client.phone.replace(/\s+/g, '').replace('+', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center shadow-sm hover:bg-green-600 transition-colors"
                >
                  <span className="text-white text-sm">💬</span>
                </a>
              )}
              <div className="text-right">
                <div className="font-black text-accent text-xs">{client.total_spent.toLocaleString('fr-MA')} MAD</div>
                <div className="text-[10px] text-gray-400">{client.total_orders} cmd{client.total_orders > 1 ? 's' : ''}</div>
              </div>
            </div>
          </Link>
        ))}

        {filtered.length > 0 && (
          <p className="text-center text-xs text-gray-300 pb-2">
            {filtered.length} client{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="flex border-t border-gray-100 bg-white py-2 sticky bottom-0">
        {[
          { href: '/dashboard', icon: '🏠', label: 'Accueil', active: false },
          { href: '/plan', icon: '📋', label: 'Plan', active: false },
          { href: '/assistant', icon: '🤖', label: 'IA', active: false },
          { href: '/crm', icon: '👥', label: 'CRM', active: true },
          { href: '/profil', icon: '⚙️', label: 'Profil', active: false },
        ].map(item => (
          <Link key={item.label} href={item.href} className="flex-1 flex flex-col items-center gap-0.5 py-1">
            <span className="text-xl">{item.icon}</span>
            <span className={cn('text-[10px] font-bold', item.active ? 'text-accent' : 'text-gray-400')}>
              {item.label}
            </span>
            {item.active && <div className="w-1 h-1 rounded-full bg-accent" />}
          </Link>
        ))}
      </nav>
    </div>
  )
}
