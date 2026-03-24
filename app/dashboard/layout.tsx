import type { Metadata } from 'next'
import { SEO } from '@/lib/seo'
import { DashboardTour } from '@/components/ui/DashboardTour'

export const metadata: Metadata = SEO.dashboard

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DashboardTour />
    </>
  )
}
