import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePlan30Days } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { shopName, platform, niche, model, city, budget } = body

    // 1. Créer la boutique
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .insert({
        user_id: user.id,
        name: shopName,
        platform,
        niche,
        model,
        status: 'setup',
      })
      .select()
      .single()

    if (shopError) throw shopError

    // 2. Générer le plan 30j via Claude
    let weeksData = []
    try {
      const planText = await generatePlan30Days(niche, model, platform)
      const jsonMatch = planText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        weeksData = parsed.weeks || []
      }
    } catch (e) {
      console.error('Plan generation failed, using default:', e)
      // Fallback plan si Claude échoue
      weeksData = getDefaultPlan(platform, niche)
    }

    // 3. Sauvegarder le plan
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .insert({
        user_id: user.id,
        shop_id: shop.id,
        niche,
        model,
        platform,
        weeks: weeksData,
        progress_pct: 0,
        current_week: 1,
      })
      .select()
      .single()

    if (planError) throw planError

    // 4. Créer les tâches en base
    const allTasks = weeksData.flatMap((week: any) =>
      (week.tasks || []).map((task: any) => ({
        plan_id: plan.id,
        user_id: user.id,
        week_number: week.number,
        title: task.title,
        why: task.why || null,
        duration: task.duration || null,
        status: 'todo',
        points: task.points || 10,
        ai_assisted: task.ai_assisted || false,
      }))
    )

    if (allTasks.length > 0) {
      await supabase.from('tasks').insert(allTasks)
    }

    // 5. Marquer l'onboarding comme complété dans le profil
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      shopId: shop.id,
      planId: plan.id,
      tasksCount: allTasks.length,
    })
  } catch (error) {
    console.error('Onboarding API error:', error)
    return NextResponse.json({ error: 'Onboarding failed' }, { status: 500 })
  }
}

function getDefaultPlan(platform: string, niche: string) {
  return [
    {
      number: 1,
      name: 'Semaine 1 — Les Bases',
      objective: 'Créer compte, configurer boutique',
      status: 'upcoming',
      tasks: [
        { id: 'w1t1', title: `Créer compte ${platform} + choisir domaine .ma`, duration: '30 min', status: 'todo', points: 10, ai_assisted: false },
        { id: 'w1t2', title: 'Configurer paiement COD + CMI', duration: '45 min', status: 'todo', points: 10, ai_assisted: false },
        { id: 'w1t3', title: 'Importer 5 produits avec fiches IA', duration: '1h30', status: 'todo', points: 20, ai_assisted: true },
        { id: 'w1t4', title: 'Configurer livraison Amana + tarifs', duration: '30 min', status: 'todo', points: 10, ai_assisted: false },
        { id: 'w1t5', title: 'Choisir thème boutique + couleurs', duration: '1h', status: 'todo', points: 10, ai_assisted: false },
        { id: 'w1t6', title: 'Tester commande test (vrai COD)', duration: '20 min', status: 'todo', points: 15, ai_assisted: false },
      ],
    },
    {
      number: 2,
      name: 'Semaine 2 — Attirer les Visiteurs',
      objective: 'Facebook, pub, premiers clics',
      status: 'upcoming',
      tasks: [
        { id: 'w2t1', title: 'Créer Page Facebook Boutique', duration: '30 min', status: 'todo', points: 10, ai_assisted: false },
        { id: 'w2t2', title: 'Publier 3 posts produit avec visuels IA', duration: '1h', status: 'todo', points: 15, ai_assisted: true },
        { id: 'w2t3', title: 'Lancer 1ère pub Facebook (200 MAD)', why: 'Ciblage préparé par IA', duration: '45 min', status: 'todo', points: 25, ai_assisted: true },
        { id: 'w2t4', title: 'Analyser résultats pub J+3', duration: '30 min', status: 'todo', points: 15, ai_assisted: true },
        { id: 'w2t5', title: 'Répondre aux 1ers messages WhatsApp', duration: '15 min/jour', status: 'todo', points: 10, ai_assisted: false },
      ],
    },
    {
      number: 3,
      name: 'Semaine 3 — Optimiser & Vendre',
      objective: '1ère vente, retargeting',
      status: 'upcoming',
      tasks: [
        { id: 'w3t1', title: 'Analyser résultats pub semaine 2', duration: '45 min', status: 'todo', points: 15, ai_assisted: true },
        { id: 'w3t2', title: 'Relancer les visiteurs (retargeting)', duration: '30 min', status: 'todo', points: 20, ai_assisted: true },
        { id: 'w3t3', title: 'Configurer relance paniers abandonnés', duration: '20 min', status: 'todo', points: 15, ai_assisted: false },
        { id: 'w3t4', title: 'Ajouter 5 nouveaux produits tendance', duration: '1h', status: 'todo', points: 15, ai_assisted: true },
        { id: 'w3t5', title: '🎯 Objectif : recevoir la 1ère commande', duration: 'Milestone', status: 'todo', points: 50, ai_assisted: false },
      ],
    },
    {
      number: 4,
      name: 'Semaine 4 — Scaler',
      objective: 'Augmenter budget pub, fidéliser',
      status: 'upcoming',
      tasks: [
        { id: 'w4t1', title: 'Doubler budget pub si ROAS > 2', duration: '30 min', status: 'todo', points: 20, ai_assisted: true },
        { id: 'w4t2', title: 'Créer offre fidélité clients (remise 10%)', duration: '20 min', status: 'todo', points: 15, ai_assisted: false },
        { id: 'w4t3', title: 'Collecter 5 avis clients', duration: '30 min', status: 'todo', points: 20, ai_assisted: false },
        { id: 'w4t4', title: 'Analyser produits best-sellers', duration: '1h', status: 'todo', points: 15, ai_assisted: true },
        { id: 'w4t5', title: '🚀 Objectif : 10 commandes livrées', duration: 'Milestone mois 1', status: 'todo', points: 100, ai_assisted: false },
      ],
    },
  ]
}
