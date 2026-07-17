#!/usr/bin/env node
/**
 * Déclenche un déploiement Render via l’API (sans coller de clé dans le chat).
 *
 * Prérequis (PowerShell, dans le dossier du projet) :
 *   $env:RENDER_API_KEY="rnd_..."   # Account → API Keys sur https://dashboard.render.com
 *   $env:RENDER_SERVICE_ID="srv-..."  # Onglet du service → Settings, ou URL du dashboard
 *   node scripts/render-deploy.mjs
 *
 * Ne commite jamais la clé. Ne la partage pas dans les messages.
 *
 * @see https://api-docs.render.com/reference/create-deploy
 */

const key = process.env.RENDER_API_KEY;
const serviceId = process.env.RENDER_SERVICE_ID;

if (!key || !serviceId) {
  console.error('Variables manquantes : RENDER_API_KEY et RENDER_SERVICE_ID');
  console.error('Crée une clé API : Render → Account Settings → API Keys.');
  console.error('Service ID : page du service web → souvent dans l’URL (srv-…) ou Settings.');
  process.exit(1);
}

const url = `https://api.render.com/v1/services/${serviceId}/deploys`;

const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({}),
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  json = text;
}

if (!res.ok) {
  console.error('Erreur', res.status, json);
  process.exit(1);
}

console.log('Déploiement déclenché :', json?.id || json);
console.log('Suivi : https://dashboard.render.com');
