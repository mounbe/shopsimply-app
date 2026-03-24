'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function WelcomeBanner({ userName }: { userName?: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show only if ?welcome=1 in URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('welcome') === '1') {
      setVisible(true)
      // Clean URL
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  if (!visible) return null

  return (
    <div className="mx-4 mt-4 bg-gradient-to-r from-navy to-navy-light rounded-2xl p-4 relative overflow-hidden animate-slide-up">
      {/* BG decoration */}
      <div className="absolute right-0 top-0 w-24 h-24 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />

      <button
        onClick={() => setVisible(false)}
        className="absolute top-3 right-3 text-blue-200 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 relative z-10">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          🎉
        </div>
        <div>
          <div className="text-white font-black text-base mb-1">
            Bienvenue {userName ? `${userName} !` : '!'} Ton plan est prêt.
          </div>
          <p className="text-blue-200 text-xs leading-relaxed mb-3">
            L'IA a généré ton plan 30 jours personnalisé. Commence par la première tâche de la semaine 1.
          </p>
          <Link
            href="/plan"
            className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-bold px-3 py-2 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Voir mon Plan 30 jours →
          </Link>
        </div>
      </div>
    </div>
  )
}
