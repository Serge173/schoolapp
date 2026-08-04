/**
 * POST /api/contact — handler léger (sans boot Express).
 */
const fs = require('fs');
const path = require('path');
const { readJsonBody } = require('./_lite');

const dataFile = process.env.VERCEL || process.env.VERCEL_ENV
  ? path.join('/tmp', 'figsapp-contact-messages.json')
  : path.join(__dirname, '..', 'server', 'routes', 'data', 'contact-messages.json');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
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
    console.error('[api/contact-post]', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};
