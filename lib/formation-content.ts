// ═══════════════════════════════════════════════════════════════
// ShopSimply — Contenu formation e-commerce Maroc
// 8 modules · 40 leçons · adapté au marché marocain
// ═══════════════════════════════════════════════════════════════

export interface Lesson {
  slug: string
  title: string
  duration: string       // "5 min"
  type: 'read' | 'practice' | 'quiz' | 'video'
  content: string        // contenu principal en markdown simplifié
  tips: string[]
  action?: string        // action concrète à faire après la leçon
  aiPrompt?: string      // question suggérée pour ShopAI
}

export interface Module {
  slug: string
  title: string
  emoji: string
  description: string
  duration: string       // durée totale du module
  level: 'débutant' | 'intermédiaire' | 'avancé'
  color: string
  bg: string
  border: string
  lessons: Lesson[]
}

export const FORMATION_MODULES: Module[] = [
  // ── MODULE 1 ──────────────────────────────────────────────
  {
    slug: 'lancer-boutique',
    title: 'Lancer ta boutique en 48h',
    emoji: '🚀',
    description: 'De zéro à ta première boutique en ligne opérationnelle sur Youcan ou Shopify.',
    duration: '45 min',
    level: 'débutant',
    color: 'text-accent',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    lessons: [
      {
        slug: 'choisir-plateforme',
        title: 'Youcan vs Shopify : laquelle choisir ?',
        duration: '6 min',
        type: 'read',
        content: `**Youcan** est la plateforme marocaine #1 pour le COD. Créée au Maroc, elle intègre nativement Amana, Chronopost et les paiements locaux (CMI, Cash Plus).

**Shopify** est plus puissante mais plus chère (29$/mois) et moins adaptée au COD marocain. Recommandée si tu vises l'export.

**Notre recommandation pour débuter au Maroc : Youcan à 100%.**

Pourquoi ?
- Interface en français et arabe
- Support COD natif
- Intégration Amana en 1 clic
- Tarif adapté : 99 MAD/mois
- Communauté marocaine active`,
        tips: [
          'Commence avec Youcan — tu peux migrer plus tard si tu grandis',
          'Le plan de base Youcan suffit pour tes 100 premières commandes',
          'Garde ton argent pour la pub Facebook, pas pour la plateforme',
        ],
        action: 'Crée ton compte Youcan gratuit sur youcan.shop',
        aiPrompt: 'Compare-moi Youcan et Shopify pour vendre au Maroc en COD',
      },
      {
        slug: 'configurer-boutique',
        title: 'Configurer ta boutique en 30 minutes',
        duration: '8 min',
        type: 'practice',
        content: `Les 5 étapes pour avoir une boutique prête à vendre :

**1. Nom et logo (5 min)**
Choisis un nom court, mémorisable, en français ou darija. Évite les noms trop génériques ("boutique maroc"). Crée un logo simple sur Canva.

**2. Page d'accueil (10 min)**
- Photo hero professionnelle (Unsplash pour commencer)
- 3 avantages de ta boutique
- Bouton CTA "Commander maintenant"

**3. Page produit (10 min)**
- Titre clair avec le bénéfice principal
- Photos de qualité (min 3)
- Description + bouton commander

**4. Modes de paiement (3 min)**
Active COD en premier. Ajoute CMI ensuite si tu as les documents.

**5. Livraison (2 min)**
Configure Amana Express. Frais de livraison : 25-35 MAD selon la zone.`,
        tips: [
          'Ne bloque pas 3 jours sur le design — une boutique simple qui vend vaut mieux qu\'une belle boutique vide',
          'Utilise les templates gratuits Youcan, personnalise juste les couleurs et photos',
          'Commence avec 1-3 produits maximum, pas 50',
        ],
        action: 'Configure les 5 éléments ci-dessus sur ta boutique Youcan',
        aiPrompt: 'Quels sont les éléments indispensables d\'une page produit qui convertit au Maroc ?',
      },
      {
        slug: 'premiere-commande',
        title: 'Stratégie pour ta 1ère commande',
        duration: '5 min',
        type: 'read',
        content: `La 1ère commande est psychologiquement la plus difficile. Voici comment l'accélérer.

**Méthode 1 : Entourage immédiat**
Partage ta boutique avec ta famille et amis. Demande-leur d'acheter ou de te recommander. Ce n'est pas tricher — c'est du marketing de bouche-à-oreille.

**Méthode 2 : Groupes Facebook locaux**
Poste dans les groupes Facebook de ta ville avec une offre de lancement (-20% les 3 premiers jours).

**Méthode 3 : Mini pub Facebook (50 MAD)**
50 MAD de pub ciblée sur ta ville = 2000-5000 personnes atteintes. Souvent suffisant pour 1-3 commandes.

**L'objectif n'est pas de gagner de l'argent sur la 1ère commande — c'est d'apprendre le processus complet.**`,
        tips: [
          'La 1ère commande peut arriver dans les 48h avec la bonne stratégie',
          'Même si elle vient d\'un ami, traite-la comme une vraie commande',
          'Note tout : comment la commande est arrivée, comment tu l\'as confirmée',
        ],
        action: 'Partage ta boutique dans 3 groupes Facebook de ta ville aujourd\'hui',
        aiPrompt: 'Comment obtenir mes 10 premières commandes COD au Maroc rapidement ?',
      },
    ],
  },

  // ── MODULE 2 ──────────────────────────────────────────────
  {
    slug: 'trouver-produit-gagnant',
    title: 'Trouver ton produit gagnant',
    emoji: '🎯',
    description: 'La méthode pour identifier les produits qui se vendent au Maroc avant d\'investir.',
    duration: '50 min',
    level: 'débutant',
    color: 'text-teal-brand',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    lessons: [
      {
        slug: 'criteres-produit-cod',
        title: 'Les 5 critères d\'un produit COD parfait',
        duration: '7 min',
        type: 'read',
        content: `Au Maroc, le COD (Cash on Delivery) représente 85% des achats en ligne. Ton produit doit être conçu pour ce mode.

**Critère 1 : Prix de vente 80-350 MAD**
En dessous de 80 MAD, le client hésite peu mais la marge est faible. Au-dessus de 350 MAD, le taux de refus COD explose.

**Critère 2 : Poids < 1 kg**
Moins de frais Amana, moins de risques de casse, moins de retours.

**Critère 3 : Marge brute ≥ 40%**
Avec les retours (25-35%) et la pub, tu as besoin d'une marge confortable.

**Critère 4 : Résout un problème visible**
"Ma cuisine manque de rangements" → organiseur cuisine. Le client comprend en 3 secondes.

**Critère 5 : Achat impulsif**
Les meilleurs produits COD ne se "réfléchissent" pas. Le client voit, désire, commande.`,
        tips: [
          'Utilise le Scoring Produit IA de ShopSimply pour évaluer n\'importe quel produit en 30 secondes',
          'Teste 3-5 produits différents les 2 premiers mois avant de choisir ton produit principal',
          'Regarde ce que tes concurrents Youcan vendent, pas ce que tu aimes toi',
        ],
        action: 'Évalue 3 produits que tu considères avec l\'outil Scoring Produit IA',
        aiPrompt: 'Analyse ce produit [nom] pour le marché marocain : est-il adapté au COD ?',
      },
      {
        slug: 'recherche-produits',
        title: 'Où trouver des produits qui marchent',
        duration: '8 min',
        type: 'read',
        content: `**Sources de produits gagnants au Maroc :**

**1. TikTok Creative Center**
Filtre par pays (Maroc), catégorie et période. Les produits viraux TikTok se vendent 3x mieux en COD.

**2. Pages Facebook concurrentes**
Cherche "livraison maroc" ou "cod maroc" sur Facebook. Regarde les pubs avec le plus d'engagement.

**3. AliExpress Best Sellers**
Filtre par commandes (>1000), note (4.5+), délai de livraison. Commande d'abord pour toi avant de vendre.

**4. Groupes Telegram Dropshipping Maroc**
Des communautés partagent les "winning products" du moment. Filtre — beaucoup de faux.

**5. Amazon US → Maroc**
Identifie les best-sellers US qui n'existent pas encore au Maroc. Tu as 6-12 mois d'avance.`,
        tips: [
          'Ne copie pas un concurrent à l\'identique — améliore la description ou le ciblage',
          'Un produit "vu partout" au Maroc n\'est pas forcément mort : si tu convertis mieux, tu gagnes',
          'Commande toujours le produit avant de le vendre — tu découvres sa vraie qualité',
        ],
        action: 'Passe 30 minutes sur TikTok Creative Center et note 5 produits potentiels',
        aiPrompt: 'Trouves-moi 5 idées de produits gagnants pour [ta niche] au Maroc en ce moment',
      },
      {
        slug: 'tester-sans-stock',
        title: 'Tester un produit sans stock ni risque',
        duration: '6 min',
        type: 'practice',
        content: `La méthode du test à 100 MAD :

**Étape 1 : Crée la fiche produit**
Photos fournisseur + description IA (ShopSimply) + prix testé.

**Étape 2 : Lance une micro-pub Facebook**
Budget : 50-100 MAD · Durée : 2-3 jours · Cible : ta ville principale.

**Étape 3 : Analyse les résultats**
- 0 commande → mauvais produit ou mauvaise pub
- 1-2 commandes → potentiel, optimise la pub
- 3+ commandes → produit gagnant, scale

**Étape 4 : Seulement après validation, commande le stock**
Chez AliExpress ou un grossiste local selon le volume.

**Le principe :** Tu dépenses 100 MAD pour savoir si le produit a du potentiel, pas 5000 MAD en stock.`,
        tips: [
          'Si 0 commande après 2 jours et 100 MAD de pub → passe au produit suivant sans regret',
          'Ne juge pas sur 1 seule pub — teste au moins 2 visuels différents',
          'Note ton CPM, CPC et taux de clic pour comparer les produits entre eux',
        ],
        action: 'Lance un test à 100 MAD sur ton produit le plus prometteur cette semaine',
      },
    ],
  },

  // ── MODULE 3 ──────────────────────────────────────────────
  {
    slug: 'facebook-ads-maroc',
    title: 'Facebook Ads pour le Maroc',
    emoji: '🎯',
    description: 'Créer et optimiser des pubs Facebook qui convertissent le client marocain.',
    duration: '60 min',
    level: 'intermédiaire',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    lessons: [
      {
        slug: 'structure-campagne',
        title: 'Structure de campagne parfaite pour le COD',
        duration: '8 min',
        type: 'read',
        content: `**La structure en 3 niveaux :**

**Campagne** → Objectif : Conversions (pas Trafic, pas Portée)
- Budget : 30-50 MAD/jour minimum
- Optimisation : Purchase ou Add to Cart

**Ensemble de publicités** → Ciblage
- Âge : 18-40 ans (ajuste selon le produit)
- Genre : selon ton produit
- Géo : Maroc entier ou villes clés
- Centres d'intérêt : 1-3 maximum, spécifiques

**Publicité** → Créatif
- Vidéo 15-30s : TOUJOURS mieux que l'image seule
- Image : fond blanc ou lifestyle
- Texte : problème → solution → CTA en darija ou FR

**Erreur #1 des débutants :** Trop d'audiences simultanées. Commence par 1-2 audiences et optimise.`,
        tips: [
          'Commence avec un budget de 50 MAD/jour — assez pour avoir des données',
          'Ne touche pas à une campagne pendant 48-72h après lancement',
          'Teste toujours au moins 2 visuels différents dans le même ensemble de pubs',
        ],
        action: 'Crée ta première campagne avec cette structure sur Facebook Ads Manager',
        aiPrompt: 'Crée-moi un texte de pub Facebook pour [produit] ciblant [audience] au Maroc',
      },
      {
        slug: 'ciblage-maroc',
        title: 'Ciblage avancé pour le marché marocain',
        duration: '7 min',
        type: 'read',
        content: `**Audiences qui fonctionnent au Maroc :**

**Par comportement d'achat :**
- "Acheteurs en ligne engagés" → audience chaude
- "Voyageurs fréquents" → pouvoir d'achat élevé
- "Administrateurs de page" → entrepreneurs

**Par centres d'intérêt :**
- Mode : "Zara", "H&M", "Zalando" → clients prêts à acheter en ligne
- Beauté : "L'Oréal", "Nyx", "Fenty Beauty"
- Cuisine : "Thermomix", "recettes marocaines"

**Par ville :**
- Casablanca (44% des achats en ligne)
- Rabat-Salé (18%)
- Marrakech (8%)
- Tanger (7%)
- Fès (6%)

**Lookalike Audiences :**
Dès 100 clients dans ton CRM → crée une audience similaire Facebook. Taux de conversion x2-3.`,
        tips: [
          'Évite les audiences trop larges ("Maroc entier, tous âges") — tu gaspilles ton budget',
          'Les audiences par comportement sont souvent meilleures que par centres d\'intérêt',
          'Après 50 achats, laisse Facebook optimiser automatiquement (Advantage+)',
        ],
        action: 'Crée 2 audiences différentes pour ton prochain test produit',
      },
      {
        slug: 'visuels-qui-convertissent',
        title: 'Visuels qui font cliquer les Marocains',
        duration: '6 min',
        type: 'read',
        content: `**Ce qui fonctionne spécifiquement au Maroc :**

**1. La vidéo "Unboxing" (60% du temps)**
Montre le produit sorti de sa boîte. Authentique, pas professionnel. Le client s'identifie.

**2. Le "avant/après" (20% du temps)**
Problème visible → solution visible. Sans texte si possible.

**3. La "preuve sociale" (10% du temps)**
Commentaires réels de clients, captures écran WhatsApp. La confiance est clé en COD.

**4. L'animation produit (10%)**
GIF ou courte vidéo du produit en action. Stoppe le scroll.

**Ce qui ne fonctionne PAS :**
- Photos catalogue trop parfaites → manque d'authenticité
- Texte arabe literary → préfère la darija phonétique
- Prix barrés fictifs → les clients reconnaissent les fausses promo

**La règle du pouce :** Si tu ne cliques pas toi-même sur ton pub, ton client ne cliquera pas.`,
        tips: [
          'Filme le produit avec ton téléphone — la qualité "amateur" convertit souvent mieux',
          'Utilise le générateur de contenu ShopSimply pour les textes de pub',
          'Recycle tes meilleurs visuels — si ça marche, garde-le 3-6 mois',
        ],
        action: 'Crée 2 visuels de types différents pour ton produit (unboxing + avant/après)',
        aiPrompt: 'Génère 3 variantes de texte pub Facebook pour [produit] en darija et français',
      },
    ],
  },

  // ── MODULE 4 ──────────────────────────────────────────────
  {
    slug: 'gestion-cod',
    title: 'Maîtriser le COD de A à Z',
    emoji: '💰',
    description: 'Confirmation, livraison, retours — tout sur le Cash on Delivery au Maroc.',
    duration: '40 min',
    level: 'débutant',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    lessons: [
      {
        slug: 'taux-confirmation',
        title: 'Atteindre 70% de taux de confirmation',
        duration: '7 min',
        type: 'read',
        content: `Le taux de confirmation moyen au Maroc est de 55-65%. Les meilleurs vendeurs atteignent 75-80%.

**Les 4 facteurs qui font un bon taux de confirmation :**

**1. La vitesse de rappel**
Appelle dans les 30 minutes après la commande. Au-delà de 2h, le taux chute de 20%.

**2. Le ton de l'appel**
Parle en darija, pas en français formel. Sois amical, pas commercial. "Salam, ana de [Boutique], 3andek commande..."

**3. La fiche produit claire**
Si le client est surpris par le produit au téléphone → il refuse. Tes photos et description doivent être honnêtes.

**4. La relance en 3 temps**
- Appel 1 : dans les 30 min
- SMS/WhatsApp : 2h plus tard si pas de réponse
- Appel 2 : le lendemain matin

**Script de confirmation (darija) :**
"Salam [Prénom], ana de [Boutique]. Chefna commande dial [Produit]. Prix : [X] MAD à la livraison. Confirmez ?"`,
        tips: [
          'Enregistre tes appels (avec accord) pour t\'améliorer',
          'Les commandes du week-end ont un taux de confirmation 10% plus bas — prévois-toi',
          'Un client qui répond en français veut être appelé en français — adapte-toi',
        ],
        action: 'Utilise les scripts relance ShopSimply et personnalise-les avec ton nom de boutique',
        aiPrompt: 'Génère un script de confirmation COD en darija pour [nom de boutique]',
      },
      {
        slug: 'gerer-retours',
        title: 'Réduire et gérer les retours',
        duration: '6 min',
        type: 'read',
        content: `Le taux de retour moyen en e-commerce COD Maroc est de 25-35%. Voici comment le réduire à moins de 20%.

**Causes principales des retours :**
1. Le produit ne correspond pas aux photos (43%)
2. Le client a changé d'avis (27%)
3. Qualité décevante (18%)
4. Erreur de commande (12%)

**Stratégies de réduction :**

**Photos honnêtes :** Montre les défauts mineurs. Un client surpris positivement recommande, surpris négativement retourne.

**Confirmation téléphonique détaillée :** "Le produit fait [dimensions] et pèse [poids]. Confirmez ?"

**Emballage soigné :** Un colis bien emballé inspire la confiance à la livraison.

**Politique de retour claire :** Annonce 7 jours de retour — paradoxalement, ça rassure et réduit les retours.

**Calcule ton taux de retour :**
Utilise le Calculateur COD ShopSimply pour voir l'impact réel sur ta marge.`,
        tips: [
          'Chaque retour évité = 40-60 MAD économisés (frais Amana aller + retour)',
          'Les retours sont normaux — l\'objectif est de les minimiser, pas les éliminer',
          'Note la raison de chaque retour dans le CRM pour identifier les tendances',
        ],
        action: 'Calcule ton taux de retour actuel et son impact sur ta marge avec le Calculateur COD',
      },
    ],
  },

  // ── MODULE 5 ──────────────────────────────────────────────
  {
    slug: 'crm-fidelisation',
    title: 'CRM & Fidélisation clients',
    emoji: '👥',
    description: 'Transformer tes acheteurs en clients fidèles qui rachètent et recommandent.',
    duration: '35 min',
    level: 'intermédiaire',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    lessons: [
      {
        slug: 'segmenter-clients',
        title: 'Segmenter tes clients pour vendre plus',
        duration: '6 min',
        type: 'read',
        content: `**Les 4 segments clients à surveiller :**

**VIP (top 10%)** — > 3 commandes OU > 500 MAD dépensés
→ Traite-les royalement. Offre des réductions exclusives, livre en priorité.

**Fidèles (2 commandes)**
→ Relance personnalisée 30 jours après la 2ème commande avec une offre.

**Uniques (1 commande)**
→ Objectif : les amener à commander une 2ème fois. Un client qui rachète a 60% de chances de devenir fidèle.

**Inactifs (> 60 jours sans commande)**
→ Campagne de réactivation WhatsApp avec une offre exclusive.

**Dans ShopSimply :** Utilise les tags du CRM pour marquer ces segments. Filtre ensuite par tag pour tes campagnes de relance.`,
        tips: [
          'Le coût d\'acquisition d\'un nouveau client est 5-7x plus cher que de revendre à un existant',
          'Tes 10 meilleurs clients valent souvent autant que tes 100 autres réunis',
          'Un message WhatsApp personnalisé ("Salam [Prénom]") convertit 3x mieux qu\'un message générique',
        ],
        action: 'Dans le CRM ShopSimply, tag tes 5 meilleurs clients comme "VIP" et tes inactifs comme "À relancer"',
        aiPrompt: 'Génère un message WhatsApp de réactivation pour mes clients inactifs depuis 2 mois',
      },
    ],
  },

  // ── MODULE 6 ──────────────────────────────────────────────
  {
    slug: 'finances-marges',
    title: 'Finances & Marges réelles',
    emoji: '📊',
    description: 'Comprendre tes vrais chiffres pour savoir si tu gagnes vraiment de l\'argent.',
    duration: '35 min',
    level: 'intermédiaire',
    color: 'text-navy',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    lessons: [
      {
        slug: 'calculer-marge-reelle',
        title: 'Calculer ta vraie marge nette',
        duration: '8 min',
        type: 'practice',
        content: `**Beaucoup de vendeurs pensent gagner 100 MAD par vente. La réalité est différente.**

**Exemple concret :**
- Prix de vente : 199 MAD
- Prix d'achat produit : 55 MAD
- **Marge brute : 144 MAD (72%)**

Maintenant les vrais coûts :
- Livraison Amana : -30 MAD
- Retours (30% des commandes) : -43 MAD (144 × 30%)
- Pub Facebook par commande : -35 MAD
- **Marge nette réelle : 36 MAD (18%)**

Sur 100 commandes passées :
- 70 livrées × 36 MAD = **2 520 MAD de profit**
- 30 retournées × (-30 MAD frais retour) = **-900 MAD**
- **Profit réel : 1 620 MAD pour 100 commandes**

**Utilise le Calculateur COD ShopSimply** pour faire ces calculs automatiquement avec tes vrais chiffres.`,
        tips: [
          'Une marge nette < 15% = dangereux. Tout problème (pub plus chère, retours qui montent) te met dans le rouge',
          'Vise 25-35% de marge nette pour avoir une activité pérenne',
          'Le calculateur COD de ShopSimply intègre tous ces paramètres automatiquement',
        ],
        action: 'Calcule la marge nette réelle de ton produit principal avec le Calculateur COD',
        aiPrompt: 'Mon produit coûte [X] MAD et se vend [Y] MAD avec 30% de retours. Quelle est ma vraie marge ?',
      },
    ],
  },

  // ── MODULE 7 ──────────────────────────────────────────────
  {
    slug: 'scaler-automatiser',
    title: 'Scaler & Automatiser',
    emoji: '⚡',
    description: 'Passer de 5 à 50 commandes par jour sans travailler 20h/jour.',
    duration: '40 min',
    level: 'avancé',
    color: 'text-accent',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    lessons: [
      {
        slug: 'quand-scaler',
        title: 'Quand et comment scaler ta pub',
        duration: '7 min',
        type: 'read',
        content: `**Les signaux pour scaler :**
✅ Taux de confirmation > 65%
✅ Marge nette > 20% sur les 30 derniers jours
✅ ROAS > 2.5 (tu gagnes 2.5 MAD pour chaque MAD investi en pub)
✅ Fournisseur capable de suivre le volume

**Comment scaler sans casser les campagnes :**

**Règle des 20% :** Augmente le budget de maximum 20% par jour. Une augmentation brutale détruit l'algorithme.

**Duplication d'ensemble :** Duplique l'ensemble de pubs performant avec un nouveau budget. Ne modifie pas l'original.

**Horizontal vs Vertical :**
- Vertical : augmenter le budget du même ensemble
- Horizontal : créer de nouveaux ensembles avec des nouvelles audiences

Les deux en parallèle = croissance optimale.`,
        tips: [
          'Scale seulement ce qui marche déjà — ne "répare" pas une campagne en lui donnant plus de budget',
          'Garde toujours 1-2 campagnes de test avec 20% de ton budget total',
          'Un ROAS de 3+ pendant 7 jours consécutifs = signal fort pour doubler le budget',
        ],
        action: 'Vérifie ton ROAS des 7 derniers jours dans Facebook Ads Manager avant de scaler',
      },
    ],
  },

  // ── MODULE 8 ──────────────────────────────────────────────
  {
    slug: 'mindset-entrepreneur',
    title: 'Mindset & Gestion du temps',
    emoji: '🧠',
    description: 'Les habitudes et la mentalité des e-commerçants marocains qui réussissent.',
    duration: '25 min',
    level: 'débutant',
    color: 'text-teal-brand',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    lessons: [
      {
        slug: 'routine-quotidienne',
        title: 'La routine quotidienne du vendeur performant',
        duration: '5 min',
        type: 'read',
        content: `**Matin (30 min)**
- Vérifier les commandes de la nuit
- Confirmer les commandes en attente (objectif : avant 10h)
- Vérifier les pubs Facebook (couper si CPC > 3 MAD)

**Milieu de journée (15 min)**
- Répondre aux messages clients
- Vérifier les livraisons du jour
- Mettre à jour le CRM

**Soir (20 min)**
- Analyser les stats de la journée
- Préparer les pubs du lendemain si besoin
- Planifier les commandes fournisseur

**Hebdomadaire (1h)**
- Analyser les produits (quoi arrêter, quoi scaler)
- Vérifier les finances (marge réelle, pas juste les commandes)
- Tester 1 nouveau produit ou ciblage

**La clé :** La régularité bat l'intensité. 30 min chaque jour > 5h une fois par semaine.`,
        tips: [
          'Utilise ShopSimply chaque matin comme tableau de bord — tout est centralisé',
          'Ne regarde pas tes pubs plus de 2 fois par jour — l\'algorithme a besoin de temps',
          'Un jour de repos par semaine = obligatoire pour décider clairement',
        ],
        action: 'Bloque 30 minutes chaque matin dans ton agenda pour ta routine e-commerce',
        aiPrompt: 'Comment organiser ma journée pour gérer ma boutique e-commerce en parallèle de mon emploi ?',
      },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────

export function getModule(slug: string): Module | undefined {
  return FORMATION_MODULES.find(m => m.slug === slug)
}

export function getLesson(moduleSlug: string, lessonSlug: string): Lesson | undefined {
  const mod = getModule(moduleSlug)
  return mod?.lessons.find(l => l.slug === lessonSlug)
}

export function getTotalLessons(): number {
  return FORMATION_MODULES.reduce((sum, m) => sum + m.lessons.length, 0)
}

export const LEVEL_CONFIG = {
  débutant:      { badge: 'bg-green-100 text-green-700', label: 'Débutant' },
  intermédiaire: { badge: 'bg-blue-100 text-blue-700',   label: 'Intermédiaire' },
  avancé:        { badge: 'bg-purple-100 text-purple-700', label: 'Avancé' },
}
