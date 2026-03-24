'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginForm() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'form' | 'sent' | 'error'>('form')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || loading) return

    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    setLoading(false)

    if (error) {
      setErrorMsg(
        error.message === 'Email rate limit exceeded'
          ? 'Trop de tentatives. Attends quelques minutes.'
          : 'Une erreur est survenue. Vérifie ton email et réessaie.'
      )
      setStep('error')
    } else {
      setStep('sent')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-navy/20">
          <span className="text-3xl">🛒</span>
        </div>
        <h1 className="text-2xl font-black text-navy">ShopSimply</h1>
        <p className="text-gray-400 text-sm mt-1">E-commerce simplifié pour le Maroc</p>
      </div>

      <div className="w-full max-w-sm">
        {step === 'form' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-black text-navy mb-1">Connexion</h2>
            <p className="text-gray-400 text-sm mb-5">
              Saisis ton email — on t&apos;envoie un lien magique, sans mot de passe.
            </p>

            <form onSubmit={sendMagicLink} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="toi@exemple.com"
                  required
                  autoFocus
                  className="input w-full"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className={cn(
                  'btn-primary flex items-center justify-center gap-2',
                  (loading || !email.trim()) && 'opacity-60 cursor-not-allowed'
                )}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  '✉️ Envoyer le lien magique'
                )}
              </button>
            </form>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">ou</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <p className="text-center text-sm text-gray-400 mt-4">
              Pas encore de compte ?{' '}
              <Link href="/diagnostic" className="text-accent font-bold hover:underline">
                Démarre le diagnostic gratuit
              </Link>
            </p>
          </div>
        )}

        {step === 'sent' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📬</span>
            </div>
            <h2 className="text-lg font-black text-navy mb-2">Vérifie ton email !</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-1">
              Un lien de connexion a été envoyé à
            </p>
            <p className="text-navy font-bold text-sm mb-4">{email}</p>
            <p className="text-gray-400 text-xs leading-relaxed mb-5">
              Clique sur le lien dans l&apos;email pour te connecter. Il expire dans 10 minutes.
              Pense à vérifier tes spams.
            </p>
            <button
              onClick={() => { setStep('form'); setEmail('') }}
              className="btn-secondary text-sm py-2.5"
            >
              ← Changer d&apos;email
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="bg-white rounded-3xl shadow-sm border border-red-100 p-6 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-lg font-black text-navy mb-2">Oups !</h2>
            <p className="text-red-500 text-sm mb-5">{errorMsg}</p>
            <button
              onClick={() => { setStep('form'); setErrorMsg('') }}
              className="btn-primary"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-400">
          <span>🔒 Sécurisé</span>
          <span>🚫 Sans spam</span>
          <span>🇲🇦 Made in Morocco</span>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
