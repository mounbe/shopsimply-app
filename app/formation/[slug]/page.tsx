'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Circle, Clock, Zap, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getModule, LEVEL_CONFIG, type Lesson, type Module } from '@/lib/formation-content'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

export default function ModulePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = createClient()
  const { toast } = useToast()

  const [mod, setMod] = useState<Module | null>(null)
  const [activeLesson, setActiveLesson] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    const m = getModule(slug)
    if (!m) { router.push('/formation'); return }
    setMod(m)
    loadProgress(m)
  }, [slug])

  const loadProgress = async (m: Module) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('formation_progress')
      .select('lesson_slug')
      .eq('user_id', user.id)
      .eq('module_slug', slug)
      .eq('completed', true)

    const done = new Set((data || []).map((r: { lesson_slug: string }) => r.lesson_slug))
    setCompletedLessons(done)

    // Reprendre à la première leçon non complétée
    const firstIncomplete = m.lessons.findIndex(l => !done.has(l.slug))
    setActiveLesson(firstIncomplete >= 0 ? firstIncomplete : 0)
    setLoading(false)
  }

  const handleMarkComplete = async () => {
    if (!mod) return
    const lesson = mod.lessons[activeLesson]
    if (!lesson || completedLessons.has(lesson.slug)) return

    setMarking(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMarking(false); return }

    const { error } = await supabase
      .from('formation_progress')
      .upsert({
        user_id:     user.id,
        module_slug: slug,
        lesson_slug: lesson.slug,
        completed:   true,
      }, { onConflict: 'user_id,module_slug,lesson_slug' })

    if (!error) {
      const newSet = new Set(completedLessons)
      newSet.add(lesson.slug)
      setCompletedLessons(newSet)

      const isModuleComplete = newSet.size === mod.lessons.length
      toast({
        type: 'success',
        message: isModuleComplete
          ? `🎉 Module "${mod.title}" terminé !`
          : `✅ Leçon complétée — ${newSet.size}/${mod.lessons.length}`,
      })

      // Passer à la suivante automatiquement
      if (activeLesson < mod.lessons.length - 1) {
        setTimeout(() => setActiveLesson(i => i + 1), 600)
      }
    } else {
      toast({ type: 'error', message: 'Erreur lors de l\'enregistrement' })
    }
    setMarking(false)
  }

  if (loading || !mod) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const lesson = mod.lessons[activeLesson]
  const isCompleted = completedLessons.has(lesson.slug)
  const modulePct = Math.round((completedLessons.size / mod.lessons.length) * 100)
  const levelCfg = LEVEL_CONFIG[mod.level]

  const TYPE_CONFIG = {
    read:     { icon: '📖', label: 'Lecture', color: 'bg-blue-100 text-blue-700' },
    practice: { icon: '⚡', label: 'Pratique', color: 'bg-orange-100 text-orange-700' },
    quiz:     { icon: '🎯', label: 'Quiz', color: 'bg-purple-100 text-purple-700' },
    video:    { icon: '🎬', label: 'Vidéo', color: 'bg-red-100 text-red-700' },
  }

  const typeCfg = TYPE_CONFIG[lesson.type]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className={cn('px-5 pt-5 pb-4', mod.bg.replace('50', '600').replace('bg-', 'bg-'))}>
        <div className="bg-navy px-5 pt-5 pb-4 -mx-5 -mt-5 mb-0">
          <Link href="/formation" className="flex items-center gap-2 text-blue-200 text-sm mb-3 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Formation
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{mod.emoji}</span>
            <div className="flex-1">
              <h1 className="text-white font-black text-base leading-tight">{mod.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', levelCfg.badge)}>
                  {levelCfg.label}
                </span>
                <span className="text-blue-200 text-[10px] font-semibold">
                  {completedLessons.size}/{mod.lessons.length} leçons · {mod.duration}
                </span>
              </div>
            </div>
          </div>

          {/* Progression module */}
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-brand rounded-full transition-all duration-700"
              style={{ width: `${modulePct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Liste des leçons */}
        <div className="border-b border-gray-100 bg-white px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {mod.lessons.map((l, i) => (
              <button
                key={l.slug}
                onClick={() => setActiveLesson(i)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border-2',
                  i === activeLesson
                    ? 'bg-navy text-white border-navy'
                    : completedLessons.has(l.slug)
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                )}
              >
                {completedLessons.has(l.slug) ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                )}
                <span className="truncate max-w-[100px]">
                  {i + 1}. {l.title.split(' ').slice(0, 3).join(' ')}…
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenu de la leçon */}
        <div className="flex-1 px-4 py-5 space-y-4 overflow-y-auto">

          {/* Titre + meta */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', typeCfg.color)}>
                {typeCfg.icon} {typeCfg.label}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                <Clock className="w-3 h-3" /> {lesson.duration}
              </span>
            </div>
            <h2 className="font-black text-navy text-lg leading-snug">{lesson.title}</h2>
          </div>

          {/* Contenu principal */}
          <div className="card prose-sm">
            {lesson.content.split('\n\n').map((block, i) => {
              if (block.startsWith('**') && block.includes(':**')) {
                // Titre de section
                const title = block.replace(/\*\*(.*?):\*\*/, '$1')
                return <h3 key={i} className="font-black text-navy text-sm mt-4 mb-2">{title}</h3>
              }
              // Paragraphe normal — applique le gras
              const parsed = block.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              return (
                <p
                  key={i}
                  className="text-sm text-gray-600 leading-relaxed mb-3"
                  dangerouslySetInnerHTML={{ __html: parsed }}
                />
              )
            })}
          </div>

          {/* Tips */}
          {lesson.tips.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
              <h3 className="font-black text-blue-700 text-xs flex items-center gap-1.5">
                💡 Conseils clés
              </h3>
              {lesson.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-blue-600">
                  <span className="font-bold mt-0.5 flex-shrink-0">→</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action concrète */}
          {lesson.action && (
            <div className="bg-accent/10 border-2 border-accent/30 rounded-2xl p-4">
              <h3 className="font-black text-accent text-xs mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Action à faire maintenant
              </h3>
              <p className="text-sm text-gray-700 font-semibold">{lesson.action}</p>
            </div>
          )}

          {/* CTA ShopAI */}
          {lesson.aiPrompt && (
            <Link
              href={`/assistant?task=${encodeURIComponent(lesson.aiPrompt)}`}
              className="flex items-center gap-3 bg-navy rounded-2xl p-3.5 hover:opacity-95 transition-opacity"
            >
              <span className="text-2xl">🤖</span>
              <div className="flex-1">
                <div className="text-white font-bold text-xs">Demander à ShopAI</div>
                <div className="text-blue-200 text-[11px] mt-0.5 line-clamp-1">« {lesson.aiPrompt} »</div>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-300" />
            </Link>
          )}

          {/* Bouton Marquer comme lu + navigation */}
          <div className="flex gap-3 pt-2 pb-6">
            {activeLesson > 0 && (
              <button
                onClick={() => setActiveLesson(i => i - 1)}
                className="flex items-center gap-1.5 btn-secondary px-4"
              >
                <ChevronLeft className="w-4 h-4" /> Préc.
              </button>
            )}

            {isCompleted ? (
              <div className="flex-1 flex items-center justify-center gap-2 bg-green-50 border-2 border-green-200 rounded-2xl py-3 text-green-700 font-bold text-sm">
                <CheckCircle className="w-4 h-4" />
                Leçon complétée !
              </div>
            ) : (
              <button
                onClick={handleMarkComplete}
                disabled={marking}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {marking ? (
                  <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {marking ? 'Enregistrement…' : 'Marquer comme lu'}
              </button>
            )}

            {activeLesson < mod.lessons.length - 1 && (
              <button
                onClick={() => setActiveLesson(i => i + 1)}
                className="flex items-center gap-1.5 btn-secondary px-4"
              >
                Suiv. <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Fin du module */}
          {completedLessons.size === mod.lessons.length && (
            <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-5 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-white font-black text-base mb-1">Module terminé !</h3>
              <p className="text-white/80 text-xs mb-4">Tu as maîtrisé "{mod.title}"</p>
              <Link href="/formation" className="inline-block bg-white text-green-700 font-black text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                Voir les autres modules →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
