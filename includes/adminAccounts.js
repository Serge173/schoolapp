'use strict';

const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { getDbDriver } = require('../config/dbDriver');
const { ensureAdminsRoles } = require('../database/ensureAdminsRoles');
const { ensureAdminProfile } = require('../database/ensureAdminProfile');
const { writeAudit } = require('./auditLog');
const {
  ADMIN_ROLES,
  normalizeRole,
  hasPermission,
  canAssignRole,
} = require('./adminRoles');

const ADMIN_SELECT = `
  SELECT id, email, nom,
         COALESCE(prenom, '') AS prenom,
         COALESCE(telephone, '') AS telephone,
         COALESCE(whatsapp, '') AS whatsapp,
         COALESCE(poste, '') AS poste,
         COALESCE(pays_bureau, '') AS pays_bureau,
         COALESCE(photo_url, '') AS photo_url,
         COALESCE(role, 'admin') AS role,
         COALESCE(actif, 1) AS actif,
         created_at, updated_at
  FROM admins`;

async function ensureAdminSchema() {
  await ensureAdminsRoles();
  await ensureAdminProfile();
}
  const [rows] = await db.query(`${ADMIN_SELECT} WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function listAdminAccounts() {
  await ensureAdminSchema();
  const [rows] = await db.query(`${ADMIN_SELECT} ORDER BY nom, email`);
  return rows.map(publicAdminRow);
}

function publicAdminRow(row) {
  return {
    id: row.id,
    email: row.email,
    nom: row.nom,
    prenom: row.prenom || '',
    telephone: row.telephone || '',
    whatsapp: row.whatsapp || '',
    poste: row.poste || '',
    pays_bureau: row.pays_bureau || '',
    photo_url: row.photo_url || '',
    role: normalizeRole(row.role),
    actif: Number(row.actif) === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function createAdminAccount(body, actor) {
  await ensureAdminSchema();
  const { validatePasswordPair } = require('./adminProfile');
  const actorRole = normalizeRole(actor?.role);
  if (!hasPermission(actorRole, 'accounts_manage')) {
    return { status: 403, body: { error: 'Seul un super administrateur peut créer des comptes.' } };
  }

  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const pwdErr = validatePasswordPair(password, body?.password_confirm);
  if (pwdErr) return { status: 400, body: { error: pwdErr } };
  const nom = String(body?.nom || '').trim();
  const prenom = String(body?.prenom || '').trim().slice(0, 100) || null;
  const telephone = String(body?.telephone || '').trim().slice(0, 20) || null;
  const whatsapp = String(body?.whatsapp || '').trim().slice(0, 20) || null;
  const poste = String(body?.poste || '').trim().slice(0, 120) || null;
  const paysBureau = body?.pays_bureau && ['CI', 'BF'].includes(body.pays_bureau) ? body.pays_bureau : null;
  const role = normalizeRole(body?.role || 'conseiller');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 400, body: { error: 'Email invalide.' } };
  }
  if (!nom || nom.length > 100) {
    return { status: 400, body: { error: 'Nom requis.' } };
  }
  if (!canAssignRole(actorRole, role)) {
    return { status: 403, body: { error: 'Vous ne pouvez pas attribuer ce rôle.' } };
  }

  const [existing] = await db.query('SELECT id FROM admins WHERE email = ?', [email]);
  if (existing.length) return { status: 409, body: { error: 'Cet email est déjà utilisé.' } };

  const hash = await bcrypt.hash(password, 10);
  const [r] = await db.query(
    `INSERT INTO admins (email, password, nom, prenom, telephone, whatsapp, poste, pays_bureau, role, actif)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [email, hash, nom, prenom, telephone, whatsapp, poste, paysBureau, role]
  );
  const id = r.insertId;
  writeAudit('admin.account.created', { by: actor.id, email, role });
  return { status: 201, body: { id, email, nom, role, actif: true } };
}

