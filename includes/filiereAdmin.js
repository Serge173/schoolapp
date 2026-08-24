'use strict';

const db = require('../config/db');
const { writeAudit } = require('./auditLog');
const { clearFilieresCache } = require('./adminFilieresData');
const { ensureReferentielSousFilieres } = require('./filiereReferentielSync');
const { hasPermission, normalizeRole } = require('./adminRoles');

/** Aligné sur admin/src/data/filieresGroupsConfig.js (GROUPS). */
const FILIERE_GRANDS_GROUPES = [
  'Agri agro management',
  'Communication',
  'Comptabilite - gestion',
  'Design',
  'Environnement',
  'Finance',
  'Informatique',
  'Management',
  'Marketing',
  'Relations internationales',
  'Tourisme',
];

function slugify(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}

function parseGrandGroupeFromBody(value) {
  if (value === undefined) return { grand_groupe: undefined };
  if (value === null || String(value).trim() === '') return { grand_groupe: null };
  const s = String(value).trim();
  if (!FILIERE_GRANDS_GROUPES.includes(s)) return { error: 'Grand groupe invalide.' };
  return { grand_groupe: s };
}

function guardContent(actor) {
  if (!hasPermission(normalizeRole(actor?.role), 'content_manage')) {
    return { status: 403, body: { error: 'Votre rôle ne permet pas de modifier la configuration.' } };
  }
  return null;
}

function isDupError(err) {
  return (
    String(err.code || '').includes('ER_DUP_ENTRY') ||
    String(err.message || '').toLowerCase().includes('unique')
  );
}

async function syncReferentielSafe(filiereId) {
  try {
    const sync = await ensureReferentielSousFilieres(db, filiereId);
    return sync.added || 0;
  } catch (err) {
    console.error('[filiereAdmin] ensureReferentielSousFilieres', filiereId, err.message);
    return 0;
  }
}

async function createFiliere(body, actor) {
  const denied = guardContent(actor);
  if (denied) return denied;
  const nom = String(body?.nom || '').trim();
  if (nom.length < 2 || nom.length > 150) {
    return { status: 400, body: { error: 'Nom de filière invalide (2–150 caractères).' } };
  }
  const slug = slugify(nom);
  if (!slug) return { status: 400, body: { error: 'Nom de filière invalide.' } };
  const parsed = parseGrandGroupeFromBody(body?.grand_groupe);
  if (parsed.error) return { status: 400, body: { error: parsed.error } };
  const grandGroupe = parsed.grand_groupe === undefined ? null : parsed.grand_groupe;
  try {
    const [r] = await db.query(
      'INSERT INTO filieres (nom, slug, actif, grand_groupe) VALUES (?, ?, 1, ?)',
      [nom, slug, grandGroupe]
    );
    const filiereId = r.insertId;
    clearFilieresCache();
    writeAudit('admin.filiere.create', { adminId: actor?.id, filiereId });
    const referentielSousAdded = await syncReferentielSafe(filiereId);
    return {
      status: 201,
      body: {
        id: filiereId,
        nom,
        slug,
        actif: 1,
        grand_groupe: grandGroupe,
        referentiel_sous_added: referentielSousAdded,
      },
    };
  } catch (err) {
    if (isDupError(err)) return { status: 409, body: { error: 'Filière déjà existante.' } };
    throw err;
  }
}

async function updateFiliere(id, body, actor) {
  const denied = guardContent(actor);
  if (denied) return denied;
  if (!Number.isInteger(id) || id < 1) return { status: 400, body: { error: 'Identifiant invalide.' } };
  const nom = String(body?.nom || '').trim();
  if (nom.length < 2 || nom.length > 150) {
    return { status: 400, body: { error: 'Nom de filière invalide (2–150 caractères).' } };
  }
  const slug = slugify(nom);
  try {
    await db.query('UPDATE filieres SET nom = ?, slug = ? WHERE id = ?', [nom, slug, id]);
    clearFilieresCache();
    writeAudit('admin.filiere.update', { adminId: actor?.id, filiereId: id });
    return { status: 200, body: { id, nom, slug } };
  } catch (err) {
    if (isDupError(err)) return { status: 409, body: { error: 'Filière déjà existante.' } };
    throw err;
  }
}

async function setFiliereStatut(id, actif, actor) {
  const denied = guardContent(actor);
  if (denied) return denied;
  if (!Number.isInteger(id) || id < 1) return { status: 400, body: { error: 'Identifiant invalide.' } };
  const val = actif ? 1 : 0;
  await db.query('UPDATE filieres SET actif = ? WHERE id = ?', [val, id]);
  clearFilieresCache();
  writeAudit('admin.filiere.status', { adminId: actor?.id, filiereId: id, actif: val });
  return { status: 200, body: { id, actif: val } };
}

