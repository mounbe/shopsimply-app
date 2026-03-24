'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, Zap, Palette, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

// ── Types ─────────────────────────────────────────────────────
interface PromptResult {
  tool: string
  prompt: string
  parameters: string | null
  note: string
}
interface FreeTool { name: string; url: string; tip: string }
interface Colors { primary: string; secondary: string; accent: string; rationale: string }
interface VisualResult {
  prompts: PromptResult[]
  free_tools: FreeTool[]
  design_tips: string[]
  canva_template_suggestion: string
  colors: Colors
  product: string
  visualType: string
}

// ── Config ────────────────────────────────────────────────────
const VISUAL_TYPES = [
  { id: 'product_photo', emoji: '📦', label: 'Photo produit', desc: 'Fond uni, produit seul, professionnel' },
  { id: 'white_background', emoji: '⬜', label: 'Fond blanc', desc: 'Style marketplace/e-commerce classique' },
  { id: 'lifestyle', emoji: '🌿', label: 'Lifestyle', desc: 'Mise en scène avec contexte de vie' },
  { id: 'unboxing', emoji: '🎁', label: 'Unboxing', desc: 'Déballage du produit — viral COD' },
  { id: 'facebook_ad', emoji: '📱', label: 'Pub Facebook', desc: 'Optimisé pour stopper le scroll' },
  { id: 'instagram_post', emoji: '🖼️', label: 'Post Instagram', desc: 'Esthétique feed ou story' },
]

const TONES = [
  { id: 'luxe', label: '✨ Luxe', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { id: 'moderne', label: '⚡ Moderne', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'naturel', label: '🌿 Naturel', color: 'bg-green-50 border-green-200 text-green-700' },
  { id: 'coloré', label: '🎨 Coloré', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'minimaliste', label: '◻️ Minimaliste', color: 'bg-gray-50 border-gray-200 text-gray-600' },
]

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', emoji: '📘' },
  { id: 'instagram', label: 'Instagram', emoji: '📸' },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { id: 'website', label: 'Site web', emoji: '🌐' },
]

const TOOL_COLORS: Record<string, string> = {
  'Midjourney':        'bg-indigo-50 border-indigo-200',
  'DALL-E 3':          'bg-green-50 border-green-200',
  'Stable Diffusion':  'bg-orange-50 border-orange-200',
}

