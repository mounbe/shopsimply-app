'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-black text-navy mb-2">Une erreur est survenue</h1>
      <p className="text-gray-400 text-sm mb-6 max-w-xs leading-relaxed">
        Quelque chose s&apos;est mal passé. Tu peux réessayer ou revenir au tableau de bord.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={reset}
          className="btn-primary"
        >
          🔄 Réessayer
        </button>
        <Link href="/dashboard" className="btn-secondary">
          ← Tableau de bord
        </Link>
      </div>
      {error.digest && (
        <p className="text-[10px] text-gray-300 mt-4">Code: {error.digest}</p>
      )}
    </div>
  )
}
