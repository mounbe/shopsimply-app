'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Calendrier saisonnalité Maroc 2026 ────────────────────────
interface Season {
  id: string
  name: string
  emoji: string
  dateRange: string
  startMonth: number  // 1-12
  endMonth: number    // 1-12
  peakMonth: number
  categories: {
    name: string
    boost: number   // % de boost des ventes
    color: string
  }[]
  tips: string[]
  color: string
  bg: string
  border: string
}

const MOROCCO_SEASONS: Season[] = [
  {
    id: 'aïd-fitr',
    name: 'Aïd al-Fitr',
    emoji: '🌙',
    dateRange: 'Mars 2026',
    startMonth: 3, endMonth: 3, peakMonth: 3,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    categories: [
      { name: 'Vêtements enfants', boost: 300, color: '#10b981' },
      { name: 'Chaussures', boost: 250, color: '#059669' },
      { name: 'Parfums / Cosmétiques', boost: 180, color: '#047857' },
      { name: 'Djellabas / Abayas', boost: 220, color: '#065f46' },
      { name: 'Cadeaux & Chocolats', boost: 160, color: '#34d399' },
    ],
    tips: [
      'Lance les pubs Facebook 2 semaines avant l\'Aïd pour les pré-commandes',
      'Propose la livraison express J+1 via Amana : les clients paient le prix fort',
      'Packagings cadeaux = +30% de panier moyen',
      'Cible les pères de famille 30-50 ans pour les vêtements enfants',
    ],
  },
  {
    id: 'ramadan',
    name: 'Ramadan',
    emoji: '🕌',
    dateRange: 'Fév – Mars 2026',
    startMonth: 2, endMonth: 3, peakMonth: 2,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    categories: [
      { name: 'Mode abaya / djellaba', boost: 200, color: '#7c3aed' },
      { name: 'Décoration maison', boost: 150, color: '#6d28d9' },
      { name: 'Électro cuisine (Thermomix...)', boost: 80, color: '#5b21b6' },
      { name: 'Alimentation / Épices', boost: 120, color: '#4c1d95' },
      { name: 'Bougies / Lanternes', boost: 130, color: '#8b5cf6' },
    ],
    tips: [
      'Les achats s\'intensifient à partir du 15e jour de Ramadan (shopping pré-Aïd)',
      'Horaires pubs optimaux : 23h-2h (éveil nocturne)',
      'Darija = +40% de taux de clic sur tes pubs Facebook pendant Ramadan',
      'Crée un pack "Soirée Ramadan" avec plusieurs articles',
    ],
  },
  {
    id: 'rentree',
    name: 'Rentrée scolaire',
    emoji: '📚',
    dateRange: 'Sept 2026',
    startMonth: 9, endMonth: 9, peakMonth: 9,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    categories: [
      { name: 'Fournitures scolaires', boost: 400, color: '#1d4ed8' },
      { name: 'Cartables & Sacs', boost: 200, color: '#1e40af' },
      { name: 'Vêtements enfants', boost: 180, color: '#1e3a8a' },
      { name: 'Chaussures sport', boost: 150, color: '#2563eb' },
      { name: 'Électronique (calculatrice...)', boost: 120, color: '#3b82f6' },
    ],
    tips: [
      'Lance mi-août pour les parents qui achètent en avance',
      'Packs "kit rentrée complet" = panier moyen x2.5',
      'Cible les mères de famille 28-42 ans sur Facebook',
      'Propose un comparateur qualité/prix face aux grandes surfaces',
    ],
  },
  {
    id: 'aïd-adha',
    name: 'Aïd al-Adha',
    emoji: '🐑',
    dateRange: 'Mai – Juin 2026',
    startMonth: 5, endMonth: 6, peakMonth: 5,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    categories: [
      { name: 'Couteaux & Ustensiles', boost: 200, color: '#c2410c' },
      { name: 'Tenues traditionnelles', boost: 150, color: '#ea580c' },
      { name: 'Équipements cuisine', boost: 100, color: '#f97316' },
      { name: 'Nettoyage & Hygiène', boost: 90, color: '#fb923c' },
      { name: 'Frigos & Conservation', boost: 80, color: '#fdba74' },
    ],
    tips: [
      'Vends des articles pratiques pour la journée du sacrifice',
      'Pubs 10 jours avant l\'Aïd avec livraison garantie avant la fête',
      'Tenues + ustensiles = combo gagnant',
    ],
  },
  {
    id: 'black-friday',
    name: 'Black Friday',
    emoji: '🛍️',
    dateRange: 'Novembre 2026',
    startMonth: 11, endMonth: 11, peakMonth: 11,
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    categories: [
      { name: 'Électronique & Gadgets', boost: 180, color: '#374151' },
      { name: 'Mode & Vêtements', boost: 150, color: '#4b5563' },
      { name: 'Beauté & Cosmétiques', boost: 120, color: '#6b7280' },
      { name: 'Maison & Déco', boost: 100, color: '#9ca3af' },
      { name: 'Jouets (pré-Noël)', boost: 90, color: '#d1d5db' },
    ],
    tips: [
      'En forte croissance au Maroc depuis 2022 — ne pas manquer',
      '"Black Friday Maroc" = 4x plus de budget pub Facebook disponible',
      'Propose des offres flash 24h pour créer l\'urgence',
      'Anticipe les ruptures de stock fournisseur',
    ],
  },
  {
    id: 'ete',
    name: 'Été & Soldes',
    emoji: '☀️',
    dateRange: 'Juillet – Août 2026',
    startMonth: 7, endMonth: 8, peakMonth: 7,
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    categories: [
      { name: 'Maillots & Plage', boost: 300, color: '#b45309' },
      { name: 'Ventilateurs & Climatisation', boost: 250, color: '#d97706' },
      { name: 'Articles jardin & BBQ', boost: 180, color: '#f59e0b' },
      { name: 'Lunettes de soleil', boost: 150, color: '#fbbf24' },
      { name: 'Sacs de voyage', boost: 120, color: '#fcd34d' },
    ],
    tips: [
      'La chaleur marocaine est un levier marketing puissant',
      'Fête du Trône (30 juillet) : pics de consommation',
      'Soldes = -30% prix mais volumes x3 — reste rentable',
      'Ciblage géo : Casablanca, Rabat, Marrakech, Tanger',
    ],
  },
  {
    id: 'hiver',
    name: 'Rentrée Hiver',
    emoji: '🧥',
    dateRange: 'Oct – Nov 2026',
    startMonth: 10, endMonth: 11, peakMonth: 10,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    categories: [
      { name: 'Chauffage (radiateurs...)', boost: 150, color: '#3730a3' },
      { name: 'Vêtements chauds', boost: 200, color: '#4338ca' },
      { name: 'Couvertures & Plaids', boost: 100, color: '#4f46e5' },
      { name: 'Chaussures fermées', boost: 90, color: '#6366f1' },
      { name: 'Équipements pluie', boost: 80, color: '#818cf8' },
    ],
    tips: [
      'Le froid marocain arrive brutalement en octobre — anticipe',
      'Ciblage par ville : Fès, Meknès, Ifrane (plus froid)',
      'Bundle "Kit Hiver" = couverture + pyjama + chaussons',
    ],
  },
]

