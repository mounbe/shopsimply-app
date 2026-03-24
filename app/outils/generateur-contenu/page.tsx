'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type Platform = 'facebook' | 'instagram' | 'tiktok' | 'whatsapp'
type ContentType = 'pub' | 'post_organique' | 'story' | 'description_produit' | 'message_relance'

const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: 'facebook',   label: 'Facebook',   icon: '📘' },
  { id: 'instagram',  label: 'Instagram',  icon: '📸' },
  { id: 'tiktok',     label: 'TikTok',     icon: '🎵' },
  { id: 'whatsapp',   label: 'WhatsApp',   icon: '💬' },
]

const CONTENT_TYPES: { id: ContentType; label: string; desc: string }[] = [
  { id: 'pub',               label: '📣 Pub payante',      desc: 'Texte pour une publicité Facebook/Instagram' },
  { id: 'post_organique',    label: '📝 Post organique',   desc: 'Post sans pub pour ta page' },
  { id: 'story',             label: '⚡ Story',            desc: 'Texte court pour une story' },
  { id: 'description_produit', label: '🛒 Description',   desc: 'Fiche produit e-commerce' },
  { id: 'message_relance',   label: '💬 Message relance',  desc: 'Relance COD en darija/français' },
]

const TONES = ['Enthousiaste', 'Professionnel', 'Urgent (offre limitée)', 'Émotionnel', 'Humoristique']
const LANGS = [
  { id: 'fr', label: '🇫🇷 Français' },
  { id: 'darija', label: '🇲🇦 Darija' },
  { id: 'both', label: '🔀 Les deux' },
]

interface GeneratedContent {
  platform: Platform
  type: ContentType
  text: string
  hashtags?: string
  cta?: string
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0">
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
    </button>
  )
}

