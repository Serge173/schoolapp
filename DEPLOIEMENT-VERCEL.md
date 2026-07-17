# Déploiement complet sur Vercel (frontend + API + Neon)

Ce guide décrit comment déployer **tout** FigsApp sur Vercel : interface React, API Express (serverless) et base PostgreSQL gratuite via **Neon** (intégration Vercel Storage).

## Architecture

```
vercel.app (même domaine)
├── /              → frontend React (fichiers statiques)
├── /api/*         → API Express (fonction serverless)
├── /uploads/*     → fichiers uploadés (stockage /tmp sur Vercel)
└── Neon Postgres  → base de données (DATABASE_URL)
```

## Prérequis

- Compte [Vercel](https://vercel.com)
- Repo GitHub du projet
- Node.js 18+ en local (pour les scripts de seed)

---

## Étape 1 — Pousser le code sur GitHub

À la racine du projet :

```bash
git add .
git commit -m "Configuration déploiement Vercel + Neon"
git push
```

---

## Étape 2 — Créer le projet Vercel

1. Allez sur [vercel.com/new](https://vercel.com/new)
2. Importez votre repo GitHub
3. **Root Directory** : laissez `.` (racine du repo, **pas** `frontend`)
4. Vercel détecte automatiquement `vercel.json` à la racine

---

## Étape 3 — Ajouter la base Neon (gratuite)

1. Dans le dashboard Vercel → votre projet → **Storage**
2. Cliquez **Create Database** → choisissez **Neon** (PostgreSQL)
3. Sélectionnez la région la plus proche (ex. `Frankfurt` pour l'Europe / l'Afrique de l'Ouest)
4. Plan **Free** (0 $/mois, 512 Mo)
5. Connectez la base au projet Vercel

Vercel injecte automatiquement :
- `DATABASE_URL`
- `POSTGRES_URL`

---

## Étape 4 — Variables d'environnement Vercel

Dans **Settings → Environment Variables**, ajoutez :

| Variable | Valeur | Obligatoire |
|----------|--------|-------------|
| `NODE_ENV` | `production` | Oui |
| `JWT_SECRET` | Chaîne longue aléatoire (32+ caractères) | Oui |
| `JWT_EXPIRES_IN` | `12h` | Non |
| `ADMIN_COOKIE_NAME` | `sa_admin` | Non |
| `CORS_ORIGIN` | `https://votre-app.vercel.app` | Recommandé |
| `JSON_BODY_LIMIT` | `200kb` | Non |

`DATABASE_URL` est déjà fourni par Neon — ne le modifiez pas.

**Notifications (optionnel)** : `SMTP_*`, `WHATSAPP_*`, `NOTIFY_TEAM_EMAILS`, etc.

> **Note** : le frontend appelle `/api` sur le même domaine. Vous n'avez **pas** besoin de `VITE_API_BASE` sur Vercel.

---

## Étape 5 — Premier déploiement

1. Cliquez **Deploy**
2. Attendez la fin du build (frontend + installation backend)
3. Le schéma PostgreSQL est créé **automatiquement** au premier appel API

---

## Étape 6 — Créer l'administrateur

En local, avec la `DATABASE_URL` Neon (copiez-la depuis Vercel → Storage → Neon → `.env.local`) :

```bash
cd backend
cp .env.example .env
# Collez DATABASE_URL=postgresql://... dans .env
npm install
node database/seed-admin-postgres.js
```

Identifiants par défaut :
- Email : `admin@shoolapp.com`
- Mot de passe : `admin123`

**Changez ce mot de passe après la première connexion.**

---

## Étape 7 — Vérification

1. Ouvrez `https://votre-app.vercel.app`
2. Testez `https://votre-app.vercel.app/api/health` → doit retourner `{"ok":true}`
3. Connectez-vous sur `https://votre-app.vercel.app/admin`

---

## Domaine personnalisé (optionnel)

1. Vercel → **Settings → Domains** → ajoutez votre domaine
2. Mettez à jour `CORS_ORIGIN` avec l'URL du domaine custom
3. Redéployez

---

## Limitations Vercel (à connaître)

| Élément | Comportement |
|---------|--------------|
| **Uploads** (logos, photos, brochures) | Stockés dans `/tmp` — **non persistants** entre redéploiements. Pour la production, utilisez [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) ou des URLs externes. |
| **Fonction serverless** | Timeout max 30 s (configuré dans `vercel.json`) |
| **Neon Free** | 512 Mo, mise en veille après inactivité (réveil ~1 s au premier appel) |

---

## Commandes utiles en local

```bash
# Backend avec SQLite (sans Neon)
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Initialiser le schéma Neon manuellement
cd backend && node database/ensurePostgresSchema.js

# Créer / mettre à jour l'admin Neon
cd backend && node database/seed-admin-postgres.js
```

---

## Dépannage

### `JWT_SECRET is required in production`
Ajoutez `JWT_SECRET` dans les variables Vercel et redéployez.

### Erreur base de données au démarrage
Vérifiez que Neon est bien connecté au projet et que `DATABASE_URL` est présent.

### Admin : cookie non enregistré
- Vérifiez `CORS_ORIGIN` = URL exacte du frontend (https, sans slash final)
- Le frontend et l'API doivent être sur le **même domaine** Vercel

### 404 sur `/api/...`
Vérifiez que le **Root Directory** Vercel est `.` (racine), pas `frontend`.

---

## Mises à jour

Chaque `git push` sur la branche connectée redéploie automatiquement frontend + API.

```bash
git add .
git commit -m "votre modification"
git push
```
