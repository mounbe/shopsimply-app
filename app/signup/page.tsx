'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="card w-full max-w-sm text-center py-8">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="font-bold text-navy text-lg mb-2">Vérifie ta boîte mail !</h2>
          <p className="text-gray-500 text-sm">
            Lien envoyé à <strong>{email}</strong>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <Link href="/" className="text-2xl font-black text-navy mb-8">
        Shop<span className="text-accent">Simply</span>
      </Link>

      <div className="card w-full max-w-sm">
        <h2 className="font-bold text-navy text-xl mb-1">Créer mon compte</h2>
        <p className="text-gray-500 text-sm mb-6">7 jours gratuits · Sans CB</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Prénom & Nom</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Mounir Ben..."
              required
              className="input"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ton@email.com"
              required
              className="input"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Créer mon compte gratuit →'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          En créant un compte, tu acceptes nos{' '}
          <a href="#" className="underline">CGU</a> et{' '}
          <a href="#" className="underline">Politique de confidentialité</a>
        </p>

        <div className="text-center mt-4 text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-accent font-semibold">Se connecter</Link>
        </div>
      </div>
    </div>
  )
}
