'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { PlanSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

// ── Types ─────────────────────────────────────────────
interface Task {
  id: string
  title: string
  why?: string | null
  duration?: string | null
  status: 'todo' | 'active' | 'done'
  points: number
  ai_assisted: boolean
  week_number: number
}

interface Plan {
  id: string
  progress_pct: number
  current_week: number
  niche: string
  model: string
  platform: string
}

interface WeekGroup {
  number: number
  name: string
  objective: string
  status: 'done' | 'current' | 'upcoming'
  tasks: Task[]
}

const WEEK_META = [
  { name: 'Semaine 1 — Les Bases', objective: 'Créer compte, configurer boutique' },
  { name: 'Semaine 2 — Attirer les Visiteurs', objective: 'Facebook, pub, premiers clics' },
  { name: 'Semaine 3 — Optimiser & Vendre', objective: 'Paniers abandonnés, retargeting, 1ère vente' },
  { name: 'Semaine 4 — Scaler', objective: 'Augmenter budget pub, fidéliser' },
]

export default function PlanPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [weeks, setWeeks] = useState<WeekGroup[]>([])
  const [openWeeks, setOpenWeeks] = useState<number[]>([])
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)
  const { success, error: toastError } = useToast()

  useEffect(() => {
    loadPlan()
  }, [])

  const loadPlan = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [planRes, tasksRes] = await Promise.all([
      supabase
        .from('plans')
        .select('id, progress_pct, current_week, niche, model, platform')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('tasks')
        .select('id, title, why, duration, status, points, ai_assisted, week_number')
        .eq('user_id', user.id)
        .order('week_number', { ascending: true }),
    ])

    if (planRes.data) {
      setPlan(planRes.data)
      const currentWeek = planRes.data.current_week

      // Open current week by default
      setOpenWeeks([currentWeek])

      // Group tasks by week
      const taskList: Task[] = tasksRes.data || []
      const grouped: WeekGroup[] = [1, 2, 3, 4].map(n => {
        const weekTasks = taskList.filter(t => t.week_number === n)
        let status: 'done' | 'current' | 'upcoming' = 'upcoming'
        if (n < currentWeek) status = 'done'
        else if (n === currentWeek) status = 'current'

        const meta = WEEK_META[n - 1]
        const doneTasks = weekTasks.filter(t => t.status === 'done').length

        return {
          number: n,
          name: meta?.name ?? `Semaine ${n}`,
          objective: meta?.objective ?? '',
          status,
          tasks: weekTasks,
          progress: `${doneTasks}/${weekTasks.length}`,
        }
      })
      setWeeks(grouped as WeekGroup[])
    }

    setLoading(false)
  }

  const toggleWeek = (n: number) => {
    setOpenWeeks(prev =>
      prev.includes(n) ? prev.filter(w => w !== n) : [...prev, n]
    )
  }

  const markTaskDone = async (task: Task) => {
    if (task.status === 'done' || updatingTask) return
    setUpdatingTask(task.id)

    const newStatus = task.status === 'active' ? 'done' : 'active'

    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      })
      .eq('id', task.id)

    if (updateError) {
      toastError('Erreur lors de la mise à jour. Réessaie.')
      setUpdatingTask(null)
      return
    }

    if (newStatus === 'done') {
      success(`✓ Tâche complétée ! +${task.points} pts`)
    }

    // Update local state
    setWeeks(prev => prev.map(w => ({
      ...w,
      tasks: w.tasks.map(t =>
        t.id === task.id ? { ...t, status: newStatus as 'todo' | 'active' | 'done' } : t
      ),
    })))

    // Recalculate progress
    if (plan) {
      const allTasks = weeks.flatMap(w => w.tasks).map(t =>
        t.id === task.id ? { ...t, status: newStatus } : t
      )
      const doneCount = allTasks.filter(t => t.status === 'done').length
      const progressPct = Math.round((doneCount / allTasks.length) * 100)

      await supabase
        .from('plans')
        .update({ progress_pct: progressPct, updated_at: new Date().toISOString() })
        .eq('id', plan.id)

      setPlan(prev => prev ? { ...prev, progress_pct: progressPct } : prev)
    }

    setUpdatingTask(null)
  }

  const badgeClass = {
    done: 'bg-green-500',
    current: 'bg-accent',
    upcoming: 'bg-gray-400',
  }

  if (loading) return <PlanSkeleton />

  // No plan state
  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="text-5xl mb-4">🗓️</div>
        <div className="font-bold text-navy text-lg mb-2">Pas encore de plan</div>
        <p className="text-sm text-gray-400 text-center mb-6">
          Complète l&apos;onboarding pour générer ton plan 30 jours personnalisé avec l&apos;IA.
        </p>
        <Link href="/onboarding" className="btn-primary">
          Créer mon plan →
        </Link>
      </div>
    )
  }

  const progressPct = plan.progress_pct

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-navy px-5 py-5">
        <h1 className="text-xl font-black text-white mb-1">Plan 30 jours</h1>
        <p className="text-blue-200 text-xs capitalize">
          {plan.niche} · {plan.model === 'dropshipping' ? 'Dropshipping' : plan.model} · {plan.platform}
        </p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-accent text-xs font-black">{progressPct}%</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-4 space-y-3 max-w-2xl mx-auto w-full">
        {/* IA Assistant bubble */}
        <div className="bg-navy rounded-2xl p-4 flex gap-3 items-start">
          <div className="w-9 h-9 rounded-full bg-teal-brand flex items-center justify-center text-lg flex-shrink-0">
            🤖
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-sm text-white leading-relaxed flex-1">
            Tu es en bonne voie !{' '}
            <span className="text-teal-brand font-bold">Semaine {plan.current_week} en cours.</span>{' '}
            Appuie sur{' '}
            <span className="text-teal-brand font-bold">« Aide IA »</span>{' '}
            pour que je t&apos;aide sur les tâches complexes.
          </div>
        </div>

        {/* Weeks */}
        {weeks.map(week => {
          const doneTasks = week.tasks.filter(t => t.status === 'done').length

          return (
            <div
              key={week.number}
              className={cn(
                'bg-white rounded-2xl overflow-hidden border-2 transition-colors',
                week.status === 'current' ? 'border-accent' : 'border-gray-100'
              )}
            >
              {/* Week header */}
              <button
                onClick={() => toggleWeek(week.number)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white',
                      badgeClass[week.status]
                    )}
                  >
                    {week.status === 'done' ? '✓' : week.number}
                  </div>
                  <div>
                    <div className="font-bold text-navy text-sm">{week.name}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{week.objective}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent text-xs font-bold">{doneTasks}/{week.tasks.length}</span>
                  <span
                    className={cn(
                      'text-gray-400 text-sm transition-transform duration-200',
                      openWeeks.includes(week.number) ? 'rotate-180' : ''
                    )}
                  >
                    ▼
                  </span>
                </div>
              </button>

              {/* Tasks */}
              {openWeeks.includes(week.number) && week.tasks.length > 0 && (
                <div className="border-t border-gray-100 divide-y divide-gray-50 px-4">
                  {week.tasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3 py-3">
                      {/* Status button */}
                      <button
                        onClick={() => markTaskDone(task)}
                        disabled={task.status === 'done' || !!updatingTask}
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 transition-all',
                          task.status === 'done' ? 'bg-green-500 text-white' :
                          task.status === 'active' ? 'bg-accent text-white hover:bg-green-500' :
                          'border-2 border-gray-200 hover:border-accent',
                          updatingTask === task.id ? 'opacity-50' : ''
                        )}
                      >
                        {task.status === 'done' ? '✓' : task.status === 'active' ? '→' : ''}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'text-sm font-semibold leading-snug',
                            task.status === 'done' ? 'line-through text-gray-400' :
                            task.status === 'active' ? 'text-accent' : 'text-navy'
                          )}
                        >
                          {task.title}
                        </div>
                        {task.why && (
                          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{task.why}</p>
                        )}
                        {task.duration && (
                          <div className="text-xs text-gray-400 mt-0.5">⏱ {task.duration}</div>
                        )}
                      </div>

                      {task.ai_assisted && (
                        <Link
                          href={`/assistant?task=${encodeURIComponent(task.title)}`}
                          className="bg-sky-50 text-teal-brand text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 hover:bg-sky-100 transition-colors"
                        >
                          Aide IA
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Empty week */}
              {openWeeks.includes(week.number) && week.tasks.length === 0 && (
                <div className="border-t border-gray-100 px-4 py-4 text-center text-sm text-gray-400">
                  Les tâches de cette semaine seront disponibles bientôt.
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom nav */}
      <nav className="flex border-t border-gray-100 bg-white py-2 sticky bottom-0">
        {[
          { href: '/dashboard', icon: '🏠', label: 'Accueil', active: false },
          { href: '/plan', icon: '📋', label: 'Plan', active: true },
          { href: '/assistant', icon: '🤖', label: 'IA', active: false },
          { href: '/crm', icon: '👥', label: 'CRM', active: false },
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
