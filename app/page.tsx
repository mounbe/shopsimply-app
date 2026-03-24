import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Zap, ShoppingCart, Map, Users, TrendingUp, Star } from 'lucide-react'
import { SEO } from '@/lib/seo'

export const metadata: Metadata = SEO.home

const FEATURES = [
  {
    icon: '🧠',
    title: 'Assistant IA en Darija + Français',
    desc: "Rédige tes fiches produit, optimise tes prix, répond à tes questions 24h/24.",
  },
  {
    icon: '🛒',
    title: 'Youcan ou Shopify, guidé',
    desc: "On choisit la bonne plateforme pour toi. Setup complet sans compétence technique.",
  },
  {
    icon: '📦',
    title: 'Plan 30 jours personnalisé',
    desc: "Tâche par tâche, semaine par semaine. Du zéro à la première commande.",
  },
  {
    icon: '📊',
    title: 'Dashboard & Analytics',
    desc: "Suis tes ventes, tes visiteurs et tes performances en temps réel.",
  },
  {
    icon: '💬',
    title: 'CRM Clients intégré',
    desc: "Gère tes clients, tes commandes et tes relances depuis une seule interface.",
  },
  {
    icon: '👥',
    title: 'Communauté e-com Maroc',
    desc: "Rejoins des centaines de marchands marocains. Partage, apprends, progresse.",
  },
]

const PLANS = [
  {
    id: 'starter',
    name: 'STARTER',
    price: 149,
    features: ['1 boutique', 'IA 50 req/mois', 'Youcan', 'Plan 30 jours', 'Support email'],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'PRO',
    price: 349,
    badge: '⭐ Le + choisi',
    features: ['2 boutiques', 'IA illimité', 'Youcan + Shopify', 'CRM clients', 'Analytics avancé', 'Support prioritaire'],
    highlighted: true,
  },
  {
    id: 'scale',
    name: 'SCALE',
    price: 649,
    features: ['5 boutiques', 'IA illimité', 'Multi-marchés', 'Analytics Pro', 'Accès API', 'Support dédié'],
    highlighted: false,
  },
]

const STATS = [
  { value: '4.2M$', label: 'Marché e-com Maroc' },
  { value: '48h', label: 'Boutique active' },
  { value: '68%', label: 'Paient en COD' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xl font-black text-navy">
            Shop<span className="text-accent">Simply</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-navy transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-navy transition-colors">Tarifs</a>
            <Link href="/login" className="hover:text-navy transition-colors">Connexion</Link>
          </div>
          <Link
            href="/diagnostic"
            className="bg-accent text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
          >
            Commencer gratuitement →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-hero-gradient pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-72 h-72 rounded-full bg-accent/10 -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-teal-brand text-xs font-bold uppercase tracking-widest mb-6">
            🇲🇦 Made for Morocco
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            Lance ton e-com au Maroc{' '}
            <span className="text-accent">en 48h</span>
          </h1>
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            L&apos;IA qui configure ta boutique, choisit tes produits<br />
            et t&apos;accompagne jusqu&apos;à la 1ère vente.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {['✓ Youcan', '✓ Shopify', '✓ COD natif', '✓ CMI / PayDunya'].map(b => (
              <span key={b} className="bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                {b}
              </span>
            ))}
          </div>
          <Link
            href="/diagnostic"
            className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-2xl text-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-accent/30"
          >
            🚀 Diagnostic Gratuit <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-blue-200 text-sm mt-3">
            Sans CB · 7 jours offerts · Annulation en 1 clic
          </p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-gray-50 border-b border-gray-100 py-6">
        <div className="max-w-2xl mx-auto px-4 grid grid-cols-3 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black text-navy">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-accent uppercase tracking-widest mb-2">Pourquoi ShopSimply ?</div>
          <h2 className="text-3xl font-black text-navy">Tout ce dont tu as besoin</h2>
          <p className="text-gray-500 mt-2">Conçu spécialement pour le marché marocain</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="card hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-2xl mb-3">
                {f.icon}
              </div>
              <h3 className="font-bold text-navy text-sm mb-1">{f.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-xs font-bold text-accent uppercase tracking-widest mb-2">Comment ça marche ?</div>
            <h2 className="text-3xl font-black text-navy">3 étapes, c&apos;est tout</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: '🎯', title: 'Diagnostic IA', desc: '10 questions. L\'IA analyse ton profil, ton budget et tes envies.' },
              { step: '02', icon: '📋', title: 'Plan personnalisé', desc: 'Tu reçois les 3 meilleures niches et un plan 30 jours sur mesure.' },
              { step: '03', icon: '🚀', title: 'Tu lances', desc: 'Tâche par tâche, avec l\'IA à tes côtés. Première vente en 2-4 semaines.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                  {s.icon}
                </div>
                <div className="text-xs font-black text-accent mb-1">ÉTAPE {s.step}</div>
                <h3 className="font-bold text-navy mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="text-xs font-bold text-accent uppercase tracking-widest mb-2">Tarifs</div>
          <h2 className="text-3xl font-black text-navy">Clairs, sans surprise</h2>
          <p className="text-gray-500 mt-2">Commence gratuitement · Upgrade quand tu veux</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 border-2 transition-all ${
                plan.highlighted
                  ? 'border-accent bg-orange-50 shadow-lg shadow-accent/10 scale-[1.02]'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              {plan.badge && (
                <div className="text-xs font-bold text-accent mb-3">{plan.badge}</div>
              )}
              <div className="font-black text-navy text-sm mb-1">{plan.name}</div>
              <div className="text-3xl font-black text-accent mb-1">
                {plan.price} <span className="text-sm font-normal text-gray-400">MAD/mois</span>
              </div>
              <div className="h-px bg-gray-100 my-4" />
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/diagnostic"
                className={`block text-center font-bold py-3 rounded-xl text-sm transition-all ${
                  plan.highlighted
                    ? 'bg-accent text-white hover:opacity-90'
                    : 'bg-navy text-white hover:opacity-90'
                }`}
              >
                Commencer →
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-400 text-xs mt-6">
          7 jours d&apos;essai gratuit sur tous les plans · Sans carte bancaire
        </p>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-hero-gradient py-16 px-4 text-center">
        <h2 className="text-3xl font-black text-white mb-4">
          Prêt à lancer ton boutique ?
        </h2>
        <p className="text-blue-100 mb-8">Rejoins les marchands qui réussissent avec ShopSimply</p>
        <Link
          href="/diagnostic"
          className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-2xl text-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg"
        >
          🚀 Diagnostic Gratuit <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-blue-200 text-sm mt-3">Sans CB · 7 jours offerts</p>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-navy-dark py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xl font-black text-white">
            Shop<span className="text-accent">Simply</span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 ShopSimply · Simplify Group · Maroc</p>
          <div className="flex gap-4 text-gray-400 text-xs">
            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-white transition-colors">CGU</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
