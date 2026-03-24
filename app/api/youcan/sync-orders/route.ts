import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { YoucanClient, mapYoucanOrder, mapYoucanClientFromOrder } from '@/lib/youcan'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json().catch(() => ({}))
    const { since } = body as { since?: string }   // ISO date — sync incrémentale

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

    if (intError || !integration?.api_key || !integration?.store_slug) {
      return NextResponse.json({ error: 'Intégration Youcan non configurée' }, { status: 404 })
    }

    // Statut syncing
    await supabase
      .from('integrations')
      .update({ status: 'syncing', updated_at: new Date().toISOString() })
      .eq('id', integration.id)

    // Utiliser last_sync_at comme point de départ si non fourni
    const syncSince = since || integration.last_sync_at || undefined

    const youcan = new YoucanClient(integration.api_key, integration.store_slug)
    const youcanOrders = await youcan.getRecentOrders(syncSince)

    let ordersSynced = 0
    let ordersFailed = 0
    let clientsCreated = 0
    const errors: string[] = []

    for (const yo of youcanOrders) {
      try {
        // ── 1. Upsert client ──────────────────────────────────
        let clientId: string | null = null

        if (yo.customer?.name) {
          const clientData = mapYoucanClientFromOrder(yo, user.id, integration.shop_id)

          // Cherche par phone ou email d'abord
          const { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .eq('user_id', user.id)
            .eq('phone', clientData.phone || '')
            .maybeSingle()

          if (existingClient) {
            clientId = existingClient.id
          } else {
            const { data: newClient, error: clientErr } = await supabase
              .from('clients')
              .insert(clientData)
              .select('id')
              .single()

            if (!clientErr && newClient) {
              clientId = newClient.id
              clientsCreated++
            }
          }
        }

        // ── 2. Upsert commande ────────────────────────────────
        const orderData = mapYoucanOrder(yo, user.id, integration.shop_id, clientId || undefined)

        const { error: orderErr } = await supabase
          .from('orders')
          .upsert(orderData, {
            onConflict: 'user_id,external_platform,external_id',
            ignoreDuplicates: false,
          })

        if (orderErr) {
          ordersFailed++
          errors.push(`Commande ${yo.reference}: ${orderErr.message}`)
        } else {
          ordersSynced++

          // Mettre à jour les totaux client si livré
          if (clientId && yo.status === 'delivered') {
            await supabase.rpc('increment_client_orders', {
              p_client_id: clientId,
              p_amount: yo.total,
            })
          }
        }
      } catch (err) {
        ordersFailed++
        errors.push(`Commande ${yo.reference}: ${err instanceof Error ? err.message : 'Erreur'}`)
      }
    }

    const duration = Date.now() - startTime
    const status = ordersFailed === 0 ? 'success' : ordersSynced > 0 ? 'partial' : 'error'

    // Log sync
    await supabase.rpc('log_sync_result', {
      p_user_id:        user.id,
      p_integration_id: integration.id,
      p_type:           'orders',
      p_status:         status,
      p_items_synced:   ordersSynced,
      p_items_failed:   ordersFailed,
      p_error_message:  errors.length > 0 ? errors.slice(0, 3).join(' | ') : null,
      p_duration_ms:    duration,
    })

    return NextResponse.json({
      success: status !== 'error',
      orders_synced:  ordersSynced,
      orders_failed:  ordersFailed,
      clients_created: clientsCreated,
      total:          youcanOrders.length,
      duration_ms:    duration,
      errors:         errors.slice(0, 5),
    })
  } catch (err) {
    console.error('Sync orders error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Erreur lors de la synchronisation',
    }, { status: 500 })
  }
}
