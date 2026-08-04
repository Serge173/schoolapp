'use strict';

const fs = require('fs');
const path = require('path');
const { readJsonBody, originalApiPath } = require('./apiLite');
const { createInscription } = require('./createInscription');
const { createRendezVous } = require('./createRendezVous');
const { createDemandeOrientation } = require('./createDemandeOrientation');

const dataFile = process.env.VERCEL || process.env.VERCEL_ENV
  ? path.join('/tmp', 'figsapp-contact-messages.json')
  : path.join(__dirname, '..', 'server', 'routes', 'data', 'contact-messages.json');

async function handleContact(req, res) {
  try {
    const body = await readJsonBody(req);
    const allowed = ['nom', 'email', 'message'];
    const extra = Object.keys(body || {}).filter((k) => !allowed.includes(k));
    if (extra.length) {
      return res.status(400).json({ error: 'Champs non autorisés.' });
    }
    const nom = String(body.nom || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const message = String(body.message || '').trim();
    if (!nom || nom.length > 120) return res.status(400).json({ error: 'Le nom est requis' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    if (!message || message.length > 5000) {
      return res.status(400).json({ error: 'Le message est requis' });
    }

    const entry = { nom, email, message, created_at: new Date().toISOString() };
    let list = [];
    try {
      if (fs.existsSync(dataFile)) {
        list = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        if (!Array.isArray(list)) list = [];
      }
    } catch {
      list = [];
    }
    list.push(entry);
    const dataDir = path.dirname(dataFile);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(list, null, 2), 'utf8');
    return res.status(201).json({ message: 'Message envoyé.' });
  } catch (err) {
    console.error('[litePublic] contact', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleInscriptions(req, res) {
  try {
    const body = await readJsonBody(req);
    const result = await createInscription(body);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[litePublic] inscriptions', err);
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement.' });
  }
}

async function handleRendezVous(req, res) {
  try {
    const body = await readJsonBody(req);
    const result = await createRendezVous(body);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[litePublic] rendez-vous', err);
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement.' });
  }
}

async function handleDemandesOrientation(req, res) {
  try {
    const body = await readJsonBody(req);
    const result = await createDemandeOrientation(body);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[litePublic] demandes-orientation', err);
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement.' });
  }
}

/** Retourne true si la route publique POST a été traitée. */
async function handleLitePublic(req, res) {
  if (req.method !== 'POST') return false;

  const path = originalApiPath(req);

  if (path === '/api/contact') {
    await handleContact(req, res);
    return true;
  }
  if (path === '/api/inscriptions') {
    await handleInscriptions(req, res);
    return true;
  }
  if (path === '/api/rendez-vous') {
    await handleRendezVous(req, res);
    return true;
  }
  if (path === '/api/demandes-orientation') {
    await handleDemandesOrientation(req, res);
    return true;
  }
  return false;
}

module.exports = { handleLitePublic };
