import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { YoucanClient } from '@/lib/youcan'

export async function POST(request: NextRequest) {
  try {
    const { apiKey, storeSlug } = await request.json()

    if (!apiKey || !storeSlug) {
      return NextResponse.json({ error: 'apiKey et storeSlug requis' }, { status: 400 })
    }

    // Auth check
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

    // Test connexion Youcan
    const youcan = new YoucanClient(apiKey, storeSlug)
    const result = await youcan.testConnection()

    if (result.success) {
      // Sauvegarder les credentials dans la DB
      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', user.id)
        .single()

      await supabase
        .from('integrations')
        .upsert({
          user_id:    user.id,
          shop_id:    shop?.id || null,
          platform:   'youcan',
          api_key:    apiKey,   // TODO: chiffrer en production
          store_slug: storeSlug,
          status:     'connected',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,platform' })

      return NextResponse.json({ success: true, storeName: result.storeName })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (err) {
    console.error('Youcan test error:', err)
    return NextResponse.json({ error: 'Erreur lors du test de connexion' }, { status: 500 })
  }
}
