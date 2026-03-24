import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { YoucanClient, mapYoucanProduct } from '@/lib/youcan'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(c) { try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Récupérer l'intégration Youcan
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'youcan')
      .single()

    if (intError || !integration) {
      return NextResponse.json({ error: 'Intégration Youcan non configurée' }, { status: 404 })
    }
    if (!integration.api_key || !integration.store_slug) {
      return NextResponse.json({ error: 'Credentials Youcan manquants' }, { status: 400 })
    }

    // Mettre le statut en "syncing"
    await supabase
      .from('integrations')
      .update({ status: 'syncing', updated_at: new Date().toISOString() })
      .eq('id', integration.id)

    // Récupérer tous les produits depuis Youcan
    const youcan = new YoucanClient(integration.api_key, integration.store_slug)
    const youcanProducts = await youcan.getAllProducts()

    let synced = 0
    let failed = 0
    const errors: string[] = []

    for (const yp of youcanProducts) {
      try {
        const productData = mapYoucanProduct(yp, user.id, integration.shop_id)

        // Upsert : update si external_id existe, sinon insert
        const { error } = await supabase
          .from('products')
          .upsert(productData, {
            onConflict: 'user_id,external_platform,external_id',
            ignoreDuplicates: false,
          })

        if (error) {
          failed++
          errors.push(`Produit ${yp.name}: ${error.message}`)
        } else {
          synced++
        }
      } catch (err) {
        failed++
        errors.push(`Produit ${yp.name}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
      }
    }

    const duration = Date.now() - startTime
    const status = failed === 0 ? 'success' : synced > 0 ? 'partial' : 'error'

    // Logger le résultat
    await supabase.rpc('log_sync_result', {
      p_user_id:        user.id,
      p_integration_id: integration.id,
      p_type:           'products',
      p_status:         status,
      p_items_synced:   synced,
      p_items_failed:   failed,
      p_error_message:  errors.length > 0 ? errors.slice(0, 3).join(' | ') : null,
      p_duration_ms:    duration,
    })

    return NextResponse.json({
      success: status !== 'error',
      synced,
      failed,
      total: youcanProducts.length,
      duration_ms: duration,
      errors: errors.slice(0, 5),
    })
  } catch (err) {
    console.error('Sync products error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Erreur lors de la synchronisation',
    }, { status: 500 })
  }
}