async function setFiliereGrandGroupe(id, body, actor) {
  const denied = guardContent(actor);
  if (denied) return denied;
  if (!Number.isInteger(id) || id < 1) return { status: 400, body: { error: 'Identifiant invalide.' } };
  const parsed = parseGrandGroupeFromBody(body?.grand_groupe);
  if (parsed.error) return { status: 400, body: { error: parsed.error } };
  const grandGroupe = parsed.grand_groupe === undefined ? null : parsed.grand_groupe;
  await db.query('UPDATE filieres SET grand_groupe = ? WHERE id = ?', [grandGroupe, id]);
  clearFilieresCache();
  writeAudit('admin.filiere.grand_groupe', { adminId: actor?.id, filiereId: id, grand_groupe: grandGroupe });
  const referentielSousAdded = await syncReferentielSafe(id);
  return {
    status: 200,
    body: { id, grand_groupe: grandGroupe, referentiel_sous_added: referentielSousAdded },
  };
}

async function deleteFiliere(id, actor) {
  const denied = guardContent(actor);
  if (denied) return denied;
  if (!Number.isInteger(id) || id < 1) return { status: 400, body: { error: 'Identifiant invalide.' } };
  await db.query('DELETE FROM filieres WHERE id = ?', [id]);
  clearFilieresCache();
  writeAudit('admin.filiere.delete', { adminId: actor?.id, filiereId: id });
  return { status: 200, body: { message: 'Filière supprimée.' } };
}

async function createSousFiliere(filiereId, body, actor) {
  const denied = guardContent(actor);
  if (denied) return denied;
  if (!Number.isInteger(filiereId) || filiereId < 1) {
    return { status: 400, body: { error: 'Identifiant filière invalide.' } };
  }
  const nom = String(body?.nom || '').trim();
  if (nom.length < 2 || nom.length > 150) {
    return { status: 400, body: { error: 'Nom invalide (2–150 caractères).' } };
  }
  const slug = slugify(nom);
  try {
    const [r] = await db.query(
      'INSERT INTO sous_filieres (filiere_id, nom, slug) VALUES (?, ?, ?)',
      [filiereId, nom, slug]
    );
    clearFilieresCache();
    writeAudit('admin.sous_filiere.create', { adminId: actor?.id, filiereId, sousFiliereId: r.insertId });
    return {
      status: 201,
      body: { id: r.insertId, filiere_id: filiereId, nom, slug },
    };
  } catch (err) {
    if (isDupError(err)) {
      return { status: 409, body: { error: 'Sous-filière déjà existante pour cette filière.' } };
    }
    throw err;
  }
}

async function updateSousFiliere(id, body, actor) {
  const denied = guardContent(actor);
  if (denied) return denied;
  if (!Number.isInteger(id) || id < 1) return { status: 400, body: { error: 'Identifiant invalide.' } };
  const nom = String(body?.nom || '').trim();
  if (nom.length < 2 || nom.length > 150) {
    return { status: 400, body: { error: 'Nom invalide (2–150 caractères).' } };
  }
  const slug = slugify(nom);
  try {
    await db.query('UPDATE sous_filieres SET nom = ?, slug = ? WHERE id = ?', [nom, slug, id]);
    clearFilieresCache();
    writeAudit('admin.sous_filiere.update', { adminId: actor?.id, sousFiliereId: id });
    return { status: 200, body: { id, nom, slug } };
  } catch (err) {
    if (isDupError(err)) {
      return { status: 409, body: { error: 'Sous-filière déjà existante pour cette filière.' } };
    }
    throw err;
  }
}

async function deleteSousFiliere(id, actor) {
  const denied = guardContent(actor);
  if (denied) return denied;
  if (!Number.isInteger(id) || id < 1) return { status: 400, body: { error: 'Identifiant invalide.' } };
  await db.query('DELETE FROM sous_filieres WHERE id = ?', [id]);
  clearFilieresCache();
  writeAudit('admin.sous_filiere.delete', { adminId: actor?.id, sousFiliereId: id });
  return { status: 200, body: { message: 'Sous-filière supprimée.' } };
}

module.exports = {
  FILIERE_GRANDS_GROUPES,
  slugify,
  parseGrandGroupeFromBody,
  createFiliere,
  updateFiliere,
  setFiliereStatut,
  setFiliereGrandGroupe,
  deleteFiliere,
  createSousFiliere,
  updateSousFiliere,
  deleteSousFiliere,
};
