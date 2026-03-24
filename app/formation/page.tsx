'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, CheckCircle, Clock, ChevronRight, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FORMATION_MODULES, LEVEL_CONFIG, getTotalLessons } from '@/lib/formation-content'
import { cn } from '@/lib/utils'

interface ModuleProgress {
  [moduleSlug: string]: Set<string>  // set of completed lesson slugs
}

export default function FormationPage() {
  const supabase = createClient()
  const [progress, setProgress] = useState<ModuleProgress>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'débutant' | 'intermédiaire' | 'avancé'>('all')

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('formation_progress')
      .select('module_slug, lesson_slug')
      .eq('user_id', user.id)
      .eq('completed', true)

    const map: ModuleProgress = {}
    for (const row of data || []) {
      if (!map[row.module_slug]) map[row.module_slug] = new Set()
      map[row.module_slug].add(row.lesson_slug)
    }
    setProgress(map)
    setLoading(false)
  }

  const totalLessons = getTotalLessons()
  const completedTotal = Object.values(progress).reduce((sum, s) => sum + s.size, 0)
  const overallPct = totalLessons > 0 ? Math.round((completedTotal / totalLessons) * 100) : 0

  const filtered = filter === 'all' ? FORMATION_MODULES : FORMATION_MODULES.filter(m => m.level === filter)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-navy px-5 pt-5 pb-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-blue-200 text-sm mb-4 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Accueil
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-teal-brand rounded-xl flex items-center justify-center text-xl">🎓</div>
          <div>
            <h1 className="text-xl font-black text-white">Formation ShopSimply</h1>
            <p className="text-blue-200 text-xs mt-0.5">E-commerce marocain de A à Z</p>
          </div>
        </div>

        {/* Progression globale */}
        <div className="bg-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-white font-black text-2xl">{overallPct}%</span>
              <span className="text-blue-200 text-xs ml-2">complété</span>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-sm">{completedTotal}/{totalLessons}</div>
              <div className="text-blue-200 text-xs">leçons</div>
            </div>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-brand rounded-full transition-all duration-700"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          {overallPct === 100 && (
            <div className="flex items-center gap-2 mt-2 text-yellow-300 text-xs font-bold">
              <Trophy className="w-3.5 h-3.5" /> Formation complétée — Tu es prêt à dominer !
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">

        {/* Filtres niveau */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {(['all', 'débutant', 'intermédiaire', 'avancé'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border-2 transition-all flex-shrink-0',
                filter === f
                  ? 'bg-navy text-white border-navy'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              )}
            >
              {f === 'all' ? `Tous (${FORMATION_MODULES.length})` :
               f === 'débutant' ? '🟢 Débutant' :
               f === 'intermédiaire' ? '🔵 Intermédiaire' : '🟣 Avancé'}
            </button>
          ))}
        </div>

        {/* Modules */}
        {filtered.map(mod => {
          const done = progress[mod.slug]?.size ?? 0
          const total = mod.lessons.length
          const pct = total > 0 ? Math.round((done / total) * 100) : 0
          const isComplete = pct === 100
          const levelCfg = LEVEL_CONFIG[mod.level]

          return (
            <Link
              key={mod.slug}
              href={`/formation/${mod.slug}`}
              className={cn(
                'block rounded-2xl border-2 p-4 hover:shadow-md transition-all',
                isComplete ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Emoji + completion check */}
                <div className="relative flex-shrink-0">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-2xl', mod.bg)}>
                    {mod.emoji}
                  </div>
                  {isComplete && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-navy text-sm leading-snug">{mod.title}</h3>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                  </div>

                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{mod.description}</p>

                  <div className="flex items-center gap-3 mt-2">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', levelCfg.badge)}>
                      {levelCfg.label}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                      <Clock className="w-3 h-3" /> {mod.duration}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                      <BookOpen className="w-3 h-3" /> {total} leçon{total > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Barre de progression */}
                  {(done > 0 || pct > 0) && (
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-400">{done}/{total} leçons</span>
                        <span className={cn('font-bold', isComplete ? 'text-green-600' : 'text-navy')}>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', isComplete ? 'bg-green-500' : 'bg-accent')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}

        {/* Badge certification */}
        {overallPct >= 50 && (
          <div className="bg-gradient-to-r from-navy to-blue-800 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <div className="text-white font-black text-sm">
                {overallPct === 100 ? 'Certification ShopSimply obtenue !' : `${100 - overallPct}% pour ta certification`}
              </div>
              <div className="text-blue-200 text-xs mt-0.5">
                {overallPct === 100
                  ? 'Tu maîtrises l\'e-commerce marocain de A à Z'
                  : 'Continue pour obtenir ton badge expert e-commerce Maroc'}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