// ── Mois labels ───────────────────────────────────────────────
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']
const CURRENT_MONTH = 3  // Mars 2026

function getSeasonForMonth(month: number): Season[] {
  return MOROCCO_SEASONS.filter(s => month >= s.startMonth && month <= s.endMonth)
}

function getBoostForMonth(month: number, category: string): number {
  const seasons = getSeasonForMonth(month)
  let maxBoost = 0
  for (const season of seasons) {
    const match = season.categories.find(c =>
      c.name.toLowerCase().includes(category.toLowerCase()) ||
      category.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])
    )
    if (match && match.boost > maxBoost) maxBoost = match.boost
  }
  return maxBoost
}

// ── Main Component ────────────────────────────────────────────
export default function PredicteurVentesPage() {
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  const monthSeasons = useMemo(() => {
    if (selectedMonth === null) return []
    return getSeasonForMonth(selectedMonth + 1)
  }, [selectedMonth])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-navy px-5 pt-5 pb-6">
        <Link href="/outils" className="flex items-center gap-2 text-blue-200 text-sm mb-4 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Outils
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-brand rounded-xl flex items-center justify-center text-xl">📈</div>
          <div>
            <h1 className="text-xl font-black text-white">Prédicteur de Ventes</h1>
            <p className="text-blue-200 text-xs mt-0.5">Calendrier e-commerce Maroc 2026</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-5">

        {/* Timeline Mois */}
        <div className="card">
          <h2 className="font-black text-navy text-sm mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            Clique sur un mois pour voir les pics de vente
          </h2>
          <div className="grid grid-cols-6 gap-1.5">
            {MONTHS.map((month, i) => {
              const monthNum = i + 1
              const seasons = getSeasonForMonth(monthNum)
              const isActive = selectedMonth === i
              const isCurrent = monthNum === CURRENT_MONTH
              const hasSeason = seasons.length > 0

              return (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(isActive ? null : i)}
                  className={cn(
                    'relative py-2 px-1 rounded-xl text-center text-xs font-bold transition-all',
                    isActive ? 'bg-navy text-white shadow-lg scale-105' :
                    isCurrent ? 'bg-accent/20 text-accent border-2 border-accent' :
                    hasSeason ? 'bg-accent/10 text-navy border border-accent/30 hover:bg-accent/20' :
                    'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  )}
                >
                  {month}
                  {hasSeason && !isActive && (
                    <span className="absolute -top-1 -right-1 text-base leading-none">
                      {seasons[0].emoji}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="block text-[9px] mt-0.5 font-black opacity-70">ACTUEL</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Détail mois sélectionné */}
          {selectedMonth !== null && (
            <div className="mt-4 space-y-3">
              <h3 className="font-black text-navy text-sm">{MONTHS[selectedMonth]} 2026</h3>
              {monthSeasons.length > 0 ? (
                monthSeasons.map(season => (
                  <div key={season.id} className={cn('rounded-xl p-3 border', season.bg, season.border)}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{season.emoji}</span>
                      <span className={cn('font-black text-sm', season.color)}>{season.name}</span>
                    </div>
                    <div className="space-y-1.5">
                      {season.categories.map(cat => (
                        <div key={cat.name} className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-gray-600 font-medium">{cat.name}</span>
                              <span className="font-black" style={{ color: cat.color }}>+{cat.boost}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(100, cat.boost / 4)}%`, backgroundColor: cat.color }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-100 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-sm">Pas de pic de vente majeur ce mois-ci.</p>
                  <p className="text-gray-400 text-xs mt-1">Bon pour tester de nouveaux produits ou optimiser ton catalogue.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Événements 2026 */}
        <div>
          <h2 className="section-title">Événements clés e-commerce Maroc 2026</h2>
          <div className="space-y-3">
            {MOROCCO_SEASONS.map(season => (
              <button
                key={season.id}
                onClick={() => setSelectedSeason(selectedSeason?.id === season.id ? null : season)}
                className={cn(
                  'w-full text-left rounded-2xl p-4 border-2 transition-all',
                  selectedSeason?.id === season.id
                    ? cn(season.bg, season.border, 'shadow-sm')
                    : 'bg-white border-gray-100 hover:border-gray-200'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{season.emoji}</span>
                    <div>
                      <div className="font-black text-navy text-sm">{season.name}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{season.dateRange}</div>
                    </div>
                  </div>
                  <div className={cn(
                    'text-xl font-black',
                    season.categories[0].boost >= 200 ? 'text-green-600' : 'text-blue-600'
                  )}>
                    +{season.categories[0].boost}%
                  </div>
                </div>

                {/* Top 2 catégories */}
                <div className="flex gap-2 mt-2">
                  {season.categories.slice(0, 2).map(cat => (
                    <span key={cat.name} className="text-xs bg-gray-100 text-gray-500 rounded-lg px-2 py-1">
                      {cat.name}
                    </span>
                  ))}
                  {season.categories.length > 2 && (
                    <span className="text-xs text-gray-400 py-1">+{season.categories.length - 2} autres</span>
                  )}
                </div>

                {/* Détail dépliable */}
                {selectedSeason?.id === season.id && (
                  <div className="mt-4 space-y-3">
                    {/* Toutes catégories */}
                    <div className="space-y-2">
                      {season.categories.map(cat => (
                        <div key={cat.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold text-gray-700">{cat.name}</span>
                            <span className="font-black" style={{ color: cat.color }}>+{cat.boost}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(100, cat.boost / 4)}%`, backgroundColor: cat.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Conseils */}
                    <div className={cn('rounded-xl p-3', season.bg)}>
                      <h4 className={cn('text-xs font-black mb-2', season.color)}>💡 Conseils ShopAI</h4>
                      <ul className="space-y-1.5">
                        {season.tips.map((tip, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="mt-0.5 flex-shrink-0">→</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/assistant?task=Je veux préparer ma boutique pour ${season.name} : donne-moi un plan d'action`}
                      className="btn-primary w-full text-center text-sm"
                      onClick={e => e.stopPropagation()}
                    >
                      🤖 Préparer mon plan {season.name}
                    </Link>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Règle d'or */}
        <div className="bg-navy rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="text-white font-black text-sm mb-2">La règle d&apos;or du timing Maroc</h3>
              <ul className="space-y-1.5">
                {[
                  'Lance tes pubs 2-3 semaines avant l\'événement',
                  'Le pic d\'achat se passe les 3-5 jours AVANT la fête',
                  'Le lendemain : les retours remontent, baisse les pubs',
                  'Ramadan = acheter en stock à l\'avance, la demande explose',
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-blue-100">
                    <span className="text-accent font-bold mt-0.5">{i + 1}.</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
