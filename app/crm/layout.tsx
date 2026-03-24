import type { Metadata } from 'next'
import { SEO } from '@/lib/seo'

export const metadata: Metadata = SEO.crm

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