// ── CopyButton ────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-navy transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copié !' : 'Copier'}
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function GenerateurVisuelPage() {
  const { toast } = useToast()

  const [form, setForm] = useState({
    productName: '',
    category: '',
    visualType: '',
    tone: '',
    platform: '',
    targetAudience: '',
    extraDetails: '',
  })
  const [result, setResult] = useState<VisualResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!form.productName.trim() || !form.visualType) {
      toast({ type: 'error', message: 'Remplis le nom du produit et le type de visuel' })
      return
    }

    setLoading(true)
    const toastId = toast({ type: 'loading', message: 'Génération des prompts visuels…', duration: 0 })

    try {
      const res = await fetch('/api/generate-visual-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName:    form.productName,
          category:       form.category || undefined,
          visualType:     form.visualType,
          tone:           form.tone || undefined,
          platform:       form.platform || undefined,
          targetAudience: form.targetAudience || undefined,
          extraDetails:   form.extraDetails || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult(data)
        toast({ id: toastId, type: 'success', message: '3 prompts générés — prêts à utiliser !' })
        setTimeout(() => {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        toast({ id: toastId, type: 'error', message: data.error || 'Erreur de génération' })
      }
    } catch {
      toast({ id: toastId, type: 'error', message: 'Erreur réseau' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-navy px-5 pt-5 pb-6">
        <Link href="/outils" className="flex items-center gap-2 text-blue-200 text-sm mb-4 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Outils
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-400 rounded-xl flex items-center justify-center text-xl">🎨</div>
          <div>
            <h1 className="text-xl font-black text-white">Générateur de visuels IA</h1>
            <p className="text-blue-200 text-xs mt-0.5">Prompts optimisés pour Midjourney, DALL-E, Canva</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">

        {/* Formulaire */}
        <div className="card space-y-4">
          {/* Nom produit */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1.5">Produit à visualiser *</label>
            <input
              type="text"
              value={form.productName}
              onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
              placeholder="Ex: Ceinture lombaire chauffante, Lampe LED rechargeable…"
              className="input-field"
            />
          </div>

          {/* Type de visuel */}
          <div>
            <label className="block text-xs font-bold text-navy mb-2">Type de visuel *</label>
            <div className="grid grid-cols-2 gap-2">
              {VISUAL_TYPES.map(vt => (
                <button
                  key={vt.id}
                  onClick={() => setForm(f => ({ ...f, visualType: vt.id }))}
                  className={cn(
                    'text-left p-3 rounded-xl border-2 transition-all',
                    form.visualType === vt.id
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="text-xl mb-1">{vt.emoji}</div>
                  <div className="font-bold text-xs">{vt.label}</div>
                  <div className={cn('text-[10px] mt-0.5', form.visualType === vt.id ? 'text-blue-200' : 'text-gray-400')}>
                    {vt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Ambiance */}
          <div>
            <label className="block text-xs font-bold text-navy mb-2">Ambiance</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setForm(f => ({ ...f, tone: f.tone === t.id ? '' : t.id }))}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                    form.tone === t.id ? 'bg-navy text-white border-navy' : t.color
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Plateforme */}
          <div>
            <label className="block text-xs font-bold text-navy mb-2">Plateforme cible</label>
            <div className="grid grid-cols-4 gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setForm(f => ({ ...f, platform: f.platform === p.id ? '' : p.id }))}
                  className={cn(
                    'py-2 rounded-xl text-center border-2 transition-all',
                    form.platform === p.id ? 'bg-navy text-white border-navy' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="text-base">{p.emoji}</div>
                  <div className="text-[10px] font-bold mt-0.5">{p.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cible + détails */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">Cible</label>
              <input
                type="text"
                value={form.targetAudience}
                onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
                placeholder="Femmes 25-40 ans…"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">Catégorie</label>
              <input
                type="text"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="Beauté, Maison…"
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* Détails extra */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1.5">
              Détails supplémentaires <span className="text-gray-400 font-normal">(couleur, matière, usage…)</span>
            </label>
            <input
              type="text"
              value={form.extraDetails}
              onChange={e => setForm(f => ({ ...f, extraDetails: e.target.value }))}
              placeholder="Ex: couleur bleu marine, matière bambou, utilisation cuisine…"
              className="input-field"
            />
          </div>

          {/* CTA */}
          <button
            onClick={handleGenerate}
            disabled={loading || !form.productName.trim() || !form.visualType}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Génération…</>
            ) : (
              <><Zap className="w-4 h-4" /> Générer mes prompts visuels</>
            )}
          </button>
        </div>

        {/* ── Résultats ──────────────────────────────────────── */}
        {result && (
          <div id="results" className="space-y-4">

            {/* Palette couleurs */}
            <div className="card">
              <h3 className="font-black text-navy text-sm mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-500" />
                Palette de couleurs recommandée
              </h3>
              <div className="flex gap-3 mb-3">
                {(['primary', 'secondary', 'accent'] as const).map(key => (
                  <div key={key} className="flex-1 text-center">
                    <div
                      className="w-full h-10 rounded-xl mb-1 shadow-sm"
                      style={{ backgroundColor: result.colors[key] }}
                    />
                    <div className="text-[10px] font-mono text-gray-500">{result.colors[key]}</div>
                    <div className="text-[10px] text-gray-400 capitalize">{key}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{result.colors.rationale}</p>
            </div>

            {/* Prompts IA */}
            <div className="space-y-3">
              <h3 className="font-black text-navy text-sm">Prompts pour outils IA</h3>
              {result.prompts.map((p, i) => (
                <div key={i} className={cn('rounded-2xl border-2 p-4 space-y-3', TOOL_COLORS[p.tool] || 'bg-gray-50 border-gray-200')}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-navy text-sm">{p.tool}</span>
                    <CopyButton text={p.parameters ? `${p.prompt} ${p.parameters}` : p.prompt} />
                  </div>

                  <div className="bg-white/80 rounded-xl p-3">
                    <p className="text-xs text-gray-700 font-mono leading-relaxed break-words">{p.prompt}</p>
                    {p.parameters && (
                      <p className="text-xs text-purple-600 font-mono font-bold mt-2 pt-2 border-t border-gray-100">
                        {p.parameters}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 italic">{p.note}</p>
                </div>
              ))}
            </div>

            {/* Outils gratuits */}
            {result.free_tools?.length > 0 && (
              <div className="card">
                <h3 className="font-black text-navy text-sm mb-3">Outils gratuits alternatifs</h3>
                <div className="space-y-3">
                  {result.free_tools.map((tool, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-base flex-shrink-0">
                        🎨
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy text-sm">{tool.name}</span>
                          {tool.url && (
                            <a
                              href={tool.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{tool.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conseils Canva */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <h3 className="font-bold text-blue-700 text-xs mb-2 flex items-center gap-1.5">
                🎨 Suggestion template Canva
              </h3>
              <p className="text-xs text-blue-600 leading-relaxed">{result.canva_template_suggestion}</p>
              <a
                href="https://www.canva.com/templates/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-700 hover:underline"
              >
                Ouvrir Canva Templates <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Tips design */}
            <div className="card">
              <h3 className="font-black text-navy text-sm mb-3">Conseils design pour le marché marocain</h3>
              <ol className="space-y-2.5">
                {result.design_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-600">{tip}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* CTA reset */}
            <div className="flex gap-3 pb-6">
              <Link href="/assistant?task=Aide-moi à créer des visuels percutants pour mes produits e-commerce" className="flex-1 btn-secondary text-center text-sm">
                🤖 Demander à ShopAI
              </Link>
              <button
                onClick={() => { setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className="flex-1 btn-primary text-sm"
              >
                ↩ Nouveau visuel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
