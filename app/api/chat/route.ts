import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Limites journalières par plan
const RATE_LIMITS: Record<string, number> = {
  trial:    20,
  starter: 60,
  pro:     200,
  scale:   Infinity,
}

interface UserContext {
  userName?: string
  niche?: string
  model?: string
  platform?: string
  progress?: number
  currentWeek?: number
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// System prompt adaptatif au contexte utilisateur
function buildSystemPrompt(context: UserContext): string {
  return `Tu es ShopAI, l'assistant IA personnel de ${context.userName || 'cet entrepreneur'} sur ShopSimply.
Tu aides les entrepreneurs marocains à lancer et développer leur boutique e-commerce.

CONTEXTE UTILISATEUR :
- Prénom : ${context.userName || 'non renseigné'}
- Niche : ${context.niche || 'en cours de définition'}
- Modèle : ${context.model || 'non défini'}
- Plateforme : ${context.platform || 'non choisie'}
- Avancement plan 30j : ${context.progress || 0}%
- Semaine actuelle : ${context.currentWeek || 1}

TON RÔLE :
- Répondre en français (ou en darija si l'utilisateur écrit en darija)
- Être concret, actionnable, adapté au marché marocain
- Connaître les spécificités du Maroc : COD dominant (68%), Youcan, Amana, CMI, Facebook Ads
- Générer des contenus prêts à l'emploi quand demandé (fiches produit, textes pub, emails)
- Motiver et coacher, pas juste informer
- Réponses courtes et directes. Bullet points seulement si nécessaire.

SPÉCIALITÉS :
- Rédaction de fiches produit optimisées (Youcan/Shopify)
- Création de textes pour pubs Facebook adaptés au marché marocain
- Stratégie pricing et marges
- Optimisation COD (taux de confirmation, relances)
- Ciblage Facebook Ads pour le Maroc
- Gestion fournisseurs et dropshipping
- Service client et fidélisation

LIMITES :
- Ne donne pas de garanties de revenus
- Si tu n'es pas sûr, dis-le
- Reste focalisé sur l'e-commerce marocain`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      messages,
      context = {},
      feature = 'chat',
    }: { messages: ChatMessage[]; context: UserContext; feature?: string } = body

    if (!messages || messages.length === 0) {
      return new Response('Messages required', { status: 400 })
    }

    // ── Rate limiting via Supabase ──────────────────────────
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options as any)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Récupérer le plan de l'utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

      const userPlan = profile?.plan || 'trial'
      const dailyLimit = RATE_LIMITS[userPlan] ?? RATE_LIMITS.trial

      if (dailyLimit !== Infinity) {
        // Compter les appels des dernières 24h
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { count } = await supabase
          .from('ai_usage')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('feature', feature)
          .gte('created_at', since)

        const callCount = count ?? 0
        if (callCount >= dailyLimit) {
          return new Response(
            JSON.stringify({
              error: 'rate_limit',
              message: `Limite journalière atteinte (${dailyLimit} appels/${userPlan}). Revenez demain ou passez au plan supérieur.`,
              limit: dailyLimit,
              used: callCount,
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': String(dailyLimit),
                'X-RateLimit-Remaining': '0',
              },
            }
          )
        }
        // Enregistrer l'appel (non-bloquant)
        supabase
          .from('ai_usage')
          .insert({ user_id: user.id, feature, tokens_used: 0 })
          .then(() => {})
      }
    }
    // ────────────────────────────────────────────────────────

    const systemPrompt = buildSystemPrompt(context)

    // Streaming response
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    })

    // Return as SSE stream
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            const data = `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`
            controller.enqueue(encoder.encode(data))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: 'Chat error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
