/**
 * Routes admin légères — une fonction Vercel (limite Hobby : 12 fonctions max).
 */
require('../config/ensureJwtSecretEnv').ensureJwtSecretEnv();

const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken, ADMIN_COOKIE_NAME } = require('../server/middleware/auth');
const { writeAudit } = require('../includes/auditLog');
const { fetchAdminStats } = require('../includes/adminStats');
const { fetchAdminUniversitesList } = require('../includes/adminUniversitesList');
const { fetchAdminFilieresList, fetchAdminFilieresTree } = require('../includes/adminFilieresData');
const { fetchAdminInscriptionsList, fetchAdminRendezVousList } = require('../includes/adminLists');
const { readJsonBody, originalApiPath } = require('../includes/apiLite');
const { requireAdmin, clearAdminCookie } = require('../includes/apiAuthLite');

const isProd = process.env.NODE_ENV === 'production';

const LITE_GET_PATHS = new Set([
  '/api/admin/universites',
  '/api/admin/filieres',
  '/api/admin/filieres/tree',
  '/api/admin/inscriptions',
  '/api/admin/rendez-vous',
]);

let delegatePromise;

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

async function delegateToAdminApp(req, res) {
  if (!delegatePromise) {
    delegatePromise = Promise.resolve().then(() => require('./admin'));
  }
  const handler = await delegatePromise;
  const apiPath = originalApiPath(req);
  const url = new URL(req.url || '/', 'http://localhost');
  if (url.searchParams.has('__route')) {
    url.searchParams.delete('__route');
  }
  const qs = url.searchParams.toString();
  req.url = qs ? `${apiPath}?${qs}` : apiPath;
  return handler(req, res);
}

async function handleLogin(req, res) {
  try {
    const body = await readJsonBody(req);
    const email = String(body.email || '').trim();
    const password = String(body.password || '');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    if (password.length < 8 || password.length > 256) {
      return res.status(400).json({ error: 'Mot de passe invalide' });
    }

    const normalizedEmail = email.toLowerCase();
    const aliases = normalizedEmail === 'admin@schoolapp.com'
      ? ['admin@schoolapp.com', 'admin@shoolapp.com']
      : (normalizedEmail === 'admin@shoolapp.com'
        ? ['admin@shoolapp.com', 'admin@schoolapp.com']
        : [normalizedEmail]);
    const placeholders = aliases.map(() => '?').join(', ');
    const [rows] = await db.query(
      `SELECT id, email, password, nom FROM admins WHERE email IN (${placeholders}) ORDER BY id LIMIT 1`,
      aliases
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }
    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }
    const token = generateToken(admin);
    const cookie = `${ADMIN_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${12 * 60 * 60}${isProd ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', cookie);
    writeAudit('admin.login.success', { adminId: admin.id, email: admin.email, ip: getClientIp(req) });
    return res.status(200).json({ admin: { id: admin.id, email: admin.email, nom: admin.nom } });
  } catch (err) {
    console.error('[api/admin-lite] login', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleLogout(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  clearAdminCookie(res);
  writeAudit('admin.logout', { adminId: admin.id, ip: getClientIp(req) });
  return res.status(200).json({ message: 'Déconnecté.' });
}

async function handleMe(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const [rows] = await db.query('SELECT id, email, nom FROM admins WHERE id = ?', [admin.id]);
    if (!rows.length) return res.status(401).json({ error: 'Session invalide.' });
    return res.status(200).json({ admin: rows[0] });
  } catch (err) {
    console.error('[api/admin-lite] me', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleStats(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    return res.status(200).json(await fetchAdminStats());
  } catch (err) {
    console.error('[api/admin-lite] stats', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleReadList(req, res, path) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const query = Object.fromEntries(url.searchParams);
    if (path === '/api/admin/universites') {
      return res.status(200).json(await fetchAdminUniversitesList());
    }
    if (path === '/api/admin/filieres/tree') {
      return res.status(200).json(await fetchAdminFilieresTree());
    }
    if (path === '/api/admin/filieres') {
      return res.status(200).json(await fetchAdminFilieresList());
    }
    if (path === '/api/admin/inscriptions') {
      return res.status(200).json(await fetchAdminInscriptionsList(query));
    }
    if (path === '/api/admin/rendez-vous') {
      return res.status(200).json(await fetchAdminRendezVousList(query));
    }
    return res.status(404).json({ error: 'Route introuvable.' });
  } catch (err) {
    console.error('[api/admin-lite] read', path, err);
    if (String(err.message || '').includes('invalide')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

module.exports = async (req, res) => {
  const path = originalApiPath(req);

  if (path === '/api/admin/login' && req.method === 'POST') return handleLogin(req, res);
  if (path === '/api/admin/logout' && req.method === 'POST') return handleLogout(req, res);
  if (path === '/api/admin/me' && req.method === 'GET') return handleMe(req, res);
  if (path === '/api/admin/stats' && req.method === 'GET') return handleStats(req, res);
  if (LITE_GET_PATHS.has(path) && req.method === 'GET') return handleReadList(req, res, path);

  return delegateToAdminApp(req, res);
};