async function patchAdminAccount(id, body, actor) {
  await ensureAdminSchema();
  const { validatePasswordPair } = require('./adminProfile');
  const actorRole = normalizeRole(actor?.role);
  if (!hasPermission(actorRole, 'accounts_manage')) {
    return { status: 403, body: { error: 'Seul un super administrateur peut modifier les comptes.' } };
  }
  if (!Number.isInteger(id) || id < 1) {
    return { status: 400, body: { error: 'Identifiant invalide.' } };
  }

  const target = await fetchAdminById(id);
  if (!target) return { status: 404, body: { error: 'Compte introuvable.' } };

  const b = body || {};
  const sets = [];
  const params = [];

  if (b.nom !== undefined) {
    const nom = String(b.nom).trim();
    if (!nom || nom.length > 100) return { status: 400, body: { error: 'Nom invalide.' } };
    sets.push('nom = ?');
    params.push(nom);
  }

  if (b.role !== undefined) {
    const role = normalizeRole(b.role);
    if (!canAssignRole(actorRole, role)) {
      return { status: 403, body: { error: 'Vous ne pouvez pas attribuer ce rôle.' } };
    }
    if (Number(actor.id) === id && role !== 'super_admin' && normalizeRole(target.role) === 'super_admin') {
      const [supers] = await db.query(
        'SELECT COUNT(*) AS n FROM admins WHERE role = \'super_admin\' AND COALESCE(actif, 1) = 1 AND id != ?',
        [id]
      );
      const otherSupers = Number(supers[0]?.n ?? 0);
      if (otherSupers === 0) {
        return { status: 400, body: { error: 'Il doit rester au moins un super administrateur actif.' } };
      }
    }
    sets.push('role = ?');
    params.push(role);
  }

  if (b.actif !== undefined) {
    const actif = b.actif === true || b.actif === 1 || b.actif === '1' ? 1 : 0;
    if (Number(actor.id) === id && actif === 0) {
      return { status: 400, body: { error: 'Vous ne pouvez pas désactiver votre propre compte.' } };
    }
    if (actif === 0 && normalizeRole(target.role) === 'super_admin') {
      const [supers] = await db.query(
        'SELECT COUNT(*) AS n FROM admins WHERE role = \'super_admin\' AND COALESCE(actif, 1) = 1 AND id != ?',
        [id]
      );
      if (Number(supers[0]?.n ?? 0) === 0) {
        return { status: 400, body: { error: 'Il doit rester au moins un super administrateur actif.' } };
      }
    }
    sets.push('actif = ?');
    params.push(actif);
  }

  if (b.prenom !== undefined) {
    sets.push('prenom = ?');
    params.push(String(b.prenom || '').trim().slice(0, 100) || null);
  }
  if (b.telephone !== undefined) {
    sets.push('telephone = ?');
    params.push(String(b.telephone || '').trim().slice(0, 20) || null);
  }
  if (b.whatsapp !== undefined) {
    sets.push('whatsapp = ?');
    params.push(String(b.whatsapp || '').trim().slice(0, 20) || null);
  }
  if (b.poste !== undefined) {
    sets.push('poste = ?');
    params.push(String(b.poste || '').trim().slice(0, 120) || null);
  }
  if (b.pays_bureau !== undefined) {
    const pb = b.pays_bureau === null || String(b.pays_bureau).trim() === '' ? null : String(b.pays_bureau).trim();
    if (pb && !['CI', 'BF'].includes(pb)) return { status: 400, body: { error: 'Bureau invalide.' } };
    sets.push('pays_bureau = ?');
    params.push(pb);
  }

  if (b.password !== undefined) {
    const password = String(b.password || '');
    if (password) {
      const pwdErr = validatePasswordPair(password, b.password_confirm);
      if (pwdErr) return { status: 400, body: { error: pwdErr } };
      const hash = await bcrypt.hash(password, 10);
      sets.push('password = ?');
      params.push(hash);
    }
  }

  if (!sets.length) return { status: 400, body: { error: 'Rien à mettre à jour.' } };

  params.push(id);
  const driver = getDbDriver();
  let sql;
  if (driver === 'sqlite') {
    sql = `UPDATE admins SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`;
  } else if (driver === 'postgres') {
    sql = `UPDATE admins SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  } else {
    sql = `UPDATE admins SET ${sets.join(', ')} WHERE id = ?`;
  }
  await db.query(sql, params);
  writeAudit('admin.account.updated', { by: actor.id, targetId: id });
  const row = await fetchAdminById(id);
  return { status: 200, body: publicAdminRow(row) };
}

module.exports = {
  fetchAdminById,
  listAdminAccounts,
  createAdminAccount,
  patchAdminAccount,
  publicAdminRow,
};
