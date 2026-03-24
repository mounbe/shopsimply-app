import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shopsimply.ma'
const SITE_NAME = 'ShopSimply'

interface SeoConfig {
  title: string
  description: string
  keywords?: string[]
  noIndex?: boolean
  image?: string
}

export function buildMetadata(config: SeoConfig): Metadata {
  const fullTitle = `${config.title} | ${SITE_NAME}`
  const ogImage = config.image || `${BASE_URL}/og-default.png`

  return {
    title: fullTitle,
    description: config.description,
    keywords: config.keywords?.join(', '),
    robots: config.noIndex ? 'noindex, nofollow' : 'index, follow',
    openGraph: {
      title: fullTitle,
      description: config.description,
      siteName: SITE_NAME,
      locale: 'fr_MA',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: config.description,
      images: [ogImage],
    },
  }
}

// ── Metadata par page ─────────────────────────────────────────

export const SEO = {
  home: buildMetadata({
    title: "Lance ton e-commerce au Maroc en 48h",
    description: "ShopSimply : l'IA qui configure ta boutique, choisit tes produits et t'accompagne jusqu'à la 1ère vente. Youcan, Shopify, COD natif, darija.",
    keywords: ['ecommerce maroc', 'boutique en ligne maroc', 'youcan maroc', 'dropshipping maroc', 'shopify maroc', 'vente en ligne maroc'],
  }),

  diagnostic: buildMetadata({
    title: 'Diagnostic gratuit — Trouve ta niche idéale',
    description: '10 questions pour trouver la niche e-commerce parfaite pour toi au Maroc. Résultats personnalisés par IA en 2 minutes.',
    keywords: ['niche ecommerce maroc', 'quelle niche vendre', 'diagnostic ecommerce', 'dropshipping niche maroc'],
  }),

  resultats: buildMetadata({
    title: 'Tes recommandations personnalisées',
    description: 'Résultats de ton diagnostic : 3 niches sélectionnées par IA avec scores et analyses de marché pour le Maroc.',
    noIndex: true,
  }),

  login: buildMetadata({
    title: 'Connexion',
    description: 'Connecte-toi à ShopSimply pour accéder à ton tableau de bord e-commerce.',
    noIndex: true,
  }),

  dashboard: buildMetadata({
    title: 'Tableau de bord',
    description: 'Vue d\'ensemble de ton activité : commandes, chiffre d\'affaires, tâches du jour et progression de ton plan 30 jours.',
    noIndex: true,
  }),

  plan: buildMetadata({
    title: 'Mon plan 30 jours',
    description: 'Ton plan d\'action personnalisé pour lancer ta boutique e-commerce au Maroc. Tâches quotidiennes guidées par IA.',
    noIndex: true,
  }),

  assistant: buildMetadata({
    title: 'ShopAI — Ton assistant e-commerce',
    description: 'Discute avec ShopAI pour obtenir des conseils personnalisés, des fiches produit, des scripts de relance et bien plus.',
    noIndex: true,
  }),

  crm: buildMetadata({
    title: 'CRM Clients',
    description: 'Gérez vos clients, commandes et relances WhatsApp en darija ou français. Pipeline COD intégré.',
    noIndex: true,
  }),

  commandes: buildMetadata({
    title: 'Commandes COD',
    description: 'Suivez vos commandes cash on delivery : pipeline kanban, confirmation, expédition et livraison Amana.',
    noIndex: true,
  }),

  produits: buildMetadata({
    title: 'Catalogue produits',
    description: 'Gérez votre catalogue produits avec calcul de marge live et génération de descriptions IA.',
    noIndex: true,
  }),

  outils: buildMetadata({
    title: 'Boîte à outils e-commerce',
    description: 'Calculateur COD Amana, générateur de contenu Facebook/Instagram, scripts relance WhatsApp en darija.',
    noIndex: true,
  }),

  calculateur: buildMetadata({
    title: 'Calculateur COD Amana',
    description: 'Calculez votre marge réelle avec les tarifs Amana 2026, le taux de retour et les frais pub. Simulation mensuelle incluse.',
    keywords: ['calculateur cod maroc', 'marge ecommerce maroc', 'amana tarif livraison', 'dropshipping marge maroc'],
  }),

  analytics: buildMetadata({
    title: 'Analytics boutique',
    description: 'Analysez votre chiffre d\'affaires, taux de confirmation COD et performances par période.',
    noIndex: true,
  }),

  profil: buildMetadata({
    title: 'Mon profil',
    description: 'Gérez votre profil, paramètres boutique et notifications ShopSimply.',
    noIndex: true,
  }),
}
