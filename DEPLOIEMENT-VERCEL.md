# Déploiement Vercel + Neon (FigsApp)

Site React + API Express (serverless) + PostgreSQL Neon sur **un seul domaine**.  
Plus de backend séparé ni `VITE_API_BASE`.

## Architecture

```
figsappcotedivoire.com
├── /              → admin/dist (React)
├── /admin         → dashboard admin
├── /api/*         → fonctions serverless (api/)
└── Neon           → DATABASE_URL (Vercel Storage)
```

## Configuration Vercel (Settings → General)

| Paramètre | Valeur |
|-----------|--------|
| Root Directory | `.` (racine, **pas** `frontend`) |
| Framework Preset | **Other** |
| Node.js | **24.x** |
| Build Command | *(vide — `vercel.json`)* ou `npm run build` |
| Output Directory | `admin/dist` |
| Install Command | *(vide — `vercel.json`)* |

**Supprimez** `VITE_API_BASE` si elle existe (ancienne API externe).

---

## Nouvelle base Neon (recommandé)

1. Vercel → projet → **Storage**
2. Si une ancienne Neon est connectée : **Disconnect** (ou créez un nouveau projet Vercel)
3. **Create Database** → **Neon** → région proche → plan **Free**
4. **Connect to Project** — Custom Prefix : **vide**
5. Vérifiez dans **Environment Variables** : `DATABASE_URL`, `POSTGRES_URL`

---

## Variables d'environnement (Production)

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | chaîne aléatoire 32+ caractères |
| `JWT_EXPIRES_IN` | `12h` |
| `ADMIN_COOKIE_NAME` | `sa_admin` |
| `CORS_ORIGIN` | `https://figsappcotedivoire.com,https://www.figsappcotedivoire.com` |
| `JSON_BODY_LIMIT` | `200kb` |
| `DATABASE_URL` | fourni par Neon (ne pas modifier) |

---

## Initialiser la nouvelle base Neon

Copiez `DATABASE_URL` depuis Vercel → Storage → Neon dans `config/.env` :

```bash
npm install
npm run setup:neon
```

Crée le schéma, l'admin et les données de démo (universités, filières).

Identifiants admin :
- Email : `admin@shoolapp.com`
- Mot de passe : `admin123`

---

## Déployer

```bash
git push origin main
git checkout master && git merge main && git push origin master
```

Ou **Deployments → Redeploy** sans cache dans le dashboard Vercel.

Script local (CLI Vercel connectée) :

```powershell
scripts\setup-vercel-env.ps1
vercel --prod
```

---

## Vérification après déploiement

| URL | Résultat attendu |
|-----|------------------|
| `https://figsappcotedivoire.com/api/health` | `{"ok":true}` |
| `https://figsappcotedivoire.com/api/ping` | JSON avec `v`, `hasDatabaseUrl` |
| `https://figsappcotedivoire.com/api/programmes-figs` | JSON avec `programs` |
| `https://figsappcotedivoire.com/admin` | page login admin |

---

## Dépannage

### `JWT_SECRET is required in production`
Ajoutez `JWT_SECRET` ou connectez Neon (`DATABASE_URL`), puis redéployez **sans cache**.

### 500 sur `/api/programmes-figs`
Vérifiez que le déploiement utilise la **racine** du repo (commit récent avec `admin/dist`).

### Admin : cookie refusé
`CORS_ORIGIN` doit correspondre exactement au domaine (https, sans slash final).

### Uploads (logos)
Sur Vercel, fichiers dans `/tmp` — non persistants. Utilisez des URLs `/images/ecoles/...` ou Vercel Blob en production.

---

## Mises à jour

Chaque `git push` sur `main` / `master` redéploie le site + l'API **si** le projet Vercel lié au domaine est bien configuré.

### Le site live ne change pas après `git push`

Symptômes : `https://figsappcotedivoire.com` affiche encore un ancien CSS (`index-CFdguPtV.css`) ou un vieux logo.

**Cause fréquente** : le domaine `figsappcotedivoire.com` est rattaché au projet Vercel **`frontend`**, alors que les déploiements récents partent sur **`figsapp`**. Vérifiez dans GitHub → Actions → déploiements `Production – frontend` vs `Production – figsapp`.

**Correctif (2 min)** :

1. [vercel.com](https://vercel.com) → projet qui a le domaine **figsappcotedivoire.com** (souvent `frontend`)
2. **Deployments** → dernier commit sur `master` (ex. `77cfd08`)
3. **Redeploy** → **désactiver** « Use existing Build Cache »
4. Attendre 2 min, puis vérifier :
   - `npm run verify:prod` en local
   - ou `https://figsappcotedivoire.com/images/figsapp-logo.jpg` (~74 KB)

**Option durable** : Vercel → **figsapp** (monorepo actuel) → **Settings → Domains** → ajouter `figsappcotedivoire.com` et retirer l'ancien projet.

**Deploy Hook** (pour forcer chaque push) : Vercel → projet → Settings → Git → Deploy Hooks → créer un hook Production → copier l'URL dans le secret GitHub `VERCEL_DEPLOY_HOOK`.
