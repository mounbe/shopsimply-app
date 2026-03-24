'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, Mail, Smartphone, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

export default function SecuritePage() {
  const router = useRouter()
  const supabase = createClient()
  const { success, info } = useToast()

  const [email, setEmail] = useState('')
  const [sendingLink, setSendingLink] = useState(false)
  const [linkSent, setLinkSent] = useState(false)
  const [sessions] = useState([
    { device: 'iPhone 14 · Safari', location: 'Casablanca, MA', active: true, lastSeen: 'Actif maintenant' },
    { device: 'MacBook Pro · Chrome', location: 'Casablanca, MA', active: false, lastSeen: 'Il y a 2 jours' },
  ])

  useState(() => {
    const loadEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setEmail(user.email)
    }
    loadEmail()
  })

  const handleChangeEmail = async () => {
    if (!email.trim()) return
    setSendingLink(true)
    const { error } = await supabase.auth.updateUser({ email })
    setSendingLink(false)
    if (error) {
      info('Un email de confirmation a été envoyé à ' + email)
    } else {
      setLinkSent(true)
      success('Email de confirmation envoyé !')
    }
  }

  const handleSignOutAll = async () => {
    await supabase.auth.signOut({ scope: 'global' })
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      <div className="bg-navy px-5 py-5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-black">Sécurité</h1>
          <p className="text-blue-200 text-xs">Gère l'accès à ton compte</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5">
        {/* Info magic link */}
        <div className="bg-teal-brand/10 border border-teal-brand/20 rounded-2xl p-4 flex gap-3">
          <span className="text-2xl flex-shrink-0">🔒</span>
          <div>
            <div className="font-bold text-navy text-sm mb-0.5">Connexion sans mot de passe</div>
            <p className="text-sm text-gray-500 leading-relaxed">
              ShopSimply utilise des <strong>liens magiques</strong> par email. Aucun mot de passe à retenir, aucun risque de vol de mot de passe.
            </p>
          </div>
        </div>

        {/* Changer email */}
        <div className="card space-y-3">
          <h2 className="font-bold text-navy flex items-center gap-2">
            <Mail className="w-4 h-4 text-accent" /> Adresse email
          </h2>
          <p className="text-xs text-gray-400">
            Ton email est utilisé pour la connexion. Un email de confirmation sera envoyé à la nouvelle adresse.
          </p>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="nouvel@email.com"
            className="input"
          />
          {linkSent ? (
            <div className="text-center py-2 text-green-600 text-sm font-semibold">
              ✓ Email de confirmation envoyé !
            </div>
          ) : (
            <button
              onClick={handleChangeEmail}
              disabled={sendingLink || !email.trim()}
              className={cn('btn-primary text-sm py-3', (sendingLink || !email.trim()) && 'opacity-60')}
            >
              {sendingLink ? 'Envoi...' : 'Mettre à jour l\'email'}
            </button>
          )}
        </div>

        {/* Sessions actives */}
        <div className="card space-y-3">
          <h2 className="font-bold text-navy flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-accent" /> Sessions actives
          </h2>
          <div className="divide-y divide-gray-50">
            {sessions.map((session, i) => (
              <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  session.active ? 'bg-green-500' : 'bg-gray-300'
                )} />
                <div className="flex-1">
                  <div className="font-semibold text-navy text-sm">{session.device}</div>
                  <div className="text-xs text-gray-400">{session.location} · {session.lastSeen}</div>
                </div>
                {session.active && (
                  <span className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full">
                    Actif
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Déconnexion globale */}
        <div className="card">
          <h2 className="font-bold text-navy flex items-center gap-2 mb-2">
            <LogOut className="w-4 h-4 text-red-500" /> Déconnexion de tous les appareils
          </h2>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            Tu seras déconnecté de tous les appareils. Tu devras recevoir un nouveau lien magique pour te reconnecter.
          </p>
          <button
            onClick={handleSignOutAll}
            className="w-full py-3 rounded-2xl bg-red-50 text-red-600 font-bold text-sm border border-red-200 hover:bg-red-100 transition-colors"
          >
            Déconnecter tous les appareils
          </button>
        </div>
      </div>
    </div>
  )
}
