import type { DiagnosticQuestion } from '@/types'

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 1,
    text: "Quel est ton niveau d'expérience en e-commerce ?",
    subtext: "Sois honnête, on adapte le plan à ton niveau.",
    type: 'single',
    options: [
      { id: 'a', emoji: '🌱', label: 'Débutant complet', sublabel: 'Jamais vendu en ligne', value: 'beginner' },
      { id: 'b', emoji: '📚', label: 'Quelques notions', sublabel: "J'ai essayé sans succès", value: 'some_experience' },
      { id: 'c', emoji: '💼', label: 'Intermédiaire', sublabel: "J'ai déjà vendu en ligne", value: 'intermediate' },
      { id: 'd', emoji: '🚀', label: 'Expérimenté', sublabel: "J'ai une boutique active", value: 'experienced' },
    ],
  },
  {
    id: 2,
    text: "Quel budget peux-tu investir pour démarrer ?",
    subtext: "Inclut le stock, les pubs et les outils.",
    type: 'single',
    options: [
      { id: 'a', emoji: '💰', label: 'Moins de 1 000 MAD', sublabel: 'Budget très serré', value: 'under_1000' },
      { id: 'b', emoji: '💰💰', label: '1 000 – 3 000 MAD', sublabel: 'Budget raisonnable', value: '1000_3000' },
      { id: 'c', emoji: '💰💰💰', label: '3 000 – 10 000 MAD', sublabel: 'Budget confortable', value: '3000_10000' },
      { id: 'd', emoji: '🏦', label: 'Plus de 10 000 MAD', sublabel: 'Prêt à investir sérieusement', value: 'over_10000' },
    ],
  },
  {
    id: 3,
    text: "Quel type de produits t'attire le plus ?",
    subtext: "Choisis ce qui correspond le mieux à tes envies.",
    type: 'grid',
    options: [
      { id: 'a', emoji: '👗', label: 'Mode & Vêtements', sublabel: 'Prêt-à-porter, accessoires', value: 'fashion' },
      { id: 'b', emoji: '💄', label: 'Beauté & Soins', sublabel: 'Cosmétiques, argan, beldi', value: 'beauty' },
      { id: 'c', emoji: '🏠', label: 'Maison & Déco', sublabel: 'Zellige, artisanat', value: 'home' },
      { id: 'd', emoji: '📱', label: 'Tech & Gadgets', sublabel: 'Accessoires, électronique', value: 'tech' },
    ],
  },
  {
    id: 4,
    text: "Combien d'heures par semaine peux-tu consacrer à ton projet ?",
    subtext: "Sois réaliste pour un plan adapté.",
    type: 'single',
    options: [
      { id: 'a', emoji: '⏰', label: 'Moins de 5h', sublabel: 'Activité secondaire', value: 'under_5h' },
      { id: 'b', emoji: '🕐', label: '5 à 15h', sublabel: 'Mi-temps', value: '5_15h' },
      { id: 'c', emoji: '💻', label: '15 à 30h', sublabel: 'Quasi temps plein', value: '15_30h' },
      { id: 'd', emoji: '🔥', label: 'Plus de 30h', sublabel: 'Temps plein', value: 'over_30h' },
    ],
  },
  {
    id: 5,
    text: "Quel modèle de vente préfères-tu ?",
    subtext: "Chaque modèle a ses avantages selon ton profil.",
    type: 'grid',
    options: [
      { id: 'a', emoji: '🚚', label: 'Dropshipping', sublabel: 'Vendre sans stock', value: 'dropshipping' },
      { id: 'b', emoji: '📦', label: 'Revendeur', sublabel: 'Acheter & revendre', value: 'reseller' },
      { id: 'c', emoji: '✨', label: 'Marque propre', sublabel: 'Créer mon produit', value: 'private_label' },
      { id: 'd', emoji: '🤷', label: 'Pas encore sûr', sublabel: "L'IA me conseillera", value: 'unsure' },
    ],
  },
  {
    id: 6,
    text: "Quelle est ta cible principale ?",
    subtext: "Qui veux-tu toucher en priorité ?",
    type: 'grid',
    options: [
      { id: 'a', emoji: '👩', label: 'Femmes 18-35 ans', sublabel: 'Mode, beauté, lifestyle', value: 'women_18_35' },
      { id: 'b', emoji: '👨', label: 'Hommes 25-45 ans', sublabel: 'Tech, sport, mode', value: 'men_25_45' },
      { id: 'c', emoji: '👨‍👩‍👧', label: 'Familles', sublabel: 'Maison, enfants, deco', value: 'families' },
      { id: 'd', emoji: '🧑‍💼', label: 'Professionnels', sublabel: 'B2B, services, outils', value: 'professionals' },
    ],
  },
  {
    id: 7,
    text: "Quelle ville ou région cibles-tu en priorité ?",
    subtext: "Le marché marocain varie selon les villes.",
    type: 'grid',
    options: [
      { id: 'a', emoji: '🏙️', label: 'Casablanca & Rabat', sublabel: 'Grand marché urbain', value: 'casa_rabat' },
      { id: 'b', emoji: '🌆', label: 'Marrakech & Agadir', sublabel: 'Tourisme + local', value: 'marrakech_agadir' },
      { id: 'c', emoji: '🗺️', label: 'Tout le Maroc', sublabel: 'Couverture nationale', value: 'nationwide' },
      { id: 'd', emoji: '🌍', label: 'Export (Europe)', sublabel: 'Diaspora marocaine', value: 'export' },
    ],
  },
  {
    id: 8,
    text: "Quelle plateforme préfères-tu utiliser ?",
    subtext: "On peut aussi t'aider à choisir.",
    type: 'grid',
    options: [
      { id: 'a', emoji: '🇲🇦', label: 'Youcan', sublabel: 'Made in Morocco', value: 'youcan' },
      { id: 'b', emoji: '🌐', label: 'Shopify', sublabel: 'Standard international', value: 'shopify' },
      { id: 'c', emoji: '📊', label: 'WooCommerce', sublabel: 'WordPress + e-com', value: 'woocommerce' },
      { id: 'd', emoji: '🤖', label: "L'IA choisit pour moi", sublabel: 'Recommandation personnalisée', value: 'ai_choice' },
    ],
  },
  {
    id: 9,
    text: "As-tu déjà une idée de produit ou de niche ?",
    subtext: "Même vague, ça aide l'IA à te guider.",
    type: 'single',
    options: [
      { id: 'a', emoji: '💡', label: 'Oui, j\'ai une idée précise', sublabel: 'Je sais ce que je veux vendre', value: 'clear_idea' },
      { id: 'b', emoji: '🌫️', label: 'Une idée vague', sublabel: 'Un domaine mais pas de produit', value: 'vague_idea' },
      { id: 'c', emoji: '❓', label: 'Pas encore', sublabel: "L'IA m'aidera à trouver", value: 'no_idea' },
    ],
  },
  {
    id: 10,
    text: "Quel est ton objectif principal pour les 3 premiers mois ?",
    subtext: "Cela influence la stratégie recommandée.",
    type: 'single',
    options: [
      { id: 'a', emoji: '🎯', label: 'Premières ventes', sublabel: 'Valider que ça marche', value: 'first_sales' },
      { id: 'b', emoji: '💵', label: 'Revenu secondaire', sublabel: '2 000 – 5 000 MAD/mois', value: 'side_income' },
      { id: 'c', emoji: '🏢', label: 'Business à temps plein', sublabel: 'Remplacer mon salaire', value: 'full_time' },
      { id: 'd', emoji: '📈', label: 'Scaler rapidement', sublabel: 'Croissance agressive', value: 'scale' },
    ],
  },
]
