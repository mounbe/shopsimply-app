'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ───────────────────────────────────
interface OnboardingData {
  shopName: string
  platform: 'youcan' | 'shopify' | ''
  niche: string
  model: 'dropshipping' | 'reseller' | 'private_label' | ''
  city: string
  budget: string
}

// ── Step config ──────────────────────────────
const STEPS = [
  { id: 1, label: 'Bienvenue' },
  { id: 2, label: 'Ta boutique' },
  { id: 3, label: 'Ta niche' },
  { id: 4, label: 'Ton modèle' },
  { id: 5, label: 'Génération' },
]

const PLATFORMS = [
  {
    id: 'youcan',
    icon: '🇲🇦',
    name: 'Youcan',
    desc: 'Fait au Maroc · COD intégré · Support arabe',
    badge: 'Recommandé',
  },
  {
    id: 'shopify',
    icon: '🌐',
    name: 'Shopify',
    desc: 'Standard international · Plus de plugins',
    badge: null,
  },
]

const NICHES = [
  { emoji: '💄', label: 'Beauté & Cosmétiques', value: 'Cosmétiques naturels' },
  { emoji: '👗', label: 'Mode & Vêtements', value: 'Mode prêt-à-porter' },
  { emoji: '🏠', label: 'Maison & Déco', value: 'Décoration maison artisanale' },
  { emoji: '📱', label: 'Tech & Gadgets', value: 'Accessoires tech' },
  { emoji: '🌿', label: 'Bien-être & Santé', value: 'Produits bien-être naturels' },
  { emoji: '👶', label: 'Enfants & Bébés', value: 'Produits enfants et puériculture' },
]

const MODELS = [
  {
    id: 'dropshipping',
    icon: '🚚',
    name: 'Dropshipping',
    desc: 'Tu vends sans stock. Le fournisseur livre directement.',
    pros: ['Zéro stock', '0 investissement produit', 'Démarrage rapide'],
    best: true,
  },
  {
    id: 'reseller',
    icon: '📦',
    name: 'Revendeur',
    desc: 'Tu achètes en gros et revends avec marge.',
    pros: ['Meilleure marge', 'Contrôle qualité', 'Stock en main'],
    best: false,
  },
  {
    id: 'private_label',
    icon: '✨',
    name: 'Marque propre',
    desc: 'Tu crées ta propre marque et tes produits.',
    pros: ['Différenciation', 'Fidélité marque', 'Marges élevées'],
    best: false,
  },
]