export default function GenerateurContenuPage() {
  const router = useRouter()

  const [platform, setPlatform] = useState<Platform>('facebook')
  const [contentType, setContentType] = useState<ContentType>('pub')
  const [productName, setProductName] = useState('')
  const [productDesc, setProductDesc] = useState('')
  const [price, setPrice] = useState('')
  const [tone, setTone] = useState('Enthousiaste')
  const [lang, setLang] = useState<'fr' | 'darija' | 'both'>('fr')
  const [customInstructions, setCustomInstructions] = useState('')
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<GeneratedContent[]>([])
  const [streamingText, setStreamingText] = useState('')

  const buildPrompt = () => {
    const platformLabels = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', whatsapp: 'WhatsApp' }
    const typeLabels = { pub: 'publicité payante', post_organique: 'post organique', story: 'story', description_produit: 'description produit e-commerce', message_relance: 'message de relance COD WhatsApp' }
    const langInstructions = lang === 'fr' ? 'en français' : lang === 'darija' ? 'en darija marocaine (écriture latine)' : 'en français ET en darija marocaine (deux versions séparées)'

    return `Génère du contenu marketing ${typeLabels[contentType]} pour ${platformLabels[platform]} ${langInstructions}.

Produit : ${productName}
${productDesc ? `Description : ${productDesc}` : ''}
${price ? `Prix : ${price} MAD (paiement en COD)` : ''}
Ton : ${tone}
${customInstructions ? `Instructions spéciales : ${customInstructions}` : ''}

Marché cible : Maroc (culture marocaine, références locales).

${contentType === 'pub' ? `Structure :
- Accroche (1 ligne percutante)
- Corps (2-3 lignes bénéfices)
- Preuve sociale ou urgence
- CTA fort (livraison COD, "Commander maintenant")` : ''}

${contentType === 'message_relance' ? `Message court (max 3 lignes), chaleureux, pour confirmer une commande COD non confirmée. Inclure : emoji, nom client placeholder "[NOM]", bouton d'action clair.` : ''}

${platform === 'instagram' ? `Ajoute 5-8 hashtags pertinents pour le marché marocain.` : ''}

Réponds avec le contenu directement, sans introduction ni explication.`
  }

  const generate = async () => {
    if (!productName.trim()) return
    setGenerating(true)
    setStreamingText('')
    setResults([])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: buildPrompt() }],
          context: { userName: 'ShopSimply', niche: productName, platform: 'Youcan' },
        }),
      })

      if (!response.body) throw new Error()
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try { const p = JSON.parse(line.slice(6)); if (p.text) { content += p.text; setStreamingText(content) } } catch {}
          }
        }
      }

      setResults([{ platform, type: contentType, text: content.trim() }])
      setStreamingText('')
    } catch {
      // silent
    } finally {
      setGenerating(false)
    }
  }

  const generateVariants = async () => {
    if (!productName.trim() || generating) return
    setGenerating(true)
    setResults([])
    setStreamingText('')

    // Generate 3 variants
    const variants: GeneratedContent[] = []
    for (const t of ['Enthousiaste', 'Urgent (offre limitée)', 'Émotionnel']) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: buildPrompt().replace(`Ton : ${tone}`, `Ton : ${t}`) + '\n\nSois très concis (max 5 lignes).' }],
            context: { userName: 'ShopSimply', niche: productName, platform: 'Youcan' },
          }),
        })
        if (!response.body) continue
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let content = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          for (const line of decoder.decode(value).split('\n')) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try { const p = JSON.parse(line.slice(6)); if (p.text) content += p.text } catch {}
            }
          }
        }
        variants.push({ platform, type: contentType, text: content.trim() })
        setResults([...variants])
      } catch { continue }
    }
    setGenerating(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      <div className="bg-navy px-5 py-5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center"><Sparkles className="w-5 h-5 text-white" /></div>
        <div>
          <h1 className="text-white font-black">Générateur de contenu</h1>
          <p className="text-blue-200 text-xs">Posts, pubs, stories — adapté au Maroc</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">
        {/* Plateforme */}
        <div className="card space-y-3">
          <h2 className="font-bold text-navy text-sm">📱 Plateforme</h2>
          <div className="grid grid-cols-4 gap-2">
            {PLATFORMS.map(p => (
              <button key={p.id} type="button" onClick={() => setPlatform(p.id)}
                className={cn('flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
                  platform === p.id ? 'border-accent bg-orange-50' : 'border-gray-100 hover:border-gray-200')}>
                <span className="text-2xl">{p.icon}</span>
                <span className={cn('text-[10px] font-bold', platform === p.id ? 'text-accent' : 'text-gray-500')}>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Type de contenu */}
        <div className="card space-y-3">
          <h2 className="font-bold text-navy text-sm">✍️ Type de contenu</h2>
          <div className="space-y-2">
            {CONTENT_TYPES.map(ct => (
              <button key={ct.id} type="button" onClick={() => setContentType(ct.id)}
                className={cn('w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                  contentType === ct.id ? 'border-accent bg-orange-50' : 'border-gray-100 hover:border-gray-200')}>
                <span className={cn('flex-1 text-sm font-semibold', contentType === ct.id ? 'text-accent' : 'text-navy')}>{ct.label}</span>
                <span className="text-xs text-gray-400">{ct.desc}</span>
                {contentType === ct.id && <div className="w-4 h-4 bg-accent rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">✓</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Produit */}
        <div className="card space-y-3">
          <h2 className="font-bold text-navy text-sm">📦 Produit</h2>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Nom du produit *</label>
            <input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="Ex: Crème argan naturelle 50ml" className="input" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Avantages clés <span className="text-gray-400 font-normal normal-case">(optionnel)</span></label>
            <textarea value={productDesc} onChange={e => setProductDesc(e.target.value)}
              placeholder="Ex: 100% naturel, hydrate en 24h, sans parabènes..." rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Prix de vente <span className="text-gray-400 font-normal normal-case">(optionnel)</span></label>
            <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="199" className="input" />
          </div>
        </div>

        {/* Ton + langue */}
        <div className="card space-y-3">
          <h2 className="font-bold text-navy text-sm">🎨 Style</h2>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Ton</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button key={t} type="button" onClick={() => setTone(t)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                    tone === t ? 'border-accent bg-orange-50 text-accent' : 'border-gray-200 text-gray-500')}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Langue</label>
            <div className="grid grid-cols-3 gap-2">
              {LANGS.map(l => (
                <button key={l.id} type="button" onClick={() => setLang(l.id as typeof lang)}
                  className={cn('py-2 rounded-xl border-2 text-xs font-bold transition-all',
                    lang === l.id ? 'border-accent bg-orange-50 text-accent' : 'border-gray-200 text-gray-500')}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Instructions spéciales <span className="text-gray-400 font-normal normal-case">(optionnel)</span></label>
            <input type="text" value={customInstructions} onChange={e => setCustomInstructions(e.target.value)}
              placeholder="Ex: Mentionner livraison gratuite à Casa, citer Ramadan..." className="input" />
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-3">
          <button onClick={generate} disabled={generating || !productName.trim()}
            className={cn('flex-1 btn-primary flex items-center justify-center gap-2', (generating || !productName.trim()) && 'opacity-60')}>
            {generating && !results.length ? <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Génération...</> : <><Sparkles className="w-4 h-4" /> Générer</>}
          </button>
          <button onClick={generateVariants} disabled={generating || !productName.trim()}
            className={cn('flex-1 bg-navy text-white font-bold py-4 px-4 rounded-2xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2',
              (generating || !productName.trim()) && 'opacity-60')}>
            🔀 3 variantes
          </button>
        </div>

        {/* Streaming */}
        {streamingText && (
          <div className="card bg-navy/5 border-navy/10">
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {streamingText}
              <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse align-middle" />
            </div>
          </div>
        )}

        {/* Résultats */}
        {results.map((r, i) => (
          <div key={i} className="card border-l-4 border-l-accent">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-navy text-sm">
                  {results.length > 1 ? `Variante ${i + 1}` : 'Contenu généré'}
                </span>
                <span className="text-xs bg-accent/10 text-accent font-bold px-2 py-0.5 rounded-full">
                  {PLATFORMS.find(p => p.id === r.platform)?.icon} {PLATFORMS.find(p => p.id === r.platform)?.label}
                </span>
              </div>
              <CopyBtn text={r.text} />
            </div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-3">
              {r.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
