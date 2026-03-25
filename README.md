# ShopSimply — MVP

> Lance ton e-commerce au Maroc en 48h avec l'IA
> Built with Next.js 14 · Supabase · Claude API · Tailwind CSS

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth + DB | Supabase (PostgreSQL + Auth) |
| IA | Anthropic Claude API (claude-opus-4-6) |
| Déploiement | Vercel |

---

## Structure du projet

```
shopsimply-app/
├── app/
│   ├── page.tsx              # Landing page
│   ├── diagnostic/page.tsx   # Questionnaire 10 questions
│   ├── resultats/page.tsx    # Recommandations IA
│   ├── dashboard/page.tsx    # Dashboard utilisateur
│   ├── plan/page.tsx         # Plan 30 jours
│   ├── login/page.tsx        # Connexion magic link
│   ├── signup/page.tsx       # Inscription
│   └── api/
│       └── diagnostic/route.ts  # API Claude
├── lib/
│   ├── supabase/client.ts    # Supabase client-side
│   ├── supabase/server.ts    # Supabase server-side
│   ├── claude.ts             # Intégration Anthropic
│   ├── diagnostic-questions.ts  # Les 10 questions
│   └── utils.ts
├── types/index.ts            # TypeScript types
├── middleware.ts             # Protection routes
└── supabase/migrations/
    └── 001_initial.sql       # Schéma base de données
```

---

## Déploiement — Guide étape par étape

### 1. Créer un projet Supabase

1. Va sur [supabase.com](https://supabase.com) → New Project
2. Note l'URL du projet et la clé `anon`
3. Dans **SQL Editor**, exécute le fichier `supabase/migrations/001_initial.sql`
4. Dans **Authentication** → **URL Configuration** :
   - Site URL : `https://ton-app.vercel.app`
   - Redirect URLs : `https://ton-app.vercel.app/auth/callback`

### 2. Obtenir une clé API Anthropic

1. Va sur [console.anthropic.com](https://console.anthropic.com)
2. Crée une clé API
3. Note la clé `sk-ant-...`

### 3. Déployer sur Vercel

```bash
# 1. Installer les dépendances en local (optionnel)
npm install

# 2. Pousser sur GitHub
git init
git add .
git commit -m "Initial commit — ShopSimply MVP"
git remote add origin https://github.com/ton-user/shopsimply.git
git push -u origin main

# 3. Sur vercel.com → Import Project → ton repo GitHub
```

### 4. Variables d'environnement Vercel

Dans **Vercel → Settings → Environment Variables**, ajoute :

```
NEXT_PUBLIC_SUPABASE_URL        = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJ...
SUPABASE_SERVICE_ROLE_KEY       = eyJ...
ANTHROPIC_API_KEY               = sk-ant-...
NEXT_PUBLIC_APP_URL             = https://ton-app.vercel.app
```

### 5. Déployer

Vercel se déploie automatiquement à chaque push sur `main`. ✓

---

## Développement local

```bash
# 1. Copier les variables d'environnement
cp .env.example .env.local
# Remplis les valeurs dans .env.local

# 2. Installer les dépendances
npm install

# 3. Lancer en dev
npm run dev

# 4. Ouvrir http://localhost:3000
```

---

## Roadmap MVP → V2

### MVP (livré)
- [x] Landing page
- [x] Diagnostic IA (10 questions)
- [x] Recommandations Claude (3 niches)
- [x] Auth Supabase (magic link)
- [x] Dashboard
- [x] Plan 30 jours interactif

### V1.1
- [ ] Intégration Youcan API
- [ ] CRM clients complet
- [ ] Analytics réels (connexion GA4)
- [ ] Notifications WhatsApp (Twilio)

### V2
- [ ] PWA mobile (installable)
- [ ] Forum communauté
- [ ] Vidéos formation curatées
- [ ] Multi-boutiques
- [ ] Dashboard analytics avancé

---

## Support

**Simplify Group** · mounir@benproductions.ma

 

 
