# FigsApp-Côte d'Ivoire — Plateforme d'orientation et d'inscription universitaire

Plateforme web : filières, universités, inscription, catalogue FIGS, dashboard admin.

## Stack

- **Site + admin** : React, Vite (`admin/`)
- **API** : Express serverless (`api/`)
- **Base** : Neon PostgreSQL (Vercel Storage)

## Dev local

Voir la section **Installation locale** ci-dessous, puis [DEPLOIEMENT-VERCEL.md](./DEPLOIEMENT-VERCEL.md) pour la production.

## Prérequis

- Node.js **24.x**
- `config/.env` avec `DATABASE_URL` Neon

## Installation locale

### 1. Dépendances

```bash
npm install
```

### 2. Configuration

```bash
copy config\.env.example config\.env
```

Collez `DATABASE_URL` depuis Vercel → Storage → Neon.

### 3. Base de données

```bash
npm run setup:neon
```

### 4. Démarrer

```bash
scripts\start-dev.bat
```

| URL | |
|-----|---|
| Site | http://localhost:3001 |
| Admin | http://localhost:3001/admin |
| API | http://localhost:5000/api/health |

Identifiants : `admin@shoolapp.com` / `admin123`

### 5. Tests

```bash
npm run test:local
```

## Déploiement production (Vercel + Neon)

Guide complet : [DEPLOIEMENT-VERCEL.md](./DEPLOIEMENT-VERCEL.md)

1. Root Directory = `.` — Output = `admin/dist`
2. Storage → Neon (nouvelle base si besoin)
3. Variables : `JWT_SECRET`, `NODE_ENV`, `CORS_ORIGIN`
4. `npm run setup:neon` avec la nouvelle `DATABASE_URL`
5. `git push` + redeploy sans cache

**Pas de** `VITE_API_BASE` externe — tout passe par `/api` sur le même domaine.

## Utilisation

- **Candidat** : Filières → niveau → écoles → inscription
- **Admin** : `/admin` — inscriptions, universités, filières, RDV

## Structure

```
├── admin/          # React (site public + /admin)
├── api/            # Express + handlers Vercel
├── config/         # db, neon, jwt (.env)
├── database/       # schéma Postgres, seeds, figs-programmes.json
├── includes/       # libs partagées
├── public/         # images, favicon
├── scripts/        # dev, tests, seed
├── vercel.json
└── package.json
```

## Sécurité

- Validation express-validator
- JWT admin + cookies httpOnly
- Mots de passe bcrypt
