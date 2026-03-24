import type { Metadata } from 'next'
import { SEO } from '@/lib/seo'

export const metadata: Metadata = SEO.diagnostic

export default function DiagnosticLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
