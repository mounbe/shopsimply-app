'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface DailyStat {
  date: string
  orders: number
  revenue: number
  confirmed: number
}

interface Summary {
  totalRevenue: number
  totalOrders: number
  deliveredOrders: number
  confirmationRate: number
  avgOrderValue: number
  revenueChange: number
  ordersChange: number
}

const BAR_MAX_HEIGHT = 80

export default function AnalyticsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7j' | '30j'>('7j')
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const days = period === '7j' ? 7 : 30
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data: orders } = await supabase
      .from('orders')
      .select('id, amount, status, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true })

    const orderList = orders || []

    // Group by day
    const byDay: Record<string, DailyStat> = {}
    for (let i = 0; i < days; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i))
      const key = d.toISOString().split('T')[0]
      byDay[key] = { date: key, orders: 0, revenue: 0, confirmed: 0 }
    }

    for (const o of orderList) {
      const key = o.created_at.split('T')[0]
      if (byDay[key]) {
        byDay[key].orders++
        if (['confirmed', 'shipped', 'delivered'].includes(o.status)) {
          byDay[key].revenue += o.amount
          byDay[key].confirmed++
        }
      }
    }

    const stats = Object.values(byDay)
    setDailyStats(stats)

    // Summary
    const totalOrders = orderList.length
    const deliveredOrders = orderList.filter(o => o.status === 'delivered').length
    const confirmedOrders = orderList.filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status)).length
    const totalRevenue = orderList
      .filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status))
      .reduce((s, o) => s + o.amount, 0)

    // Compare vs previous period
    const prevSince = new Date(since)
    prevSince.setDate(prevSince.getDate() - days)

    const { data: prevOrders } = await supabase
      .from('orders')
      .select('id, amount, status, created_at')
      .eq('user_id', user.id)
      .gte('created_at', prevSince.toISOString())
      .lt('created_at', since.toISOString())

    const prevList = prevOrders || []
    const prevRevenue = prevList
      .filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status))
      .reduce((s, o) => s + o.amount, 0)

    const revenueChange = prevRevenue > 0
      ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
      : totalRevenue > 0 ? 100 : 0

    const ordersChange = prevList.length > 0
      ? Math.round(((totalOrders - prevList.length) / prevList.length) * 100)
      : totalOrders > 0 ? 100 : 0

    setSummary({
      totalRevenue,
      totalOrders,
      deliveredOrders,
      confirmationRate: totalOrders > 0 ? Math.round((confirmedOrders / totalOrders) * 100) : 0,
      avgOrderValue: confirmedOrders > 0 ? Math.round(totalRevenue / confirmedOrders) : 0,
      revenueChange,
      ordersChange,
    })

    setLoading(false)
  }

  const maxRevenue = Math.max(...dailyStats.map(d => d.revenue), 1)
  const maxOrders  = Math.max(...dailyStats.map(d => d.orders), 1)

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return period === '7j'
      ? d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')
      : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-navy px-5 py-5">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard" className="text-blue-200 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">Analytics</h1>
            <p className="text-blue-200 text-xs mt-0.5">Tes performances e-commerce</p>
          </div>
          <div className="ml-auto flex bg-white/10 rounded-xl p-1 gap-1">
            {(['7j', '30j'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                  period === p ? 'bg-white text-navy' : 'text-white/60 hover:text-white'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 bg-white/20 rounded-2xl" />)}
          </div>
        ) : summary && (
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: 'CA confirmé',
                value: `${summary.totalRevenue.toLocaleString('fr-MA')} MAD`,
                change: summary.revenueChange,
              },
              {
                label: 'Commandes',
                value: summary.totalOrders.toString(),
                change: summary.ordersChange,
              },
              {
                label: 'Taux confirmation',
                value: `${summary.confirmationRate}%`,
                change: null,
              },
              {
                label: 'Panier moyen',
                value: `${summary.avgOrderValue} MAD`,
                change: null,
              },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white/10 rounded-2xl p-3">
                <div className="text-white font-black text-lg leading-tight">{kpi.value}</div>
                <div className="text-blue-200 text-xs mt-0.5">{kpi.label}</div>
                {kpi.change !== null && (
                  <div className={cn(
                    'text-xs font-bold mt-1 flex items-center gap-0.5',
                    kpi.change >= 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {kpi.change >= 0
                      ? <TrendingUp className="w-3 h-3" />
                      : <TrendingDown className="w-3 h-3" />}
                    {kpi.change >= 0 ? '+' : ''}{kpi.change}% vs période préc.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">

        {/* Graphe CA */}
        <div className="card">
          <h2 className="font-bold text-navy text-sm mb-4">💰 Chiffre d&apos;affaires — {period}</h2>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="flex items-end gap-1 h-24">
              {dailyStats.map(d => {
                const h = maxRevenue > 0 ? Math.round((d.revenue / maxRevenue) * BAR_MAX_HEIGHT) : 0
                const isToday = d.date === new Date().toISOString().split('T')[0]
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="relative w-full flex justify-center group">
                      {d.revenue > 0 && (
                        <div className="absolute bottom-full mb-1 bg-navy text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {d.revenue} MAD
                        </div>
                      )}
                      <div
                        className={cn(
                          'w-full rounded-t-md transition-all',
                          isToday ? 'bg-accent' : 'bg-navy/30'
                        )}
                        style={{ height: `${Math.max(h, d.revenue > 0 ? 4 : 2)}px` }}
                      />
                    </div>
                    <span className={cn('text-[9px] font-semibold', isToday ? 'text-accent' : 'text-gray-400')}>
                      {formatDate(d.date)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Graphe commandes */}
        <div className="card">
          <h2 className="font-bold text-navy text-sm mb-4">📦 Commandes — {period}</h2>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="flex items-end gap-1 h-24">
              {dailyStats.map(d => {
                const h = maxOrders > 0 ? Math.round((d.orders / maxOrders) * BAR_MAX_HEIGHT) : 0
                const isToday = d.date === new Date().toISOString().split('T')[0]
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="relative w-full flex flex-col items-center group">
                      {d.orders > 0 && (
                        <div className="absolute bottom-full mb-1 bg-navy text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {d.orders} cmd · {d.confirmed} conf.
                        </div>
                      )}
                      <div className="w-full flex flex-col" style={{ height: `${Math.max(h, d.orders > 0 ? 4 : 2)}px` }}>
                        {/* Confirmed portion */}
                        <div
                          className="w-full bg-green-500 rounded-t-md"
                          style={{ height: `${d.orders > 0 ? Math.round((d.confirmed / d.orders) * 100) : 0}%` }}
                        />
                        {/* Unconfirmed */}
                        <div className="flex-1 bg-amber-400" />
                      </div>
                    </div>
                    <span className={cn('text-[9px] font-semibold', isToday ? 'text-accent' : 'text-gray-400')}>
                      {formatDate(d.date)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 bg-green-500 rounded-sm" /> Confirmées
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 bg-amber-400 rounded-sm" /> En attente
            </div>
          </div>
        </div>

        {/* Taux COD */}
        {!loading && summary && (
          <div className="card">
            <h2 className="font-bold text-navy text-sm mb-3">🎯 Taux de confirmation COD</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      summary.confirmationRate >= 60 ? 'bg-green-500' :
                      summary.confirmationRate >= 40 ? 'bg-amber-400' : 'bg-red-400'
                    )}
                    style={{ width: `${summary.confirmationRate}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">0%</span>
                  <span className="text-xs text-gray-400">Objectif 60%</span>
                  <span className="text-xs text-gray-400">100%</span>
                </div>
              </div>
              <div className={cn(
                'font-black text-2xl flex-shrink-0',
                summary.confirmationRate >= 60 ? 'text-green-600' :
                summary.confirmationRate >= 40 ? 'text-amber-500' : 'text-red-500'
              )}>
                {summary.confirmationRate}%
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              {summary.confirmationRate >= 60
                ? '🚀 Excellent taux ! Bien au-dessus de la moyenne marocaine (45%).'
                : summary.confirmationRate >= 40
                ? '⚠️ Correct mais à améliorer. Utilise les scripts de relance WhatsApp.'
                : '❌ Taux faible. Améliore tes pages produit et relance les commandes en attente.'}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && summary?.totalOrders === 0 && (
          <div className="card text-center py-8">
            <div className="text-4xl mb-3">📊</div>
            <div className="font-bold text-navy mb-1">Pas encore de données</div>
            <p className="text-sm text-gray-400 mb-4">Les statistiques apparaîtront dès ta 1ère commande.</p>
            <Link href="/crm/commandes/nouveau" className="btn-primary inline-block">
              + Saisir une commande
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
