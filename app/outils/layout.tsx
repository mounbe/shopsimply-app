import type { Metadata } from 'next'
import { SEO } from '@/lib/seo'

export const metadata: Metadata = SEO.outils

export default function OutilsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
