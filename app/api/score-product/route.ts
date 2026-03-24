import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Calendrier saisonnalité Maroc ─────────────────────────────
const MOROCCO_SEASONS = `
CALENDRIER SAISONNALITÉ E-COMMERCE MAROC :
- Ramadan (fév-mars 2026) : +200% mode abaya/djellaba, +150% décoration, +80% électro cuisine
- Aïd al-Fitr (mars 2026) : +300% vêtements enfants, +250% chaussures, +180% parfums/cosmétiques
- Aïd al-Adha (mai-juin 2026) : +200% couteaux/ustensiles, +150% tenues traditionnelles
- Rentrée scolaire (sept) : +400% fournitures, +200% cartables/sacs, +180% vêtements enfants
- Fête du Trône (30 juil) : achat nationaliste, +100% articles marocains/artisanat
- Soldes d'été (juil-août) : -30% prix, +150% volumétrie mode/électro
- Black Friday Maroc (nov) : +180% électronique, +150% mode, +120% beauté
- Rentrée hiver (oct-nov) : +150% chauffage, +200% vêtements chaud, +100% couvertures
- Nouvel an (déc-jan) : en croissance (+70% cadeaux, +80% décoration maison)
`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productName,
      buyingPrice,
      sellingPrice,
      category,
      description,
      targetAudience,
    } = body as {
      productName: string
      buyingPrice?: number
      sellingPrice?: number
      category?: string
      description?: string
      targetAudience?: string
    }

    if (!productName) {
      return NextResponse.json({ error: 'Nom du produit requis' }, { status: 400 })
    }

    // Rate limiting
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

    if (user) {
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
      const LIMITS: Record<string, number> = { trial: 5, starter: 20, pro: 100, scale: Infinity }
      const limit = LIMITS[profile?.plan || 'trial']

      if (limit !== Infinity) {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { count } = await supabase
          .from('ai_usage').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('feature', 'scoring').gte('created_at', since)

        if ((count ?? 0) >= limit) {
          return NextResponse.json({
            error: 'rate_limit',
            message: `Limite de scoring atteinte (${limit}/jour sur plan ${profile?.plan}).`
          }, { status: 429 })
        }
        supabase.from('ai_usage').insert({ user_id: user.id, feature: 'scoring', tokens_used: 0 }).then(() => {})
      }
    }

    const margin = buyingPrice && sellingPrice
      ? Math.round(((sellingPrice - buyingPrice) / sellingPrice) * 100)
      : null

    const prompt = `Tu es un expert e-commerce marocain spécialisé dans le dropshipping COD.
Analyse ce produit pour le marché marocain et donne-lui un score global /10.

PRODUIT : "${productName}"
${category ? `Catégorie : ${category}` : ''}
${sellingPrice ? `Prix de vente : ${sellingPrice} MAD` : ''}
${buyingPrice ? `Prix d'achat : ${buyingPrice} MAD` : ''}
${margin !== null ? `Marge brute : ${margin}%` : ''}
${description ? `Description : ${description}` : ''}
${targetAudience ? `Cible : ${targetAudience}` : ''}

${MOROCCO_SEASONS}

CRITÈRES D'ÉVALUATION (total = 10 points) :

1. MARGE & PRIX (0-2 pts)
   - Marge brute ≥40% = 2pts | 25-39% = 1.5pts | 15-24% = 1pt | <15% = 0.5pt
   - Prix de vente idéal COD Maroc : 80-350 MAD

2. DEMANDE MAROC (0-2 pts)
   - Popularité sur Facebook Maroc, tendances actuelles
   - Problème concret résolu pour le consommateur marocain

3. CONCURRENCE (0-1.5 pts)
   - Saturation sur les pages Facebook maroc, Youcan, Instagram
   - Différenciation possible

4. LOGISTIQUE COD (0-1.5 pts)
   - Poids et fragilité (idéal : <1kg, solide)
   - Taux de retour estimé COD (objectif <30%)
   - Facilité d'emballage

5. VIRALITÉ (0-1 pt)
   - Potentiel de partage sur Facebook/TikTok Maroc
   - Wow factor, effet "je veux ça"

6. SAISONNALITÉ (0-1 pt)
   - Timing actuel favorable ?
   - Produit evergreen ou saisonnier ?

7. SCALABILITÉ (0-1 pt)
   - Potentiel de montée en charge
   - Fournisseurs disponibles, stock facile

RÉPONDS OBLIGATOIREMENT en JSON valide avec cette structure exacte :
{
  "score": <nombre décimal ex: 7.5>,
  "verdict": "<excellent|bon|moyen|risqué>",
  "label": "<titre court du verdict 3-5 mots>",
  "summary": "<1 phrase de synthèse percutante>",
  "criteria": [
    {"name": "Marge & Prix", "score": <0-2>, "max": 2, "comment": "<raison courte>"},
    {"name": "Demande Maroc", "score": <0-2>, "max": 2, "comment": "<raison courte>"},
    {"name": "Concurrence", "score": <0-1.5>, "max": 1.5, "comment": "<raison courte>"},
    {"name": "Logistique COD", "score": <0-1.5>, "max": 1.5, "comment": "<raison courte>"},
    {"name": "Viralité", "score": <0-1>, "max": 1, "comment": "<raison courte>"},
    {"name": "Saisonnalité", "score": <0-1>, "max": 1, "comment": "<raison courte>"},
    {"name": "Scalabilité", "score": <0-1>, "max": 1, "comment": "<raison courte>"}
  ],
  "strengths": ["<point fort 1>", "<point fort 2>"],
  "risks": ["<risque 1>", "<risque 2>"],
  "tips": ["<conseil actionnable 1>", "<conseil actionnable 2>", "<conseil actionnable 3>"],
  "best_season": "<meilleure période pour ce produit au Maroc>",
  "estimated_confirmation_rate": <pourcentage ex: 65>
}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI')
    }

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (error) {
    console.error('Score API error:', error)
    return NextResponse.json({ error: 'Erreur lors du scoring' }, { status: 500 })
  }
}
