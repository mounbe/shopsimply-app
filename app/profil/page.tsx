'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, LogOut, ChevronRight, Check, Crown, Zap, Rocket } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 149,
    icon: <Zap className="w-4 h-4" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    features: ['1 boutique', 'IA 50 req/mois', 'Youcan'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 349,
    icon: <Crown className="w-4 h-4" />,
    color: 'text-accent',
    bg: 'bg-orange-50',
    features: ['2 boutiques', 'IA illimité', 'CRM', 'Analytics'],
    recommended: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 649,
    icon: <Rocket className="w-4 h-4" />,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    features: ['5 boutiques', 'Multi-marchés', 'API Access'],
  },
]

interface UserProfile {
  email: string
  full_name: string
  plan: string
  trial_ends_at: string
}

export default function ProfilPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState<'main' | 'plan' | 'boutique'>('main')
  const { success, error: toastError } = useToast()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('profiles')
      .select('email, full_name, plan, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile({ ...data, email: user.email || data.email })
      setFullName(data.full_name || '')
    }
    setLoading(false)
  }

  const handleSaveName = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      toastError('Erreur lors de la sauvegarde. Réessaie.')
    } else {
      success('Nom mis à jour avec succès !')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0

  const isTrialActive = profile?.plan === 'trial' && trialDaysLeft > 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">

      {/* Header */}
      <div className="bg-navy px-5 py-5">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/dashboard" className="text-blue-200 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-white font-black text-xl flex-1">Mon Profil</h1>
        </div>

        {/* Avatar + identity */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-accent/30">
            {fullName ? fullName.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <div className="text-white font-black text-lg leading-tight">{fullName || 'Mon compte'}</div>
            <div className="text-blue-200 text-xs mt-0.5">{profile?.email}</div>
            {/* Plan badge */}
            <div className={cn(
              'inline-flex items-center gap-1 mt-1.5 text-[10px] font-black px-2.5 py-1 rounded-full',
              isTrialActive ? 'bg-amber-400/20 text-amber-300' : 'bg-accent/20 text-accent'
            )}>
              {isTrialActive ? (
                <><Crown className="w-3 h-3" /> Essai · {trialDaysLeft}j restants</>
              ) : (
                <><Crown className="w-3 h-3" /> Plan {profile?.plan?.toUpperCase()}</>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">

        {/* ── INFOS PERSONNELLES ── */}
        <div className="card space-y-4">
          <div className="section-title">Informations personnelles</div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Nom complet</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ton prénom et nom"
                className="input flex-1"
              />
              <button
                onClick={handleSaveName}
                disabled={saving}
                className={cn(
                  'px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-1',
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-accent text-white hover:opacity-90'
                )}
              >
                {saved ? <><Check className="w-3.5 h-3.5" /> OK</> : saving ? '...' : 'Sauver'}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Email</label>
            <div className="input bg-gray-50 text-gray-500 cursor-not-allowed">
              {profile?.email}
            </div>
            <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié.</p>
          </div>
        </div>

        {/* ── PLAN ACTUEL ── */}
        {isTrialActive && (
          <div className="bg-gradient-to-r from-amber-500 to-accent rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-white font-black text-sm mb-0.5">Essai gratuit — {trialDaysLeft} jours restants</div>
                <div className="text-white/80 text-xs">Upgrade pour continuer après l'essai</div>
              </div>
              <button
                onClick={() => setActiveSection('plan')}
                className="bg-white text-accent text-xs font-black px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity flex-shrink-0"
              >
                Upgrade →
              </button>
            </div>
          </div>
        )}

        {/* ── MENU ACTIONS ── */}
        <div className="card divide-y divide-gray-50">
          {[
            {
              icon: '🏪',
              label: 'Ma boutique',
              sub: 'Paramètres, URL, intégrations',
              href: '/profil/boutique',
            },
            {
              icon: '👑',
              label: 'Mon abonnement',
              sub: `Plan ${profile?.plan?.toUpperCase() || 'TRIAL'} · Changer de plan`,
              href: '/profil/plan',
            },
            {
              icon: '🔔',
              label: 'Notifications',
              sub: 'Alertes, emails, WhatsApp',
              href: '/profil/notifications',
            },
            {
              icon: '🔗',
              label: 'Intégrations',
              sub: 'Youcan · Shopify · Sync automatique',
              href: '/profil/integrations',
            },
            {
              icon: '🔒',
              label: 'Sécurité',
              sub: 'Connexions actives, sessions',
              href: '/profil/securite',
            },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 py-3.5 hover:bg-gray-50 transition-colors -mx-4 px-4"
            >
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-navy">{item.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{item.sub}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>
          ))}
        </div>

        {/* ── PLAN UPGRADE ── */}
        <div className="card">
          <div className="section-title mb-3">Plans disponibles</div>
          <div className="space-y-2.5">
            {PLANS.map(plan => {
              const isCurrent = profile?.plan === plan.id || (isTrialActive && plan.id === 'starter')
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'rounded-2xl border-2 p-3.5 transition-all',
                    isCurrent ? 'border-accent bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center', plan.bg, plan.color)}>
                        {plan.icon}
                      </div>
                      <div>
                        <span className="font-black text-navy text-sm">{plan.name}</span>
                        {plan.recommended && (
                          <span className="ml-1.5 text-[10px] font-bold bg-accent text-white px-1.5 py-0.5 rounded-full">
                            Populaire
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-accent text-base">{plan.price}</div>
                      <div className="text-[10px] text-gray-400">MAD/mois</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {plan.features.map(f => (
                      <span key={f} className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {f}
                      </span>
                    ))}
                  </div>
                  {isCurrent ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                      <Check className="w-3.5 h-3.5" /> Plan actuel
                    </div>
                  ) : (
                    <button className="w-full bg-navy text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                      Passer au plan {plan.name} →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── INFOS APP ── */}
        <div className="card">
          <div className="section-title mb-3">À propos</div>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="font-semibold text-navy">1.3.0</span>
            </div>
            <div className="flex justify-between">
              <span>Plateforme</span>
              <span className="font-semibold text-navy">ShopSimply · Simplify Group</span>
            </div>
            <div className="flex justify-between">
              <span>Support</span>
              <a href="mailto:support@shopsimply.ma" className="font-semibold text-accent">
                support@shopsimply.ma
              </a>
            </div>
          </div>
        </div>

        {/* ── DÉCONNEXION ── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition-colors border border-red-100"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>

        <p className="text-center text-xs text-gray-300 pb-2">
          © 2026 ShopSimply · Simplify Group · Maroc
        </p>
      </div>

      {/* Bottom nav */}
      <nav className="flex border-t border-gray-100 bg-white py-2 sticky bottom-0">
        {[
          { href: '/dashboard', icon: '🏠', label: 'Accueil', active: false },
          { href: '/plan', icon: '📋', label: 'Plan', active: false },
          { href: '/assistant', icon: '🤖', label: 'IA', active: false },
          { href: '/crm', icon: '👥', label: 'CRM', active: false },
          { href: '/profil', icon: '⚙️', label: 'Profil', active: true },
        ].map(item => (
          <Link key={item.label} href={item.href} className="flex-1 flex flex-col items-center gap-0.5 py-1">
            <span className="text-xl">{item.icon}</span>
            <span className={cn('text-[10px] font-bold', item.active ? 'text-accent' : 'text-gray-400')}>
              {item.label}
            </span>
            {item.active && <div className="w-1 h-1 rounded-full bg-accent" />}
          </Link>
        ))}
      </nav>
    </div>
  )
}
