import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import WelcomeBanner from '@/components/ui/WelcomeBanner'
import { Suspense } from 'react'
import { DashboardSkeleton } from '@/components/ui/Skeleton'

// ─── Real data fetchers ───────────────────────────────
async function getDashboardData(userId: string) {
  const supabase = await createClient()

  const [plansResult, tasksResult, ordersResult, visitorsResult] = await Promise.all([
    supabase
      .from('plans')
      .select('progress_pct, current_week, weeks')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),

    supabase
      .from('tasks')
      .select('id, title, status, points, week_number')
      .eq('user_id', userId)
      .order('week_number', { ascending: true }),

    supabase
      .from('orders')
      .select('id, amount, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),

    supabase
      .from('analytics_snapshots')
      .select('visitors, ctr, date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(14),
  ])

  return {
    plan: plansResult.data,
    tasks: tasksResult.data || [],
    orders: ordersResult.data || [],
    snapshots: visitorsResult.data || [],
  }
}

// ─── KPI computation ──────────────────────────────────
function computeKPIs(data: Awaited<ReturnType<typeof getDashboardData>>) {
  const { orders, snapshots, tasks } = data

  const totalOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned').length
  const latestVisitors = snapshots[0]?.visitors ?? 0
  const prevWeekVisitors = snapshots.slice(7, 14).reduce((s, d) => s + d.visitors, 0)
  const thisWeekVisitors = snapshots.slice(0, 7).reduce((s, d) => s + d.visitors, 0)
  const visitorsChange = prevWeekVisitors > 0
    ? Math.round(((thisWeekVisitors - prevWeekVisitors) / prevWeekVisitors) * 100)
    : null

  const doneTasks = tasks.filter(t => t.status === 'done').length
  const totalTasks = tasks.length

  const latestCtr = snapshots[0]?.ctr ?? null

  return [
    {
      label: 'Commandes reçues',
      value: totalOrders.toString(),
      change: totalOrders === 0 ? 'Objectif : 1 cette semaine' : `${totalOrders} au total`,
      changeType: totalOrders > 0 ? 'up' : 'neutral',
    },
    {
      label: 'Visiteurs boutique',
      value: latestVisitors > 0 ? latestVisitors.toString() : '—',
      change: visitorsChange !== null
        ? `${visitorsChange >= 0 ? '↑' : '↓'} ${Math.abs(visitorsChange)}% vs sem. passée`
        : 'Connecte ton store',
      changeType: visitorsChange === null ? 'neutral' : visitorsChange >= 0 ? 'up' : 'down',
    },
    {
      label: 'Tâches complétées',
      value: totalTasks > 0 ? doneTasks.toString() : '0',
      change: `sur ${totalTasks} au total`,
      changeType: 'neutral',
    },
    {
      label: 'Taux de clic pub',
      value: latestCtr !== null ? `${latestCtr}%` : '—',
      change: latestCtr === null ? 'Connecte Facebook Ads' : latestCtr >= 2 ? '✓ Bon CTR' : '↓ Optimisation suggérée',
      changeType: latestCtr === null ? 'neutral' : latestCtr >= 2 ? 'up' : 'down',
    },
  ]
}

// ─── Dashboard content ────────────────────────────────
async function DashboardContent({ userId, firstName }: { userId: string, firstName: string }) {
  const data = await getDashboardData(userId)
  const kpis = computeKPIs(data)

  const plan = data.plan
  const progressPct = plan?.progress_pct ?? 0
  const currentWeek = plan?.current_week ?? 1

  // Tasks for current week
  const currentWeekTasks = data.tasks
    .filter(t => t.week_number === currentWeek)
    .slice(0, 4)

  const weekBadges = [
    { label: currentWeek > 1 ? 'S1 ✓' : 'S1 →', cls: currentWeek > 1 ? 'bg-green-500 text-white' : 'bg-accent text-white' },
    { label: currentWeek > 2 ? 'S2 ✓' : currentWeek === 2 ? 'S2 →' : 'S2', cls: currentWeek > 2 ? 'bg-green-500 text-white' : currentWeek === 2 ? 'bg-accent text-white' : 'bg-gray-100 text-gray-400' },
    { label: currentWeek > 3 ? 'S3 ✓' : currentWeek === 3 ? 'S3 →' : 'S3', cls: currentWeek > 3 ? 'bg-green-500 text-white' : currentWeek === 3 ? 'bg-accent text-white' : 'bg-gray-100 text-gray-400' },
    { label: currentWeek === 4 ? 'S4 →' : currentWeek > 4 ? 'S4 ✓' : 'S4', cls: currentWeek >= 4 ? 'bg-accent text-white' : 'bg-gray-100 text-gray-400' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-navy px-5 pt-5 pb-6">
        <p className="text-blue-200 text-sm mb-0.5">Salam {firstName} 👋</p>
        <h1 className="text-xl font-black text-white">Tableau de bord</h1>
        <p className="text-teal-brand text-xs mt-1">
          Semaine {currentWeek} en cours · Plan à {progressPct}%
        </p>

        {/* KPIs */}
        <div data-tour="kpis" className="grid grid-cols-2 gap-3 mt-4">
          {kpis.map(kpi => (
            <div key={kpi.label} className="bg-white/10 rounded-2xl p-3">
              <div className="text-2xl font-black text-white">{kpi.value}</div>
              <div className="text-blue-200 text-xs mt-0.5">{kpi.label}</div>
              <div
                className={cn(
                  'text-xs font-semibold mt-1',
                  kpi.changeType === 'up' ? 'text-green-400' : kpi.changeType === 'down' ? 'text-red-400' : 'text-blue-200'
                )}
              >
                {kpi.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Welcome banner (nouveaux utilisateurs) */}
      <WelcomeBanner userName={firstName} />

      {/* Body */}
      <div className="flex-1 px-4 py-5 space-y-4 max-w-2xl mx-auto w-full">
        {/* Plan 30j progress */}
        <div data-tour="plan-progress" className="card">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-navy text-sm">Plan 30 jours</span>
            <span className="font-black text-accent text-sm">{progressPct}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex gap-2 mt-3">
            {weekBadges.map(p => (
              <div key={p.label} className={cn('flex-1 py-1.5 rounded-xl text-center text-xs font-bold', p.cls)}>
                {p.label}
              </div>
            ))}
          </div>
        </div>

        {/* Assistant IA banner */}
        <Link data-tour="assistant-cta" href="/assistant" className="bg-navy rounded-2xl p-4 flex items-center gap-3 block hover:opacity-95 transition-opacity">
          <div className="w-10 h-10 bg-teal-brand rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            🤖
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold text-sm">Assistant IA disponible</div>
            <div className="text-blue-200 text-xs mt-0.5">« Optimise le ciblage de ta pub Facebook »</div>
          </div>
          <span className="text-blue-200 text-lg">›</span>
        </Link>

        {/* Tâche du jour */}
        {currentWeekTasks.find(t => t.status === 'active') ? (
          <div className="bg-accent-gradient rounded-2xl p-5">
            <div className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2">
              📍 Tâche du jour
            </div>
            <div className="text-white font-bold text-base mb-1.5 leading-snug">
              {currentWeekTasks.find(t => t.status === 'active')?.title}
            </div>
            <div className="text-white/85 text-xs mb-4 leading-relaxed">
              L&apos;IA peut t&apos;aider à compléter cette tâche plus vite.
            </div>
            <Link
              href="/plan"
              className="inline-block bg-white/25 border border-white/50 rounded-xl px-4 py-2.5 text-white text-sm font-bold hover:bg-white/35 transition-colors"
            >
              Voir les détails →
            </Link>
          </div>
        ) : (
          <div className="bg-accent-gradient rounded-2xl p-5">
            <div className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2">
              📍 Tâche du jour
            </div>
            <div className="text-white font-bold text-base mb-1.5 leading-snug">
              {plan ? 'Continue sur ta lancée !' : 'Lance ton plan 30 jours'}
            </div>
            <div className="text-white/85 text-xs mb-4 leading-relaxed">
              {plan ? 'Consulte ton plan pour voir les prochaines tâches.' : 'Complète l\'onboarding pour générer ton plan personnalisé.'}
            </div>
            <Link
              href="/plan"
              className="inline-block bg-white/25 border border-white/50 rounded-xl px-4 py-2.5 text-white text-sm font-bold hover:bg-white/35 transition-colors"
            >
              Voir le plan →
            </Link>
          </div>
        )}

        {/* Tâches semaine */}
        {currentWeekTasks.length > 0 && (
          <div>
            <div className="section-title">Tâches — Semaine {currentWeek}</div>
            <div className="card divide-y divide-gray-50">
              {currentWeekTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0',
                      task.status === 'done' ? 'bg-green-500 text-white' :
                      task.status === 'active' ? 'bg-accent text-white' :
                      'border-2 border-gray-200'
                    )}
                  >
                    {task.status === 'done' ? '✓' : task.status === 'active' ? '→' : ''}
                  </div>
                  <span
                    className={cn(
                      'flex-1 text-sm',
                      task.status === 'done' ? 'line-through text-gray-400' :
                      task.status === 'active' ? 'text-navy font-semibold' :
                      'text-gray-400'
                    )}
                  >
                    {task.title}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-bold',
                      task.status === 'todo' ? 'text-gray-300' : 'text-accent'
                    )}
                  >
                    +{task.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No plan state */}
        {!plan && (
          <div className="card text-center py-8">
            <div className="text-4xl mb-3">🚀</div>
            <div className="font-bold text-navy mb-1">Ton plan n&apos;est pas encore généré</div>
            <p className="text-sm text-gray-400 mb-4">Complète l&apos;onboarding pour que l&apos;IA crée ton plan 30 jours personnalisé.</p>
            <Link href="/onboarding" className="btn-primary inline-block">
              Commencer →
            </Link>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="flex border-t border-gray-100 bg-white py-2 sticky bottom-0">
        {[
          { href: '/dashboard',  icon: '🏠', label: 'Accueil',   active: true  },
          { href: '/plan',       icon: '📋', label: 'Plan',      active: false },
          { href: '/assistant',  icon: '🤖', label: 'IA',        active: false },
          { href: '/formation',  icon: '🎓', label: 'Formation', active: false },
          { href: '/profil',     icon: '⚙️', label: 'Profil',    active: false },
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

// ─── Page (Server Component) ──────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'toi'

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent userId={user.id} firstName={firstName} />
    </Suspense>
  )
}