// ── Main Component ───────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    shopName: '',
    platform: '',
    niche: '',
    model: '',
    city: '',
    budget: '',
  })
  const [loading, setLoading] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [customNiche, setCustomNiche] = useState(false)

  const update = (field: keyof OnboardingData, value: string) =>
    setData(prev => ({ ...prev, [field]: value }))

  const canProceed = () => {
    if (step === 2) return data.shopName.trim().length > 0 && data.platform !== ''
    if (step === 3) return data.niche.trim().length > 0
    if (step === 4) return data.model !== ''
    return true
  }

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1)
      return
    }
    if (step === 4) {
      setStep(5)
      await launchGeneration()
    }
  }

  const launchGeneration = async () => {
    setLoading(true)
    const genSteps = [
      'Analyse de ton profil...',
      'Génération de ton plan 30 jours avec IA...',
      'Configuration de ta boutique...',
      'Finalisation...',
    ]

    // Animate generation steps
    for (let i = 0; i < genSteps.length; i++) {
      setGenerationStep(i)
      await new Promise(res => setTimeout(res, i === 1 ? 3000 : 800))
    }

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Onboarding failed')
      setGenerationStep(4)
      await new Promise(res => setTimeout(res, 600))
      router.push('/dashboard?welcome=1')
    } catch (err) {
      console.error(err)
      // Even if API fails, redirect to dashboard
      router.push('/dashboard?welcome=1')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">

      {/* Progress bar header */}
      {step < 5 && (
        <div className="bg-white border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xl font-black text-navy">
              Shop<span className="text-accent">Simply</span>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              Étape {step - 1} sur 3
            </span>
          </div>
          <div className="flex gap-1.5">
            {[2, 3, 4].map(s => (
              <div
                key={s}
                className={cn(
                  'flex-1 h-1.5 rounded-full transition-all duration-500',
                  step > s ? 'bg-accent' : step === s ? 'bg-accent/40' : 'bg-gray-100'
                )}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 px-5 py-6">

        {/* ── STEP 1 : Welcome ── */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center h-full justify-center gap-6 py-8">
            <div className="w-20 h-20 bg-navy rounded-3xl flex items-center justify-center text-4xl shadow-lg shadow-navy/20">
              🚀
            </div>
            <div>
              <h1 className="text-3xl font-black text-navy mb-3">
                Bienvenue sur<br />
                <span className="text-accent">ShopSimply</span> !
              </h1>
              <p className="text-gray-500 leading-relaxed">
                En 3 minutes, on va configurer ta boutique et générer ton plan 30 jours personnalisé avec l'IA.
              </p>
            </div>

            <div className="w-full space-y-3">
              {[
                { icon: '🎯', text: 'Diagnostic de ton profil' },
                { icon: '🤖', text: 'Plan 30 jours généré par IA' },
                { icon: '🛒', text: 'Boutique configurée en 48h' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3 bg-white rounded-2xl p-3.5 border border-gray-100">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-semibold text-navy">{item.text}</span>
                  <Check className="w-4 h-4 text-green-500 ml-auto" />
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-accent text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-base shadow-lg shadow-accent/25"
            >
              C'est parti ! <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-gray-400 text-xs">3 minutes · Sans CB · 7 jours gratuits</p>
          </div>
        )}

        {/* ── STEP 2 : Boutique ── */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="text-xs font-bold text-accent uppercase tracking-wide mb-2">Étape 1</div>
              <h2 className="text-2xl font-black text-navy">Ta boutique</h2>
              <p className="text-gray-500 text-sm mt-1">Donne un nom à ta boutique et choisis ta plateforme.</p>
            </div>

            {/* Shop name */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Nom de ta boutique</label>
              <input
                type="text"
                value={data.shopName}
                onChange={e => update('shopName', e.target.value)}
                placeholder="Ex: Cosméto Maroc, La Belle Marocaine..."
                className="input text-base"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1.5">Tu pourras le modifier plus tard.</p>
            </div>

            {/* Platform */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-3 block">Plateforme e-commerce</label>
              <div className="space-y-3">
                {PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => update('platform', p.id)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all',
                      data.platform === p.id
                        ? 'border-accent bg-orange-50'
                        : 'border-gray-100 bg-white hover:border-accent/30'
                    )}
                  >
                    <span className="text-3xl">{p.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy">{p.name}</span>
                        {p.badge && (
                          <span className="text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded-full">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
                    </div>
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      data.platform === p.id ? 'border-accent bg-accent' : 'border-gray-300'
                    )}>
                      {data.platform === p.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3 : Niche ── */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <div className="text-xs font-bold text-accent uppercase tracking-wide mb-2">Étape 2</div>
              <h2 className="text-2xl font-black text-navy">Ta niche</h2>
              <p className="text-gray-500 text-sm mt-1">Quel type de produits veux-tu vendre ?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {NICHES.map(n => (
                <button
                  key={n.value}
                  onClick={() => { update('niche', n.value); setCustomNiche(false) }}
                  className={cn(
                    'p-4 rounded-2xl border-2 text-left transition-all',
                    data.niche === n.value && !customNiche
                      ? 'border-accent bg-orange-50'
                      : 'border-gray-100 bg-white hover:border-accent/30'
                  )}
                >
                  <div className="text-2xl mb-1.5">{n.emoji}</div>
                  <div className={cn('text-xs font-bold', data.niche === n.value && !customNiche ? 'text-accent' : 'text-navy')}>
                    {n.label}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom niche */}
            <div>
              <button
                onClick={() => setCustomNiche(true)}
                className="text-teal-brand text-sm font-semibold hover:opacity-80 transition-opacity"
              >
                + Autre niche (saisir manuellement)
              </button>
              {customNiche && (
                <input
                  type="text"
                  value={NICHES.find(n => n.value === data.niche) ? '' : data.niche}
                  onChange={e => update('niche', e.target.value)}
                  placeholder="Ex: Bijoux artisanaux, Épices marocaines..."
                  className="input mt-2 animate-fade-in"
                  autoFocus
                />
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4 : Modèle ── */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <div className="text-xs font-bold text-accent uppercase tracking-wide mb-2">Étape 3</div>
              <h2 className="text-2xl font-black text-navy">Ton modèle de vente</h2>
              <p className="text-gray-500 text-sm mt-1">Comment veux-tu gérer tes produits ?</p>
            </div>

            <div className="space-y-3">
              {MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => update('model', m.id)}
                  className={cn(
                    'w-full p-4 rounded-2xl border-2 text-left transition-all',
                    data.model === m.id
                      ? 'border-accent bg-orange-50'
                      : 'border-gray-100 bg-white hover:border-accent/30'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{m.icon}</span>
                      <div>
                        <span className="font-bold text-navy text-sm">{m.name}</span>
                        {m.best && (
                          <span className="ml-2 text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded-full">
                            Recommandé débutant
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                      data.model === m.id ? 'border-accent bg-accent' : 'border-gray-300'
                    )}>
                      {data.model === m.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2 ml-8">{m.desc}</p>
                  <div className="flex gap-1.5 ml-8 flex-wrap">
                    {m.pros.map(pro => (
                      <span key={pro} className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {pro}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 5 : Génération ── */}
        {step === 5 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 gap-6">
            <div className={cn(
              'w-20 h-20 rounded-3xl flex items-center justify-center text-4xl transition-all duration-500',
              generationStep < 4 ? 'bg-navy animate-pulse' : 'bg-green-500'
            )}>
              {generationStep < 4 ? '🤖' : '✅'}
            </div>

            <div>
              <h2 className="text-2xl font-black text-navy mb-2">
                {generationStep < 4 ? 'Génération en cours...' : 'Tout est prêt !'}
              </h2>
              <p className="text-gray-500 text-sm">
                {generationStep < 4
                  ? "L'IA configure ton espace personnalisé"
                  : `Bienvenue sur ShopSimply, ${data.shopName} !`
                }
              </p>
            </div>

            {/* Generation steps */}
            <div className="w-full space-y-3">
              {[
                'Analyse de ton profil',
                `Génération du plan 30j pour "${data.niche}"`,
                `Configuration boutique ${data.platform}`,
                'Finalisation de ton espace',
              ].map((label, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300',
                    generationStep > i
                      ? 'bg-green-50 border-green-200'
                      : generationStep === i
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-100'
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                    generationStep > i
                      ? 'bg-green-500 text-white'
                      : generationStep === i
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  )}>
                    {generationStep > i ? '✓' : generationStep === i ? (
                      <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : i + 1}
                  </div>
                  <span className={cn(
                    'text-sm font-semibold',
                    generationStep > i ? 'text-green-700' : generationStep === i ? 'text-blue-700' : 'text-gray-400'
                  )}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {generationStep >= 4 && (
              <button
                onClick={() => router.push('/dashboard?welcome=1')}
                className="w-full bg-accent text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity animate-slide-up shadow-lg shadow-accent/25"
              >
                <Sparkles className="w-5 h-5" />
                Voir mon Dashboard →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer navigation */}
      {step > 1 && step < 5 && (
        <div className="px-5 pb-6 space-y-3">
          <button
            onClick={handleNext}
            disabled={!canProceed() || loading}
            className={cn(
              'w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base transition-all',
              canProceed()
                ? 'bg-accent text-white hover:opacity-90 shadow-lg shadow-accent/20'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {step === 4 ? (
              <><Sparkles className="w-5 h-5" /> Générer mon plan IA</>
            ) : (
              <>Continuer <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
          <button
            onClick={() => setStep(step - 1)}
            className="w-full text-center text-gray-400 text-sm flex items-center justify-center gap-1 hover:text-navy transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour
          </button>
        </div>
      )}
    </div>
  )
}
