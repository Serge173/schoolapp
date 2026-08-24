'use strict';

require('../config/ensureJwtSecretEnv').ensureJwtSecretEnv();

const db = require('../config/db');
const { readJsonBody, originalApiPath, cleanAdminQuery } = require('./apiLite');
const { requireAdmin, clearAdminCookie } = require('./apiAuthLite');

const isProd = process.env.NODE_ENV === 'production';

const LITE_GET_PATHS = new Set([
  '/api/admin/universites',
  '/api/admin/filieres',
  '/api/admin/filieres/tree',
  '/api/admin/inscriptions',
  '/api/admin/rendez-vous',
  '/api/admin/comptes',
]);

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

async function handleLogin(req, res) {
  try {
    const { allowRequest, rateLimitMessage, LOGIN_MAX, DEFAULT_WINDOW_MS } = require('./loginRateLimit');
    if (!allowRequest(`login:${getClientIp(req)}`, LOGIN_MAX, DEFAULT_WINDOW_MS)) {
      return res.status(429).json(rateLimitMessage('Trop de tentatives de connexion. Réessayez plus tard.'));
    }
    const bcrypt = require('bcryptjs');
    const { generateToken, ADMIN_COOKIE_NAME } = require('../server/middleware/auth');
    const { writeAudit } = require('./auditLog');
    const { ensureAdminsRoles } = require('../database/ensureAdminsRoles');
    const { fetchAdminById, publicAdminRow } = require('./adminAccounts');
    await ensureAdminsRoles();
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
      `SELECT id, email, password, nom, COALESCE(role, 'admin') AS role, COALESCE(actif, 1) AS actif
       FROM admins WHERE email IN (${placeholders}) ORDER BY id LIMIT 1`,
      aliases
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }
    const admin = rows[0];
    if (Number(admin.actif) !== 1) {
      return res.status(403).json({ error: 'Ce compte est désactivé. Contactez un super administrateur.' });
    }
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }
    const token = generateToken(admin);
    const cookie = `${ADMIN_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${12 * 60 * 60}${isProd ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', cookie);
    writeAudit('admin.login.success', { adminId: admin.id, email: admin.email, ip: getClientIp(req) });
    const full = await fetchAdminById(admin.id);
    return res.status(200).json({ admin: publicAdminRow(full || admin) });
  } catch (err) {
    console.error('[liteAdmin] login', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleLogout(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const { writeAudit } = require('./auditLog');
  clearAdminCookie(res);
  writeAudit('admin.logout', { adminId: admin.id, ip: getClientIp(req) });
  return res.status(200).json({ message: 'Déconnecté.' });
}

async function handleMe(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const { fetchAdminById, publicAdminRow } = require('./adminAccounts');
    const row = await fetchAdminById(admin.id);
    if (!row || Number(row.actif) !== 1) return res.status(401).json({ error: 'Session invalide.' });
    return res.status(200).json({ admin: publicAdminRow(row) });
  } catch (err) {
    console.error('[liteAdmin] me', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleMePatch(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const { patchOwnProfile } = require('./adminProfile');
    const body = await readJsonBody(req);
    const result = await patchOwnProfile(admin.id, body);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[liteAdmin] me patch', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleStats(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const { checkPermission, forbidden } = require('./adminPermissions');
  if (!checkPermission(admin.role, 'dossiers_read')) {
    return forbidden(res);
  }
  try {
    const { fetchAdminStats } = require('./adminStats');
    return res.status(200).json(await fetchAdminStats());
  } catch (err) {
    console.error('[liteAdmin] stats', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleReadList(req, res, path) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const { checkPermission, forbidden } = require('./adminPermissions');
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const query = cleanAdminQuery(Object.fromEntries(url.searchParams));
    if (path === '/api/admin/comptes') {
      if (!checkPermission(admin.role, 'accounts_manage')) {
        return forbidden(res, 'Seul un super administrateur peut gérer les comptes.');
      }
      const { listAdminAccounts } = require('./adminAccounts');
      return res.status(200).json(await listAdminAccounts());
    }
    if (!checkPermission(admin.role, 'dossiers_read')) {
      return forbidden(res);
    }
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

async function handleInscriptionGet(req, res, id) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identifiant invalide.' });
  }
  try {
    const { fetchInscriptionById } = require('./inscriptionAdmin');
    const row = await fetchInscriptionById(id);
    if (!row) return res.status(404).json({ error: 'Inscription introuvable.' });
    return res.status(200).json(row);
  } catch (err) {
    console.error('[liteAdmin] inscription get', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleInscriptionPatch(req, res, id) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identifiant invalide.' });
  }
  try {
    const { patchInscription } = require('./inscriptionAdmin');
    const body = await readJsonBody(req);
    const result = await patchInscription(id, body, admin);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[liteAdmin] inscription patch', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleComptesPost(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const { createAdminAccount } = require('./adminAccounts');
    const body = await readJsonBody(req);
    const result = await createAdminAccount(body, admin);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[liteAdmin] comptes post', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleComptesPatch(req, res, id) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identifiant invalide.' });
  }
  try {
    const { patchAdminAccount } = require('./adminAccounts');
    const body = await readJsonBody(req);
    const result = await patchAdminAccount(id, body, admin);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[liteAdmin] comptes patch', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleRdvPatch(req, res, id) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const { patchRendezVous } = require('./rdvAdmin');
    const body = await readJsonBody(req);
    const result = await patchRendezVous(id, body, admin);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[liteAdmin] rdv patch', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleRdvDelete(req, res, id) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const { deleteRendezVous } = require('./rdvAdmin');
    const result = await deleteRendezVous(id, admin);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[liteAdmin] rdv delete', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handleFiliereMutation(req, res, handler) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const body = req.method === 'GET' || req.method === 'DELETE' ? {} : await readJsonBody(req);
    const result = await handler(body, admin);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[liteAdmin] filiere', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

/** Retourne true si la route légère a été traitée. */
async function handleLiteAdmin(req, res) {
  const { applySecurityHeaders } = require('./securityHeaders');
  applySecurityHeaders(res);
  const path = originalApiPath(req);

  if (path === '/api/admin/filieres' && req.method === 'POST') {
    const { createFiliere } = require('./filiereAdmin');
    await handleFiliereMutation(req, res, (body, admin) => createFiliere(body, admin));
    return true;
  }

  const filStatutMatch = path.match(/^\/api\/admin\/filieres\/(\d+)\/statut$/);
  if (filStatutMatch && req.method === 'PATCH') {
    const id = Number(filStatutMatch[1]);
    const { setFiliereStatut } = require('./filiereAdmin');
    await handleFiliereMutation(req, res, (body, admin) => setFiliereStatut(id, Boolean(body.actif), admin));
    return true;
  }

  const filGrandMatch = path.match(/^\/api\/admin\/filieres\/(\d+)\/grand-groupe$/);
  if (filGrandMatch && req.method === 'PATCH') {
    const id = Number(filGrandMatch[1]);
    const { setFiliereGrandGroupe } = require('./filiereAdmin');
    await handleFiliereMutation(req, res, (body, admin) => setFiliereGrandGroupe(id, body, admin));
    return true;
  }

  const filSousPostMatch = path.match(/^\/api\/admin\/filieres\/(\d+)\/sous-filieres$/);
  if (filSousPostMatch && req.method === 'POST') {
    const filiereId = Number(filSousPostMatch[1]);
    const { createSousFiliere } = require('./filiereAdmin');
    await handleFiliereMutation(req, res, (body, admin) => createSousFiliere(filiereId, body, admin));
    return true;
  }

  const filPutMatch = path.match(/^\/api\/admin\/filieres\/(\d+)$/);
  if (filPutMatch && req.method === 'PUT') {
    const id = Number(filPutMatch[1]);
    const { updateFiliere } = require('./filiereAdmin');
    await handleFiliereMutation(req, res, (body, admin) => updateFiliere(id, body, admin));
    return true;
  }
  if (filPutMatch && req.method === 'DELETE') {
    const id = Number(filPutMatch[1]);
    const { deleteFiliere } = require('./filiereAdmin');
    await handleFiliereMutation(req, res, (body, admin) => deleteFiliere(id, admin));
    return true;
  }

  const sousPutMatch = path.match(/^\/api\/admin\/sous-filieres\/(\d+)$/);
  if (sousPutMatch && req.method === 'PUT') {
    const id = Number(sousPutMatch[1]);
    const { updateSousFiliere } = require('./filiereAdmin');
    await handleFiliereMutation(req, res, (body, admin) => updateSousFiliere(id, body, admin));
    return true;
  }
  if (sousPutMatch && req.method === 'DELETE') {
    const id = Number(sousPutMatch[1]);
    const { deleteSousFiliere } = require('./filiereAdmin');
    await handleFiliereMutation(req, res, (body, admin) => deleteSousFiliere(id, admin));
    return true;
  }

  const rdvPatchMatch = path.match(/^\/api\/admin\/rendez-vous\/(\d+)$/);
  if (rdvPatchMatch && req.method === 'PATCH') {
    await handleRdvPatch(req, res, Number(rdvPatchMatch[1]));
    return true;
  }
  const rdvDeleteMatch = path.match(/^\/api\/admin\/rendez-vous\/(\d+)$/);
  if (rdvDeleteMatch && req.method === 'DELETE') {
    await handleRdvDelete(req, res, Number(rdvDeleteMatch[1]));
    return true;
  }

  const insGetMatch = path.match(/^\/api\/admin\/inscriptions\/(\d+)$/);
  if (insGetMatch && req.method === 'GET') {
    await handleInscriptionGet(req, res, Number(insGetMatch[1]));
    return true;
  }
  const insPatchMatch = path.match(/^\/api\/admin\/inscriptions\/(\d+)$/);
  if (insPatchMatch && req.method === 'PATCH') {
    await handleInscriptionPatch(req, res, Number(insPatchMatch[1]));
    return true;
  }

  if (path === '/api/admin/comptes' && req.method === 'POST') {
    await handleComptesPost(req, res);
    return true;
  }

  const comptesPatchMatch = path.match(/^\/api\/admin\/comptes\/(\d+)$/);
  if (comptesPatchMatch && req.method === 'PATCH') {
    await handleComptesPatch(req, res, Number(comptesPatchMatch[1]));
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
  if (path === '/api/admin/me' && req.method === 'PATCH') {
    await handleMePatch(req, res);
    return true;
  }
  if (path === '/api/admin/stats' && req.method === 'GET') {
    await handleStats(req, res);
    return true;
  }
  if (path === '/api/admin/comptes/meta' && req.method === 'GET') {
    const admin = requireAdmin(req, res);
    if (!admin) return true;
    const { checkPermission, forbidden } = require('./adminPermissions');
    if (!checkPermission(admin.role, 'accounts_manage')) {
      forbidden(res, 'Seul un super administrateur peut gérer les comptes.');
      return true;
    }
    const { ADMIN_ROLES, ADMIN_ROLE_LABELS, ADMIN_ROLE_DESCRIPTIONS } = require('./adminRoles');
    res.status(200).json({ roles: ADMIN_ROLES, labels: ADMIN_ROLE_LABELS, descriptions: ADMIN_ROLE_DESCRIPTIONS });
    return true;
  }
  if (LITE_GET_PATHS.has(path) && req.method === 'GET') {
    await handleReadList(req, res, path);
    return true;
  }
  return false;
}

module.exports = { handleLiteAdmin };
