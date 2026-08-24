'use strict';

const bcrypt = require('bcryptjs');
const { fetchAdminById, publicAdminRow } = require('./adminAccounts');
const { getDbDriver } = require('../config/dbDriver');
const db = require('../config/db');
const { writeAudit } = require('./auditLog');

function validatePasswordPair(password, passwordConfirm) {
  const p = String(password || '');
  const c = String(passwordConfirm || '');
  if (!p) return null;
  if (p.length < 8 || p.length > 256) return 'Mot de passe : 8 caractères minimum.';
  if (p !== c) return 'Les mots de passe ne correspondent pas.';
  return null;
}

function cleanStr(val, max) {
  const s = String(val || '').trim();
  if (!s) return null;
  return s.slice(0, max);
}

async function patchOwnProfile(adminId, body) {
  const existing = await fetchAdminById(adminId);
  if (!existing || Number(existing.actif) !== 1) {
    return { status: 401, body: { error: 'Session invalide.' } };
  }

  const b = body || {};
  const sets = [];
  const params = [];

  if (b.nom !== undefined) {
    const nom = String(b.nom).trim();
    if (!nom || nom.length > 100) return { status: 400, body: { error: 'Nom invalide.' } };
    sets.push('nom = ?');
    params.push(nom);
  }
  if (b.prenom !== undefined) {
    sets.push('prenom = ?');
    params.push(cleanStr(b.prenom, 100));
  }
  if (b.telephone !== undefined) {
    const tel = cleanStr(b.telephone, 20);
    if (tel && tel.length < 6) return { status: 400, body: { error: 'Téléphone invalide.' } };
    sets.push('telephone = ?');
    params.push(tel);
  }
  if (b.whatsapp !== undefined) {
    sets.push('whatsapp = ?');
    params.push(cleanStr(b.whatsapp, 20));
  }
  if (b.poste !== undefined) {
    sets.push('poste = ?');
    params.push(cleanStr(b.poste, 120));
  }
  if (b.pays_bureau !== undefined) {
    const pb = b.pays_bureau === null || String(b.pays_bureau).trim() === '' ? null : String(b.pays_bureau).trim();
    if (pb && !['CI', 'BF'].includes(pb)) return { status: 400, body: { error: 'Bureau invalide (CI ou BF).' } };
    sets.push('pays_bureau = ?');
    params.push(pb);
  }
  if (b.photo_url !== undefined) {
    const { isValidPhotoUrl } = require('./adminPhotoUrl');
    const photo = cleanStr(b.photo_url, 500);
    if (photo && !isValidPhotoUrl(photo)) {
      return { status: 400, body: { error: 'URL de photo invalide.' } };
    }
    sets.push('photo_url = ?');
    params.push(photo);
  }

  if (b.password !== undefined && String(b.password).trim()) {
    const pwdErr = validatePasswordPair(b.password, b.password_confirm);
    if (pwdErr) return { status: 400, body: { error: pwdErr } };
    const hash = await bcrypt.hash(String(b.password), 10);
    sets.push('password = ?');
    params.push(hash);
  }

  if (!sets.length) return { status: 400, body: { error: 'Rien à mettre à jour.' } };

  params.push(adminId);
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
  writeAudit('admin.profile.updated', { adminId });
  const row = await fetchAdminById(adminId);
  return { status: 200, body: { admin: publicAdminRow(row) } };
}

module.exports = { patchOwnProfile, validatePasswordPair };
