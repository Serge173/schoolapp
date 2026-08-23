'use strict';

require('../config/ensureJwtSecretEnv').ensureJwtSecretEnv();

const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken, ADMIN_COOKIE_NAME } = require('../server/middleware/auth');
const { writeAudit } = require('./auditLog');
const { fetchAdminStats } = require('./adminStats');
const { readJsonBody, originalApiPath } = require('./apiLite');
const { requireAdmin, clearAdminCookie } = require('./apiAuthLite');
const { getDbDriver } = require('../config/dbDriver');
const { RDV_STATUTS } = require('./adminLists');

const isProd = process.env.NODE_ENV === 'production';

const LITE_GET_PATHS = new Set([
  '/api/admin/universites',
  '/api/admin/filieres',
  '/api/admin/filieres/tree',
  '/api/admin/inscriptions',
  '/api/admin/rendez-vous',
]);

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
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
    console.error('[liteAdmin] login', err);
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
    console.error('[liteAdmin] me', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleStats(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    return res.status(200).json(await fetchAdminStats());
  } catch (err) {
    console.error('[liteAdmin] stats', err);
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
      const { fetchAdminUniversitesList } = require('./adminUniversitesList');
      return res.status(200).json(await fetchAdminUniversitesList());
    }
    if (path === '/api/admin/filieres/tree') {
      const { fetchAdminFilieresTree } = require('./adminFilieresData');
      return res.status(200).json(await fetchAdminFilieresTree());
    }
    if (path === '/api/admin/filieres') {
      const { fetchAdminFilieresList } = require('./adminFilieresData');
      return res.status(200).json(await fetchAdminFilieresList());
    }
    if (path === '/api/admin/inscriptions') {
      const { fetchAdminInscriptionsList } = require('./adminLists');
      return res.status(200).json(await fetchAdminInscriptionsList(query));
    }
    if (path === '/api/admin/rendez-vous') {
      const { fetchAdminRendezVousList } = require('./adminLists');
      return res.status(200).json(await fetchAdminRendezVousList(query));
    }
    return res.status(404).json({ error: 'Route introuvable.' });
  } catch (err) {
    console.error('[liteAdmin] read', path, err);
    if (String(err.message || '').includes('invalide')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleRdvPatch(req, res, id) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identifiant invalide.' });
  }
  try {
    const body = await readJsonBody(req);
    const { statut, notes_internes } = body || {};
    if (statut === undefined && notes_internes === undefined) {
      return res.status(400).json({ error: 'Rien à mettre à jour.' });
    }
    const sets = [];
    const params = [];
    if (statut !== undefined) {
      if (!RDV_STATUTS.includes(statut)) {
        return res.status(400).json({ error: 'Statut invalide.' });
      }
      sets.push('statut = ?');
      params.push(statut);
    }
    if (notes_internes !== undefined) {
      sets.push('notes_internes = ?');
      params.push(notes_internes);
    }
    params.push(id);
    const driver = getDbDriver();
    let finalSql;
    if (driver === 'sqlite') {
      finalSql = `UPDATE rendez_vous SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`;
    } else if (driver === 'postgres') {
      finalSql = `UPDATE rendez_vous SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    } else {
      finalSql = `UPDATE rendez_vous SET ${sets.join(', ')} WHERE id = ?`;
    }
    const [r] = await db.query(finalSql, params);
    const affected = r.affectedRows ?? r.changes ?? 0;
    if (!affected) return res.status(404).json({ error: 'Rendez-vous introuvable.' });
    writeAudit('rendez_vous.updated', { id, statut, adminId: admin.id });
    const [rows] = await db.query('SELECT * FROM rendez_vous WHERE id = ?', [id]);
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error('[liteAdmin] rdv patch', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

/** Retourne true si la route légère a été traitée. */
async function handleLiteAdmin(req, res) {
  const path = originalApiPath(req);

  const rdvPatchMatch = path.match(/^\/api\/admin\/rendez-vous\/(\d+)$/);
  if (rdvPatchMatch && req.method === 'PATCH') {
    await handleRdvPatch(req, res, Number(rdvPatchMatch[1]));
    return true;
  }

  if (path === '/api/admin/login' && req.method === 'POST') {
    await handleLogin(req, res);
    return true;
  }
  if (path === '/api/admin/logout' && req.method === 'POST') {
    await handleLogout(req, res);
    return true;
  }
  if (path === '/api/admin/me' && req.method === 'GET') {
    await handleMe(req, res);
    return true;
  }
  if (path === '/api/admin/stats' && req.method === 'GET') {
    await handleStats(req, res);
    return true;
  }
  if (LITE_GET_PATHS.has(path) && req.method === 'GET') {
    await handleReadList(req, res, path);
    return true;
  }
  return false;
}

module.exports = { handleLiteAdmin };
