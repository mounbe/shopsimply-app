'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { AIRecommendation, NicheRecommendation } from '@/types'
import { cn } from '@/lib/utils'

const RANK_COLORS = ['bg-accent', 'bg-gray-400', 'bg-amber-600']
const RANK_LABELS = ['Or', 'Argent', 'Bronze']

function DemandBar({ value, color = 'bg-green-500' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
      <div
        className={cn('h-full rounded-full transition-all duration-700', color)}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function NicheCard({ niche, index }: { niche: NicheRecommendation; index: number }) {
  const demandColor =
    niche.demand >= 70 ? 'bg-green-500' : niche.demand >= 45 ? 'bg-gray-400' : 'bg-amber-500'

  return (
    <div className="card animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="font-bold text-navy text-base">
            {niche.emoji} {niche.name}
          </div>
          <div className="text-xs text-accent font-semibold mt-0.5">
            {niche.model} · {niche.platform} recommandé
          </div>
        </div>
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0',
            RANK_COLORS[index]
          )}
        >
          {index + 1}
        </div>
      </div>

      <DemandBar value={niche.demand} color={demandColor} />
      <div className="flex justify-between mt-1 mb-3">
        <span className="text-xs text-gray-400">Demande marché</span>
        <span
          className={cn(
            'text-xs font-bold',
            niche.demand >= 70
              ? 'text-green-600'
              : niche.demand >= 45
              ? 'text-gray-500'
              : 'text-amber-600'
          )}
        >
          {niche.demandLabel} {niche.demand >= 70 ? '▲' : niche.demand >= 45 ? '→' : '▼'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Budget min.', value: `${niche.budget_min.toLocaleString()} MAD` },
          { label: '1ère vente', value: niche.first_sale_weeks },
          { label: 'Concurrence', value: niche.competition },
        ].map(m => (
          <div key={m.label} className="bg-gray-50 rounded-xl p-2 text-center">
            <div className="text-xs font-bold text-navy">{m.value}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 leading-relaxed italic">{niche.why}</p>
    </div>
  )
}

export default function ResultatsPage() {
  const router = useRouter()
  const [result, setResult] = useState<AIRecommendation | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('diagnostic_result')
    if (!stored) {
      router.push('/diagnostic')
      return
    }
    setResult(JSON.parse(stored))
  }, [router])

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Chargement de tes résultats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero résultats */}
      <div className="bg-results-gradient px-5 py-8 text-center">
        <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
          ✓
        </div>
        <h1 className="text-xl font-black text-white mb-2">
          Tes recommandations sont prêtes !
        </h1>
        <p className="text-blue-200 text-sm leading-relaxed">
          Basé sur tes réponses, voici les 3 niches<br />les plus prometteuses pour toi
        </p>
        <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3 mt-4 text-left">
          <span className="text-2xl">🎯</span>
          <div>
            <div className="text-blue-200 text-xs">Ton profil</div>
            <div className="text-white font-bold text-sm">{result.profile}</div>
          </div>
        </div>
      </div>

      {/* Niches */}
      <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">
        <div className="section-title">Top 3 Niches Recommandées</div>
        {result.niches.map((niche, i) => (
          <NicheCard key={i} niche={niche} index={i} />
        ))}

        {/* Modèle recommandé */}
        <div className="bg-navy rounded-2xl p-5">
          <div className="text-blue-200 text-xs font-bold mb-2">
            🤖 Modèle recommandé par l&apos;IA
          </div>
          <div className="text-white font-black text-lg mb-2">{result.recommended_model}</div>
          <p className="text-blue-200 text-sm leading-relaxed mb-3">{result.model_description}</p>
          <div className="flex flex-wrap gap-2">
            {result.model_pros.map(pro => (
              <span key={pro} className="bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {pro}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-navy mb-1">Prêt à passer à l&apos;action ?</h3>
          <p className="text-gray-500 text-sm mb-4">
            Crée ton compte pour accéder à ton plan 30 jours personnalisé et commencer dès aujourd&apos;hui.
          </p>
          <Link
            href="/signup"
            className="btn-primary flex items-center justify-center gap-2"
          >
            Voir mon Plan 30 jours <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-center text-gray-400 text-xs mt-3">
            7 jours gratuits · Sans CB · Annulation facile
          </p>
        </div>

        <button
          onClick={() => router.push('/diagnostic')}
          className="w-full text-center text-gray-400 text-sm mt-3 hover:text-navy transition-colors"
        >
          ← Refaire le diagnostic
        </button>
      </div>
    </div>
  )
}
