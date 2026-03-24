// ── User & Auth ──────────────────────────────────────
export interface User {
  id: string
  email: string
  full_name?: string
  created_at: string
}

// ── Diagnostic ───────────────────────────────────────
export interface DiagnosticQuestion {
  id: number
  text: string
  subtext?: string
  type: 'grid' | 'single' | 'scale'
  options: DiagnosticOption[]
}

export interface DiagnosticOption {
  id: string
  emoji: string
  label: string
  sublabel?: string
  value: string
}

export interface DiagnosticAnswer {
  questionId: number
  selectedValues: string[]
}

export interface DiagnosticSession {
  id: string
  user_id?: string
  answers: DiagnosticAnswer[]
  completed: boolean
  created_at: string
}

// ── IA Results ────────────────────────────────────────
export interface NicheRecommendation {
  rank: number
  name: string
  emoji: string
  model: string            // dropshipping / revendeur / marque propre
  platform: string         // Youcan / Shopify
  demand: number           // 0-100
  demandLabel: string      // Forte / Moyenne / Faible
  budget_min: number       // en MAD
  first_sale_weeks: string // "2-3 sem."
  competition: string      // Faible / Moyenne / Forte
  why: string              // explication courte
}

export interface AIRecommendation {
  profile: string
  budget: number
  niches: NicheRecommendation[]
  recommended_model: string
  model_description: string
  model_pros: string[]
  action_plan_summary: string
}

// ── Plan 30 Jours ─────────────────────────────────────
export interface Task {
  id: string
  title: string
  why?: string
  duration?: string
  status: 'done' | 'active' | 'todo'
  points: number
  ai_assisted?: boolean
}

export interface Week {
  number: number
  name: string
  objective: string
  tasks: Task[]
  status: 'done' | 'current' | 'upcoming'
}

export interface Plan30Days {
  id: string
  user_id: string
  niche: string
  model: string
  platform: string
  weeks: Week[]
  progress_pct: number
  created_at: string
}

// ── Dashboard KPIs ────────────────────────────────────
export interface KPI {
  label: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
}

// ── Pricing ───────────────────────────────────────────
export interface PricingPlan {
  id: 'starter' | 'pro' | 'scale'
  name: string
  price: number
  features: string[]
  highlighted?: boolean
  badge?: string
}
