import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Types ─────────────────────────────────────────────────────
interface VisualRequest {
  productName: string
  category?: string
  visualType: 'product_photo' | 'lifestyle' | 'facebook_ad' | 'instagram_post' | 'white_background' | 'unboxing'
  tone?: 'luxe' | 'moderne' | 'naturel' | 'coloré' | 'minimaliste'
  targetAudience?: string
  platform?: 'facebook' | 'instagram' | 'tiktok' | 'website'
  extraDetails?: string
}

// ── Labels ────────────────────────────────────────────────────
const VISUAL_TYPE_LABELS: Record<string, string> = {
  product_photo:    'Photo produit seul',
  lifestyle:        'Lifestyle / Mise en scène',
  facebook_ad:      'Pub Facebook optimisée',
  instagram_post:   'Post Instagram esthétique',
  white_background: 'Fond blanc e-commerce',
  unboxing:         'Unboxing / Déballage',
}

const PLATFORM_RATIOS: Record<string, string> = {
  facebook:  '1200x628px (16:9) ou 1080x1080px (carré)',
  instagram: '1080x1080px (carré) ou 1080x1350px (portrait)',
  tiktok:    '1080x1920px (9:16 vertical)',
  website:   '1200x800px (paysage) ou 800x800px (carré)',
}

export async function POST(request: NextRequest) {
  try {
    const body: VisualRequest = await request.json()
    const { productName, category, visualType, tone, targetAudience, platform, extraDetails } = body

    if (!productName || !visualType) {
      return NextResponse.json({ error: 'productName et visualType requis' }, { status: 400 })
    }

    const ratio = platform ? PLATFORM_RATIOS[platform] : '1080x1080px'

    const prompt = `Tu es un expert en création visuelle pour l'e-commerce marocain et en prompt engineering pour outils IA (Midjourney, DALL-E 3, Stable Diffusion, Adobe Firefly).

PRODUIT : "${productName}"
${category ? `Catégorie : ${category}` : ''}
Type de visuel souhaité : ${VISUAL_TYPE_LABELS[visualType]}
${tone ? `Ambiance : ${tone}` : ''}
${targetAudience ? `Cible : ${targetAudience}` : ''}
${platform ? `Plateforme : ${platform} (format : ${ratio})` : ''}
${extraDetails ? `Détails supplémentaires : ${extraDetails}` : ''}

CONTEXTE MARCHÉ MAROCAIN :
- Le client marocain valorise l'authenticité et la qualité visible
- Les teintes chaudes (terracotta, blanc, or) fonctionnent bien
- Éviter les fonds trop sombres pour le COD (doute sur la qualité)
- Les visuels "lifestyle" avec des modèles marocains convertissent mieux

Génère 3 prompts optimisés pour créer ce visuel avec des outils IA.

RÉPONDS UNIQUEMENT en JSON valide avec cette structure :
{
  "prompts": [
    {
      "tool": "Midjourney",
      "prompt": "<prompt en anglais optimisé pour Midjourney, très détaillé>",
      "parameters": "--ar 1:1 --v 6 --style raw",
      "note": "<conseil d'utilisation court>"
    },
    {
      "tool": "DALL-E 3",
      "prompt": "<prompt en français ou anglais pour DALL-E 3, descriptif et précis>",
      "parameters": null,
      "note": "<conseil d'utilisation court>"
    },
    {
      "tool": "Stable Diffusion",
      "prompt": "<prompt en anglais pour Stable Diffusion avec mots-clés techniques>",
      "parameters": "Steps: 30, CFG: 7, Sampler: DPM++ 2M",
      "note": "<conseil d'utilisation court>"
    }
  ],
  "free_tools": [
    {
      "name": "<outil gratuit>",
      "url": "<URL>",
      "tip": "<comment l'utiliser pour ce visuel>"
    }
  ],
  "design_tips": [
    "<conseil design spécifique pour ce type de visuel au Maroc>",
    "<conseil 2>",
    "<conseil 3>"
  ],
  "canva_template_suggestion": "<description d'un template Canva à utiliser>",
  "colors": {
    "primary": "<couleur hex recommandée>",
    "secondary": "<couleur hex>",
    "accent": "<couleur hex>",
    "rationale": "<pourquoi ces couleurs pour ce produit>"
  }
}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid JSON response')

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({ ...result, product: productName, visualType, platform })
  } catch (error) {
    console.error('Generate visual prompt error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 })
  }
}
