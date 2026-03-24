import type { Metadata } from 'next'
import { SEO } from '@/lib/seo'

export const metadata: Metadata = SEO.produits

export default function ProduitsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
