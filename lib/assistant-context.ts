/**
 * Helpers pour construire le contexte utilisateur injecté dans le prompt Claude.
 * En production, ces données viennent de Supabase.
 */

import { createClient } from '@/lib/supabase/server'

export interface UserContext {
  userName?: string
  niche?: string
  model?: string
  platform?: string
  progress?: number
  currentWeek?: number
  shopUrl?: string
}

/**
 * Récupère le contexte utilisateur depuis Supabase.
 * À appeler côté serveur.
 */
export async function getUserContext(): Promise<UserContext> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return {}

    // Récupérer le profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Récupérer la boutique active
    const { data: shop } = await supabase
      .from('shops')
      .select('niche, model, platform, url')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Récupérer le plan actif
    const { data: plan } = await supabase
      .from('plans')
      .select('progress_pct, current_week')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return {
      userName: profile?.full_name?.split(' ')[0],
      niche: shop?.niche,
      model: shop?.model,
      platform: shop?.platform,
      shopUrl: shop?.url,
      progress: plan?.progress_pct,
      currentWeek: plan?.current_week,
    }
  } catch {
    return {}
  }
}
