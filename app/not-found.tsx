import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-2xl font-black text-navy mb-2">Page introuvable</h1>
      <p className="text-gray-400 text-sm mb-6 max-w-xs leading-relaxed">
        Cette page n&apos;existe pas ou a été déplacée. Pas de panique !
      </p>
      <Link href="/dashboard" className="btn-primary inline-block max-w-xs">
        ← Retour au tableau de bord
      </Link>
    </div>
  )
}
