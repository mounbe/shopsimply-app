import type { Metadata } from 'next'
import { SEO } from '@/lib/seo'

export const metadata: Metadata = SEO.calculateur

export default function CalculateurLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
