import type { Metadata } from 'next'
import { SEO } from '@/lib/seo'

export const metadata: Metadata = SEO.assistant

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
