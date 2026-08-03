# FigsApp-Côte d'Ivoire — Plateforme d'orientation et d'inscription universitaire

Plateforme web permettant aux candidats de découvrir les filières, consulter les universités (publiques/privées) et soumettre une demande d'inscription. L'administrateur peut gérer les demandes et les établissements.

## Stack technique

- **Admin / site public** : React 18, Vite (`admin/`)
- **API** : Node.js, Express (`api/`)
- **Base de données** : Neon PostgreSQL (prod + dev recommandé) ou SQLite (Node 20)

## Prérequis

- Node.js **20.x** (recommandé)
- `config/.env` avec `DATABASE_URL` Neon (copie depuis Vercel → Storage → Neon)

## Installation locale (étape par étape)

### 1. Dépendances

```bash
npm install
```

### 2. Configuration

```bash
copy config\.env.example config\.env
```

Éditez `config/.env` : collez votre `DATABASE_URL` Neon.

### 3. Base de données (Neon)

```bash
npm run setup:neon
```

Crée le schéma, l'admin (`admin@shoolapp.com` / `admin123`) et les données de démo (universités, filières).

### 4. Démarrer

```bash
scripts\start-dev.bat
```

Ou : `npm run dev`

| URL | |
|-----|---|
| Site | http://localhost:3001 |
| Admin | http://localhost:3001/admin |
| API | http://localhost:5000/api/health |

### 5. Vérifier que tout fonctionne

```bash
npm run test:local
```

Tous les tests doivent afficher **OK**.

> Si le port 3001 est occupé, fermez les anciens terminaux `npm run dev` puis relancez `scripts\start-dev.bat`.


## Deploiement complet sur Vercel (recommandé)

Frontend, API et base de données Neon (PostgreSQL gratuit) sur un seul projet Vercel.

**Guide détaillé :** voir [DEPLOIEMENT-VERCEL.md](./DEPLOIEMENT-VERCEL.md)

Résumé :
1. Importer le repo sur Vercel (racine `.`, pas `frontend`)
2. Storage → Create Database → **Neon** (plan Free)
3. Variables : `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN=https://votre-app.vercel.app`
4. Deploy → puis `npm run db:seed-admin` avec `DATABASE_URL` Neon dans `config/.env`

## Deploiement (Frontend Vercel + Backend Railway) — ancienne méthode

### 1) Backend sur Railway

1. Creer un projet Railway et connecter le repo GitHub.
2. Choisir le dossier racine du service: `backend`.
3. Railway detecte Node.js et lance `npm install` puis `npm start`.
4. Ajouter les variables d'environnement Railway:
   - `NODE_ENV=production`
   - `PORT=5000` (optionnel, Railway injecte deja `PORT`)
   - `JWT_SECRET=<secret-long-et-fort>`
   - `JWT_EXPIRES_IN=12h`
   - `ADMIN_COOKIE_NAME=sa_admin`
   - `CORS_ORIGIN=https://<ton-front>.vercel.app`
   - `JSON_BODY_LIMIT=200kb`
   - Variables DB (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, etc.)
   - Variables notification si utilisees (`SMTP_*`, `WHATSAPP_*`)
5. Deployer et verifier: `https://<ton-back>.up.railway.app/api/health` doit retourner `{ "ok": true }`.

### 2) Frontend sur Vercel

1. Creer un projet Vercel et connecter le meme repo.
2. Configurer:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Ajouter la variable d'environnement Vercel:
   - `VITE_API_BASE=https://<ton-back>.up.railway.app/api`
4. Deployer.

### 3) CORS et cookies admin (important)

- Le backend utilise des cookies pour la session admin.
- `CORS_ORIGIN` doit etre exactement l'URL du frontend Vercel (sans slash final).
- Exemple:
  - `https://figsapp-cote-divoire.vercel.app` (exemple : remplace par ton URL Vercel)
- Si tu utilises un domaine custom, ajoute ce domaine dans `CORS_ORIGIN`.

### 4) Redeploiement apres changement d'URL

- Si l'URL Vercel change, mets a jour `CORS_ORIGIN` sur Railway.
- Si l'URL Railway change, mets a jour `VITE_API_BASE` sur Vercel.
- Redeploie les deux services.

## Deploiement backend sur Render (alternative a Railway)

Le repo contient deja `render.yaml` a la racine.

### Etapes

1. Sur Render: **New +** -> **Blueprint**
2. Selectionne ton repo GitHub (ex. `TON-USER/figsapp-cote-divoire`)
3. Render lit `render.yaml` et cree le service `figsapp-cote-divoire-backend`
4. Dans Render, verifie/complete les variables:
   - `CORS_ORIGIN=https://frontend-six-psi-82.vercel.app`
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
5. Lance le deploy
6. Teste l'API: `https://<ton-backend-render>/api/health`

Puis sur Vercel, mets:

- `VITE_API_BASE=https://<ton-backend-render>/api`

## Guide GitHub pas a pas (push)

### Etape 1 - Verifier Git

```bash
git --version
```

### Etape 2 - Se placer a la racine

```bash
cd chemin/vers/figsapp-cote-divoire
```

### Etape 3 - Initialiser le depot

```bash
git init
```

### Etape 4 - Creer le fichier `.gitignore`

```gitignore
node_modules/
dist/
build/
*.log
.env
.env.*
backend/data/*.db
backend/data/*.sqlite*
backend/uploads/
frontend/.env
frontend/.env.*
backend/.env
backend/.env.*
```

### Etape 5 - Ajouter et committer

```bash
git add .
git commit -m "Initial FigsApp-Côte d'Ivoire setup"
```

### Etape 6 - Lier le repo distant et push

```bash
git remote add origin https://github.com/TON-USER/figsapp-cote-divoire.git
git branch -M main
git push -u origin main
```

## Push des prochaines modifications

```bash
git add .
git commit -m "message clair"
git push
```

## Utilisation

- **Candidat** : Accueil → Choisir Université privée ou publique → Filière → Liste des universités → Détail établissement → Bouton « S'inscrire » → Formulaire.
- **Admin** : Aller sur `/admin`, se connecter avec `admin@shoolapp.com` / `admin123`. Dashboard : statistiques, liste des inscriptions (filtres), gestion des universités (ajout, modification, suppression).

## Sécurité

- Validation des formulaires (express-validator)
- Authentification admin par JWT
- Routes admin protégées
- Mots de passe hashés (bcrypt)

## Structure des dossiers

```
figsapp-cote-divoire/
├── backend/          # API Express
│   ├── config/       # Connexion MySQL
│   ├── database/     # Schema SQL + seed admin
│   ├── middleware/   # Auth JWT, upload (multer)
│   └── routes/       # filieres, universites, inscriptions, admin
├── frontend/         # React + Vite
│   └── src/
│       ├── pages/    # Home, Filieres, Universites, Inscription, admin
│       └── api.js    # Client API
└── README.md
```
