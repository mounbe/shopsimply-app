'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Zap, Star, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

// ── Types ─────────────────────────────────────────────────────
interface ScoreCriteria {
  name: string
  score: number
  max: number
  comment: string
}

interface ScoreResult {
  score: number
  verdict: 'excellent' | 'bon' | 'moyen' | 'risqué'
  label: string
  summary: string
  criteria: ScoreCriteria[]
  strengths: string[]
  risks: string[]
  tips: string[]
  best_season: string
  estimated_confirmation_rate: number
}

// ── Helpers ───────────────────────────────────────────────────
const VERDICT_CONFIG = {
  excellent: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-500', icon: '🚀', label: 'Produit excellent' },
  bon:       { bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-700',  badge: 'bg-blue-500',  icon: '👍', label: 'Bon produit' },
  moyen:     { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-500', icon: '⚠️', label: 'Moyen' },
  risqué:    { bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-700',   badge: 'bg-red-500',   icon: '🔴', label: 'Produit risqué' },
}

function ScoreGauge({ score }: { score: number }) {
  const pct = (score / 10) * 100
  const color = score >= 7.5 ? '#22c55e' : score >= 5 ? '#3b82f6' : score >= 3 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="12" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke={color} strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 50}`}
            strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-navy">{score.toFixed(1)}</span>
          <span className="text-xs text-gray-400 font-semibold">/10</span>
        </div>
      </div>
    </div>
  )
}

function CriteriaBar({ item }: { item: ScoreCriteria }) {
  const pct = (item.score / item.max) * 100
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-blue-500' : 'bg-red-400'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-gray-700">{item.name}</span>
        <span className="text-gray-500 font-mono">{item.score}/{item.max}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 leading-tight">{item.comment}</p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function ScoringProduitPage() {
  const { toast } = useToast()

  const [form, setForm] = useState({
    productName: '',
    buyingPrice: '',
    sellingPrice: '',
    category: '',
    description: '',
    targetAudience: '',
  })
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [loading, setLoading] = useState(false)

  const CATEGORIES = [
    'Mode & Vêtements', 'Beauté & Cosmétiques', 'Maison & Décoration',
    'Électronique & Gadgets', 'Sport & Fitness', 'Enfants & Jouets',
    'Cuisine & Alimentation', 'Santé & Bien-être', 'Accessoires & Bijoux',
    'Automobile', 'Jardinage', 'Autre',
  ]

  const handleScore = async () => {
    if (!form.productName.trim()) {
      toast({ type: 'error', message: 'Saisis le nom du produit' })
      return
    }

    setLoading(true)
    const toastId = toast({ type: 'loading', message: 'ShopAI analyse ton produit…', duration: 0 })

    try {
      const res = await fetch('/api/score-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.productName,
          buyingPrice: form.buyingPrice ? parseFloat(form.buyingPrice) : undefined,
          sellingPrice: form.sellingPrice ? parseFloat(form.sellingPrice) : undefined,
          category: form.category || undefined,
          description: form.description || undefined,
          targetAudience: form.targetAudience || undefined,
        }),
      })

      const data = await res.json()
      toast({ id: toastId, type: 'success', message: `Score calculé : ${data.score}/10` })

      if (res.ok) {
        setResult(data)
        // Scroll vers résultat
        setTimeout(() => {
          document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        toast({ type: 'error', message: data.message || 'Erreur lors du scoring' })
      }
    } catch {
      toast({ id: toastId, type: 'error', message: 'Erreur réseau. Réessaie.' })
    } finally {
      setLoading(false)
    }
  }

  const verdict = result ? VERDICT_CONFIG[result.verdict] : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-navy px-5 pt-5 pb-6">
        <Link href="/outils" className="flex items-center gap-2 text-blue-200 text-sm mb-4 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Outils
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-xl">⭐</div>
          <div>
            <h1 className="text-xl font-black text-white">Scoring Produit IA</h1>
            <p className="text-blue-200 text-xs mt-0.5">Évalue ton produit /10 pour le marché marocain</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-4">

        {/* Formulaire */}
        <div className="card space-y-4">
          {/* Nom produit */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1.5">Nom du produit *</label>
            <input
              type="text"
              value={form.productName}
              onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
              placeholder="Ex: Lampe LED Sans Fil Rechargeable"
              className="input-field"
            />
          </div>

          {/* Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">Prix d'achat (MAD)</label>
              <input
                type="number"
                value={form.buyingPrice}
                onChange={e => setForm(f => ({ ...f, buyingPrice: e.target.value }))}
                placeholder="45"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">Prix de vente (MAD)</label>
              <input
                type="number"
                value={form.sellingPrice}
                onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))}
                placeholder="149"
                className="input-field"
              />
            </div>
          </div>

          {/* Marge live */}
          {form.buyingPrice && form.sellingPrice && parseFloat(form.sellingPrice) > 0 && (
            <div className="bg-blue-50 rounded-xl px-4 py-2.5 flex justify-between items-center">
              <span className="text-xs text-blue-600 font-semibold">Marge brute calculée</span>
              <span className="text-sm font-black text-blue-700">
                {Math.round(((parseFloat(form.sellingPrice) - parseFloat(form.buyingPrice)) / parseFloat(form.sellingPrice)) * 100)}%
                {' '}({(parseFloat(form.sellingPrice) - parseFloat(form.buyingPrice)).toFixed(0)} MAD)
              </span>
            </div>
          )}

          {/* Catégorie */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1.5">Catégorie</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setForm(f => ({ ...f, category: f.category === cat ? '' : cat }))}
                  className={cn(
                    'text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all',
                    form.category === cat
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1.5">
              Description / Bénéfices <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Décris le produit, ses bénéfices, ce qu'il résout…"
              rows={2}
              className="input-field resize-none"
            />
          </div>

          {/* Cible */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1.5">
              Cible <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="text"
              value={form.targetAudience}
              onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
              placeholder="Ex: Femmes 25-45 ans, mamans, hommes sportifs…"
              className="input-field"
            />
          </div>

          {/* CTA */}
          <button
            onClick={handleScore}
            disabled={loading || !form.productName.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyse en cours…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Analyser ce produit
              </>
            )}
          </button>
        </div>

        {/* ── Résultats ──────────────────────────────────── */}
        {result && verdict && (
          <div id="result-section" className="space-y-4">

            {/* Score global */}
            <div className={cn('rounded-2xl border-2 p-5', verdict.bg, verdict.border)}>
              <div className="flex items-start gap-4">
                <ScoreGauge score={result.score} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{verdict.icon}</span>
                    <span className={cn('text-base font-black', verdict.text)}>{result.label}</span>
                  </div>
                  <p className={cn('text-sm leading-relaxed', verdict.text)}>{result.summary}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-white/70 rounded-lg px-2 py-1 text-xs font-semibold text-gray-600">
                      📅 {result.best_season}
                    </span>
                    <span className="bg-white/70 rounded-lg px-2 py-1 text-xs font-semibold text-gray-600">
                      ✅ Taux conf. estimé : {result.estimated_confirmation_rate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Critères détaillés */}
            <div className="card">
              <h3 className="font-black text-navy text-sm mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                Analyse détaillée par critère
              </h3>
              <div className="space-y-4">
                {result.criteria.map(item => (
                  <CriteriaBar key={item.name} item={item} />
                ))}
              </div>
            </div>

            {/* Forces & Risques */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card">
                <h3 className="font-black text-green-600 text-xs mb-3 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Points forts
                </h3>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h3 className="font-black text-red-500 text-xs mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Risques
                </h3>
                <ul className="space-y-2">
                  {result.risks.map((r, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">!</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Conseils actionnables */}
            <div className="card">
              <h3 className="font-black text-navy text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Conseils pour maximiser tes ventes
              </h3>
              <ol className="space-y-3">
                {result.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-600 leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/assistant?task=Je veux lancer ${result.score >= 6 ? 'ce produit' : 'un meilleur produit'} : ${form.productName}`}
                className="btn-primary text-center text-sm"
              >
                🤖 Discuter avec ShopAI
              </Link>
              <button
                onClick={() => {
                  setResult(null)
                  setForm({ productName: '', buyingPrice: '', sellingPrice: '', category: '', description: '', targetAudience: '' })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="btn-secondary text-center text-sm"
              >
                ↩ Nouveau produit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
