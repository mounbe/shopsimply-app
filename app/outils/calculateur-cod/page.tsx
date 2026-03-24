'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calculator, TrendingUp, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Tarifs réels Amana Express Maroc 2026 ────────────
const AMANA_TARIFFS = [
  { label: 'Casablanca → Casablanca', cost: 20 },
  { label: 'Inter-villes (même région)', cost: 25 },
  { label: 'National standard', cost: 30 },
  { label: 'Zone éloignée (Sud/Nord)', cost: 40 },
]

const RETURN_COST = 15 // coût retour COD

interface Result {
  sellingPrice: number
  supplierCost: number
  delivery: number
  returnRate: number
  returnCost: number
  advertisingCost: number
  grossMargin: number
  netMarginPerOrder: number
  netMarginPct: number
  breakEvenOrders: number
  roi: number
  status: 'excellent' | 'good' | 'warning' | 'bad'
  statusLabel: string
  statusColor: string
}

function NumInput({
  label, value, onChange, suffix, prefix, hint, min = 0,
}: {
  label: string; value: string; onChange: (v: string) => void;
  suffix?: string; prefix?: string; hint?: string; min?: number
}) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-accent transition-colors bg-white">
        {prefix && <span className="text-gray-400 text-sm font-semibold">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          min={min}
          className="flex-1 text-sm text-navy font-bold focus:outline-none bg-transparent"
          placeholder="0"
        />
        {suffix && <span className="text-gray-400 text-sm font-semibold">{suffix}</span>}
      </div>
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

export default function CalculateurCODPage() {
  const [sellingPrice, setSellingPrice]     = useState('199')
  const [supplierCost, setSupplierCost]     = useState('60')
  const [deliveryZone, setDeliveryZone]     = useState(2)  // index dans AMANA_TARIFFS
  const [returnRate, setReturnRate]         = useState('30') // % retours COD Maroc ~30%
  const [adBudgetPerOrder, setAdBudgetPerOrder] = useState('25')
  const [monthlyOrders, setMonthlyOrders]   = useState('50')
  const [result, setResult]                 = useState<Result | null>(null)

  useEffect(() => {
    calculate()
  }, [sellingPrice, supplierCost, deliveryZone, returnRate, adBudgetPerOrder])

  const calculate = () => {
    const sp    = parseFloat(sellingPrice) || 0
    const sc    = parseFloat(supplierCost) || 0
    const del   = AMANA_TARIFFS[deliveryZone].cost
    const rr    = parseFloat(returnRate) / 100 || 0
    const ad    = parseFloat(adBudgetPerOrder) || 0

    if (sp <= 0) { setResult(null); return }

    // Sur 100 commandes envoyées :
    // - (1 - rr) commandes livrées → chacune rapporte sp - sc - del - ad
    // - rr commandes retournées → chacune coûte sc + del + RETURN_COST + ad (produit récupéré mais frais perdus)

    const deliveredRevenue = (1 - rr) * (sp - sc - del - ad)
    const returnedCost     = rr * (sc + del + RETURN_COST + ad)
    const netPerOrder      = deliveredRevenue - returnedCost

    const grossMargin    = sp - sc - del
    const netMarginPct   = sp > 0 ? (netPerOrder / sp) * 100 : 0

    // Seuil de rentabilité (nombre de commandes pour couvrir frais fixes ~ 0 ici, calcul par pub)
    const breakEven = ad > 0 ? Math.ceil(ad / Math.max(netPerOrder, 0.01)) : 0
    const roi       = ad > 0 ? ((netPerOrder / ad) * 100) : 0

    let status: Result['status'] = 'bad'
    let statusLabel = ''
    let statusColor = ''

    if (netMarginPct >= 30) {
      status = 'excellent'; statusLabel = '🚀 Excellente marge'; statusColor = 'text-green-600'
    } else if (netMarginPct >= 15) {
      status = 'good'; statusLabel = '✅ Marge correcte'; statusColor = 'text-blue-600'
    } else if (netMarginPct >= 5) {
      status = 'warning'; statusLabel = '⚠️ Marge faible — optimise'; statusColor = 'text-amber-600'
    } else {
      status = 'bad'; statusLabel = '❌ Tu perds de l\'argent'; statusColor = 'text-red-600'
    }

    setResult({
      sellingPrice: sp, supplierCost: sc, delivery: del,
      returnRate: rr * 100, returnCost: RETURN_COST,
      advertisingCost: ad,
      grossMargin, netMarginPerOrder: netPerOrder,
      netMarginPct, breakEvenOrders: breakEven, roi,
      status, statusLabel, statusColor,
    })
  }

  const monthlyProfit = result
    ? result.netMarginPerOrder * (parseFloat(monthlyOrders) || 0)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-navy px-5 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/outils" className="text-blue-200 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-black">Calculateur COD</h1>
            <p className="text-blue-200 text-xs">Calcule ta vraie marge au Maroc</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">

        {/* Inputs */}
        <div className="card space-y-4">
          <h2 className="font-bold text-navy">💰 Ton produit</h2>

          <div className="grid grid-cols-2 gap-3">
            <NumInput
              label="Prix de vente client"
              value={sellingPrice}
              onChange={setSellingPrice}
              suffix="MAD"
              hint="Ce que le client paie"
            />
            <NumInput
              label="Prix fournisseur"
              value={supplierCost}
              onChange={setSupplierCost}
              suffix="MAD"
              hint="Achat + emballage"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Zone de livraison (Amana Express)
            </label>
            <div className="space-y-1.5">
              {AMANA_TARIFFS.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDeliveryZone(i)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all text-sm',
                    deliveryZone === i
                      ? 'border-accent bg-orange-50'
                      : 'border-gray-100 hover:border-gray-200'
                  )}
                >
                  <span className={cn('font-semibold', deliveryZone === i ? 'text-accent' : 'text-navy')}>
                    {t.label}
                  </span>
                  <span className={cn('font-black', deliveryZone === i ? 'text-accent' : 'text-gray-400')}>
                    {t.cost} MAD
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumInput
              label="Taux de retour"
              value={returnRate}
              onChange={setReturnRate}
              suffix="%"
              hint="Maroc moyen: 25-40%"
            />
            <NumInput
              label="Pub par commande"
              value={adBudgetPerOrder}
              onChange={setAdBudgetPerOrder}
              suffix="MAD"
              hint="Budget pub ÷ nbre commandes"
            />
          </div>
        </div>

        {/* Résultats */}
        {result && (
          <>
            {/* Statut global */}
            <div className={cn(
              'rounded-2xl p-4 border-2',
              result.status === 'excellent' ? 'bg-green-50 border-green-200' :
              result.status === 'good'      ? 'bg-blue-50 border-blue-200' :
              result.status === 'warning'   ? 'bg-amber-50 border-amber-200' :
              'bg-red-50 border-red-200'
            )}>
              <div className={cn('text-lg font-black mb-1', result.statusColor)}>
                {result.statusLabel}
              </div>
              <p className={cn('text-sm', result.statusColor, 'opacity-80')}>
                {result.status === 'excellent' && 'Continue sur cette lancée, ce produit est très rentable.'}
                {result.status === 'good'      && 'Bonne rentabilité. Optimise la pub pour augmenter encore.'}
                {result.status === 'warning'   && 'Réduis le coût fournisseur ou augmente le prix de vente.'}
                {result.status === 'bad'       && 'Ce produit n\'est pas rentable avec ces paramètres.'}
              </p>
            </div>

            {/* Détail des marges */}
            <div className="card space-y-0 divide-y divide-gray-50">
              <h2 className="font-bold text-navy pb-3">📊 Détail par commande</h2>

              {[
                { label: 'Prix de vente', value: `+${result.sellingPrice} MAD`, color: 'text-green-600 font-black' },
                { label: 'Coût fournisseur', value: `-${result.supplierCost} MAD`, color: 'text-red-500' },
                { label: 'Livraison Amana', value: `-${result.delivery} MAD`, color: 'text-red-500' },
                { label: 'Marge brute', value: `${result.grossMargin.toFixed(0)} MAD`, color: result.grossMargin > 0 ? 'text-navy font-bold' : 'text-red-600 font-bold', divider: true },
                { label: `Retours (${result.returnRate}%) → -${result.returnCost} MAD/retour`, value: `-${(result.returnRate / 100 * (result.delivery + result.returnCost)).toFixed(0)} MAD`, color: 'text-amber-600' },
                { label: 'Budget pub par commande', value: `-${result.advertisingCost} MAD`, color: 'text-red-500' },
                { label: '✓ Marge nette réelle', value: `${result.netMarginPerOrder.toFixed(0)} MAD (${result.netMarginPct.toFixed(1)}%)`, color: result.netMarginPerOrder >= 0 ? 'text-accent font-black text-base' : 'text-red-600 font-black text-base', divider: true },
              ].map((row, i) => (
                <div key={i} className={cn('flex items-center justify-between py-2.5', row.divider && 'border-t-2 border-gray-200 mt-1')}>
                  <span className="text-sm text-gray-600">{row.label}</span>
                  <span className={cn('text-sm', row.color)}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Simulateur mensuel */}
            <div className="card space-y-3">
              <h2 className="font-bold text-navy flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" /> Simulation mensuelle
              </h2>
              <NumInput
                label="Commandes expédiées / mois"
                value={monthlyOrders}
                onChange={setMonthlyOrders}
                suffix="cmd"
                hint="Objectif réaliste pour démarrer : 30-100"
              />
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { label: 'Commandes livrées', value: Math.round((1 - result.returnRate / 100) * (parseFloat(monthlyOrders) || 0)).toString(), sub: 'après retours' },
                  { label: 'Chiffre d\'affaires', value: `${Math.round((1 - result.returnRate / 100) * (parseFloat(monthlyOrders) || 0) * result.sellingPrice).toLocaleString('fr-MA')} MAD`, sub: 'CA livré' },
                  { label: 'Profit net', value: `${Math.round(monthlyProfit).toLocaleString('fr-MA')} MAD`, sub: 'après tout déduit' },
                ].map(s => (
                  <div key={s.label} className={cn(
                    'rounded-xl p-3 text-center',
                    s.label === 'Profit net'
                      ? monthlyProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
                      : 'bg-gray-50'
                  )}>
                    <div className={cn(
                      'font-black text-sm',
                      s.label === 'Profit net'
                        ? monthlyProfit >= 0 ? 'text-green-700' : 'text-red-600'
                        : 'text-navy'
                    )}>
                      {s.value}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conseils IA */}
            {result.status !== 'excellent' && (
              <div className="bg-navy rounded-2xl p-4 flex gap-3">
                <span className="text-2xl flex-shrink-0">💡</span>
                <div className="text-white text-sm leading-relaxed">
                  {result.status === 'bad' && (
                    <>
                      <strong>Pour devenir rentable :</strong> augmente le prix de vente de <strong>{Math.ceil((result.supplierCost + result.delivery + result.advertisingCost * 2) / (1 - result.returnRate / 100) - result.sellingPrice + 50)} MAD</strong> ou négocie le fournisseur à la baisse.
                    </>
                  )}
                  {result.status === 'warning' && (
                    <>
                      <strong>Pour améliorer ta marge :</strong> vise un taux de retour sous 25% avec de meilleures photos produit, et réduis la pub à <strong>{Math.round(result.netMarginPerOrder * 0.3)} MAD</strong> max par commande.
                    </>
                  )}
                  {result.status === 'good' && (
                    <>
                      <strong>Pour passer en excellente marge :</strong> crée un bundle (ex: x2 produits) pour augmenter le panier moyen sans coût fixe supplémentaire.
                    </>
                  )}
                </div>
              </div>
            )}

            {/* CTA Assistant */}
            <Link
              href={`/assistant?task=${encodeURIComponent(`Mon produit à ${result.sellingPrice} MAD, fournisseur ${result.supplierCost} MAD, marge nette ${result.netMarginPerOrder.toFixed(0)} MAD. Comment optimiser ?`)}`}
              className="bg-accent-gradient rounded-2xl p-4 flex items-center gap-3 block"
            >
              <span className="text-2xl">🤖</span>
              <div className="flex-1">
                <div className="text-white font-bold text-sm">Demander à ShopAI</div>
                <div className="text-white/80 text-xs mt-0.5">Comment optimiser cette marge ?</div>
              </div>
              <span className="text-white/80">›</span>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
