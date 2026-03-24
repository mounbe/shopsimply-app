import type { Metadata } from 'next'
import { SEO } from '@/lib/seo'

export const metadata: Metadata = SEO.analytics

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
