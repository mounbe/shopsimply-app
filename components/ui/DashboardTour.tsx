'use client'

import { OnboardingTooltip, DASHBOARD_TOUR } from './OnboardingTooltip'

export function DashboardTour() {
  return (
    <OnboardingTooltip
      steps={DASHBOARD_TOUR}
      storageKey="shopsimply_dashboard_tour_v1"
      delay={1200}
    />
  )
}
