'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type ScriptType = 'confirmation' | 'expedition' | 'retard' | 'retour' | 'feedback' | 'promo' | 'abandon'
type ScriptLang = 'darija' | 'fr' | 'both'

interface Script {
  id: string
  type: ScriptType
  lang: ScriptLang
  label: string
  icon: string
  situation: string
  text: string
}

const SCRIPTS: Script[] = [
  {
    id: '1', type: 'confirmation', lang: 'darija', label: 'Confirmation COD — Darija', icon: '📦',
    situation: 'Client a commandé mais n\'a pas encore confirmé',
    text: `السلام عليكم [الاسم] 😊

كنتواصل معاك من [اسم المتجر] بخصوص طلبيتك رقم [رقم الطلبية].

واش تقدر/ي تأكد/ي لنا الطلبية باش نبعتوها ليك/ليكي اليوم؟

الثمن: [الثمن] درهم — التوصيل بالدفع عند الاستلام 🚚

جاوبني هنا أو على واتساب، شكرا 🙏`,
  },
  {
    id: '2', type: 'confirmation', lang: 'fr', label: 'Confirmation COD — Français', icon: '📦',
    situation: 'Client a commandé mais n\'a pas encore confirmé',
    text: `Bonjour [Prénom] 😊

Je vous contacte depuis [Nom boutique] concernant votre commande n°[Numéro].

Pourriez-vous confirmer votre commande afin que nous puissions l'expédier aujourd'hui ?

Montant : [Prix] MAD — Paiement à la livraison (COD) 🚚

Répondez ici ou sur WhatsApp. Merci ! 🙏`,
  },
  {
    id: '3', type: 'expedition', lang: 'darija', label: 'Commande expédiée — Darija', icon: '🚚',
    situation: 'Commande confirmée et en cours de livraison',
    text: `السلام [الاسم] 🎉

طلبيتك تبعت! كتوصلك مع Amana خلال 24-48 ساعة.

رقم التتبع: [رقم التتبع]

كانتظروك فدارك باش تكون حاضر/ة 😊

أي سؤال، ردي هنا 👇`,
  },
  {
    id: '4', type: 'expedition', lang: 'fr', label: 'Commande expédiée — Français', icon: '🚚',
    situation: 'Commande confirmée et en cours de livraison',
    text: `Bonjour [Prénom] 🎉

Votre commande est en route ! Elle sera livrée par Amana Express dans 24-48h.

Numéro de suivi : [Numéro]

Soyez disponible à votre adresse lors de la livraison 😊

Des questions ? Répondez ici !`,
  },
  {
    id: '5', type: 'retard', lang: 'darija', label: 'Retard livraison — Darija', icon: '⏰',
    situation: 'Livraison prend plus longtemps que prévu',
    text: `السلام [الاسم]،

كنعتدروا بزاف، طلبيتك تأخرات شوية بسبب ضغط التوصيلات 🙏

غادي توصلك خلال [وقت جديد].

نقدروا نعوضوك بـ [خصم/هدية] على طلبيتك الجاية.

شكرا على صبرك 💙`,
  },
  {
    id: '6', type: 'feedback', lang: 'both', label: 'Demande d\'avis — Les deux', icon: '⭐',
    situation: 'Après livraison confirmée (J+2)',
    text: `Salam [Prénom] ! 😊
السلام [الاسم]!

On espère que vous êtes satisfait(e) de votre commande 🌟
نتمنى بغيتي طلبيتك!

Votre avis nous aide beaucoup — pouvez-vous nous laisser 5 étoiles ?
رأيك مهم لينا — واش تقدر/ي تعطينا تقييم؟

👉 [LIEN AVIS]

Merci ! Choukran ! 🙏`,
  },
  {
    id: '7', type: 'promo', lang: 'darija', label: 'Offre fidélité — Darija', icon: '🎁',
    situation: 'Client qui a déjà commandé — réengagement',
    text: `Salam [الاسم] 🎉

عندنا ليك هدية خاصة بحيث راك زبون مميز!

-15% على طلبيتك الجاية: كود [CODEX15]

صالح حتى [التاريخ] ⏰

تسوق دابا 👇
[رابط المتجر]`,
  },
  {
    id: '8', type: 'abandon', lang: 'fr', label: 'Panier abandonné — Français', icon: '🛒',
    situation: 'Client a visité le site mais n\'a pas commandé',
    text: `Bonjour [Prénom] 👋

Vous avez regardé [Produit] sur notre boutique mais n'avez pas finalisé votre commande.

✅ Le produit est toujours disponible
🚚 Livraison COD — payez à la réception
⭐ Déjà [X] clients satisfaits au Maroc

Commandez maintenant avec -10% : code [CODE10]
👉 [LIEN PRODUIT]`,
  },
]

const TYPE_LABELS: Record<ScriptType, string> = {
  confirmation: '📦 Confirmation COD',
  expedition:   '🚚 Expédition',
  retard:       '⏰ Retard',
  retour:       '↩️ Retour produit',
  feedback:     '⭐ Demande avis',
  promo:        '🎁 Offre fidélité',
  abandon:      '🛒 Panier abandonné',
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600">
      {copied ? <><Check className="w-3 h-3 text-green-600" /> Copié</> : <><Copy className="w-3 h-3" /> Copier</>}
    </button>
  )
}

export default function ScriptRelancePage() {
  const router = useRouter()
  const [activeType, setActiveType] = useState<ScriptType | null>(null)

  const filtered = activeType ? SCRIPTS.filter(s => s.type === activeType) : SCRIPTS

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      <div className="bg-navy px-5 py-5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center"><span className="text-xl">💬</span></div>
        <div>
          <h1 className="text-white font-black">Scripts relance COD</h1>
          <p className="text-blue-200 text-xs">{SCRIPTS.length} templates darija &amp; français</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-700 leading-relaxed">
          💡 Remplace les variables entre <strong>[crochets]</strong> par les infos du client avant d&apos;envoyer.
        </div>

        {/* Filtres par type */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button onClick={() => setActiveType(null)}
            className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
              !activeType ? 'bg-navy text-white border-navy' : 'bg-white text-gray-500 border-gray-200')}>
            Tous ({SCRIPTS.length})
          </button>
          {(Object.entries(TYPE_LABELS) as [ScriptType, string][]).map(([type, label]) => (
            <button key={type} onClick={() => setActiveType(activeType === type ? null : type)}
              className={cn('flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                activeType === type ? 'bg-navy text-white border-navy' : 'bg-white text-gray-500 border-gray-200')}>
              {label}
            </button>
          ))}
        </div>

        {/* Scripts */}
        {filtered.map(script => (
          <div key={script.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{script.icon}</span>
                  <span className="font-bold text-navy text-sm">{script.label}</span>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                    script.lang === 'darija' ? 'bg-green-100 text-green-700' : script.lang === 'fr' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>
                    {script.lang === 'darija' ? '🇲🇦 Darija' : script.lang === 'fr' ? '🇫🇷 FR' : '🔀 Bilingue'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{script.situation}</p>
              </div>
              <CopyBtn text={script.text} />
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line font-mono text-xs">
              {script.text}
            </div>
            <div className="flex gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(script.text)}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                💬 Ouvrir sur WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
