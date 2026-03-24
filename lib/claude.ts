import Anthropic from '@anthropic-ai/sdk'
import type { DiagnosticAnswer, AIRecommendation } from '@/types'
import { DIAGNOSTIC_QUESTIONS } from '@/lib/diagnostic-questions'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateNicheRecommendations(
  answers: DiagnosticAnswer[]
): Promise<AIRecommendation> {

  // Build readable summary of answers
  const answerSummary = answers.map(answer => {
    const question = DIAGNOSTIC_QUESTIONS.find(q => q.id === answer.questionId)
    if (!question) return ''
    const selectedLabels = answer.selectedValues.map(val => {
      const opt = question.options.find(o => o.value === val)
      return opt ? opt.label : val
    })
    return `Q${answer.questionId}: ${question.text} → ${selectedLabels.join(', ')}`
  }).join('\n')

  const prompt = `Tu es un expert en e-commerce marocain. Un entrepreneur marocain vient de compléter un diagnostic pour lancer sa boutique en ligne. Voici ses réponses :

${answerSummary}

Analyse ces réponses et génère des recommandations personnalisées en JSON. Tu dois recommander 3 niches adaptées au marché marocain (COD dominant, Youcan/Shopify, budget en MAD).

Réponds UNIQUEMENT avec du JSON valide dans ce format exact :
{
  "profile": "Description courte du profil en 1 ligne (ex: Débutant Beauté · Budget 1500 MAD)",
  "budget": 1500,
  "niches": [
    {
      "rank": 1,
      "name": "Nom de la niche",
      "emoji": "💄",
      "model": "Dropshipping",
      "platform": "Youcan",
      "demand": 85,
      "demandLabel": "Forte",
      "budget_min": 1500,
      "first_sale_weeks": "2-3 sem.",
      "competition": "Faible",
      "why": "Explication courte de pourquoi cette niche est recommandée (2 phrases max)"
    },
    {
      "rank": 2,
      "name": "Nom niche 2",
      "emoji": "🧴",
      "model": "Revendeur grossiste",
      "platform": "Youcan",
      "demand": 68,
      "demandLabel": "Moyenne",
      "budget_min": 2000,
      "first_sale_weeks": "3-4 sem.",
      "competition": "Moyenne",
      "why": "Explication courte"
    },
    {
      "rank": 3,
      "name": "Nom niche 3",
      "emoji": "🏠",
      "model": "Marque propre",
      "platform": "Shopify",
      "demand": 55,
      "demandLabel": "Moyenne",
      "budget_min": 3000,
      "first_sale_weeks": "4-6 sem.",
      "competition": "Forte",
      "why": "Explication courte"
    }
  ],
  "recommended_model": "Dropshipping",
  "model_description": "Explication du modèle recommandé en 2-3 phrases, adapté au contexte marocain",
  "model_pros": ["Avantage 1", "Avantage 2", "Avantage 3"],
  "action_plan_summary": "Résumé du plan d'action en 1 phrase"
}`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in Claude response')
  }

  const recommendation: AIRecommendation = JSON.parse(jsonMatch[0])
  return recommendation
}

export async function generatePlan30Days(
  niche: string,
  model: string,
  platform: string
): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Tu es un coach e-commerce marocain expert. Génère un plan d'action 30 jours pour lancer une boutique en ligne sur ${platform} dans la niche "${niche}" avec le modèle "${model}".

Le plan doit être adapté au marché marocain (COD, WhatsApp, Facebook Ads, livraison Amana/Aramex).

Réponds UNIQUEMENT en JSON :
{
  "weeks": [
    {
      "number": 1,
      "name": "Semaine 1 — Les Bases",
      "objective": "Créer compte, configurer boutique",
      "status": "upcoming",
      "tasks": [
        {
          "id": "w1t1",
          "title": "Créer compte ${platform}",
          "why": "Point de départ obligatoire",
          "duration": "30 min",
          "status": "todo",
          "points": 10,
          "ai_assisted": false
        }
      ]
    }
  ]
}

Génère 4 semaines avec 5-6 tâches chacune. Sois très concret et pratique pour un débutant marocain.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response')
  return content.text
}
