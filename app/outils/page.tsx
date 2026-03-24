import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const TOOLS = [
  {
    href: '/outils/calculateur-cod',
    icon: '🧮',
    title: 'Calculateur COD',
    desc: 'Calcule ta vraie marge nette en tenant compte des retours, Amana et pub.',
    badge: 'Essentiel',
    badgeColor: 'bg-accent text-white',
    dataTour: 'calculateur-card',
  },
  {
    href: '/outils/scoring-produit',
    icon: '⭐',
    title: 'Scoring produit IA',
    desc: 'Évalue ton produit /10 pour le marché marocain : marge, demande, concurrence, saisonnalité.',
    badge: 'IA',
    badgeColor: 'bg-yellow-400 text-yellow-900',
    dataTour: undefined,
  },
  {
    href: '/outils/predicteur-ventes',
    icon: '📈',
    title: 'Prédicteur de ventes',
    desc: 'Calendrier e-commerce Maroc : Ramadan, Aïd, rentrée, Black Friday — pics de vente par catégorie.',
    badge: 'Nouveau',
    badgeColor: 'bg-teal-brand text-white',
    dataTour: undefined,
  },
  {
    href: '/outils/generateur-contenu',
    icon: '✍️',
    title: 'Générateur de contenu',
    desc: 'Crée des posts Facebook/Instagram optimisés pour le marché marocain avec l\'IA.',
    badge: 'IA',
    badgeColor: 'bg-teal-brand text-white',
    dataTour: 'generateur-card',
  },
  {
    href: '/outils/generateur-visuel',
    icon: '🎨',
    title: 'Générateur de visuels',
    desc: 'Prompts IA optimisés pour créer tes photos produits avec Midjourney, DALL-E, Canva.',
    badge: 'IA',
    badgeColor: 'bg-purple-500 text-white',
    dataTour: undefined,
  },
  {
    href: '/outils/script-relance',
    icon: '💬',
    title: 'Scripts relance COD',
    desc: 'Scripts WhatsApp en darija et français pour confirmer les commandes.',
    badge: 'COD',
    badgeColor: 'bg-green-500 text-white',
    dataTour: undefined,
  },
  {
    href: '/assistant?task=Trouver+un+fournisseur+fiable+pour+ma+niche',
    icon: '🏭',
    title: 'Trouver fournisseur',
    desc: 'L\'IA t\'aide à trouver des fournisseurs fiables selon ta niche.',
    badge: 'IA',
    badgeColor: 'bg-teal-brand text-white',
    dataTour: undefined,
  },
  {
    href: '/assistant?task=Analyser+et+optimiser+ma+page+produit',
    icon: '📝',
    title: 'Optimiser fiche produit',
    desc: 'Améliore tes titres, descriptions et photos pour convertir plus.',
    badge: 'IA',
    badgeColor: 'bg-teal-brand text-white',
    dataTour: undefined,
  },
  {
    href: '/assistant?task=Créer+une+stratégie+de+ciblage+Facebook+Ads',
    icon: '🎯',
    title: 'Stratégie Facebook Ads',
    desc: 'Ciblage, budgets et audiences pour le marché marocain.',
    badge: 'Pub',
    badgeColor: 'bg-purple-500 text-white',
    dataTour: undefined,
  },
]

export default function OutilsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-navy px-5 py-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-blue-200 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">Outils e-commerce</h1>
            <p className="text-blue-200 text-xs mt-0.5">Tout ce qu&apos;il faut pour vendre au Maroc</p>
          </div>
        </div>
      </div>

      {/* Grid outils */}
      <div className="flex-1 px-4 py-5 space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {TOOLS.length} outils disponibles
        </p>

        {TOOLS.map(tool => (
          <Link
            key={tool.href}
            href={tool.href}
            {...(tool.dataTour ? { 'data-tour': tool.dataTour } : {})}
            className="card flex items-start gap-4 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-navy/5 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
              {tool.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-navy text-sm">{tool.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tool.badgeColor}`}>
                  {tool.badge}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{tool.desc}</p>
            </div>
            <span className="text-gray-300 text-lg self-center">›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
