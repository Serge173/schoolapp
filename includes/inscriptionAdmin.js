'use strict';

const db = require('../config/db');
const { getDbDriver } = require('../config/dbDriver');
const { ensureInscriptionsWorkflow } = require('../database/ensureInscriptionsWorkflow');
const { writeAudit } = require('./auditLog');
const { hasPermission, normalizeRole } = require('./adminRoles');

const INSCRIPTION_STATUTS = ['nouveau', 'en_cours', 'valide', 'refuse', 'archive'];

const INSCRIPTION_SELECT = `
  SELECT i.id, i.nom, i.prenom, i.date_naissance, i.sexe, i.telephone, i.email, i.ville,
         i.niveau_etude, i.serie_bac, i.annee_bac, i.filiere_id, i.filiere_autre,
         i.universite_id, i.type_universite, i.created_at,
         COALESCE(i.pays_bureau, 'CI') AS pays_bureau,
         COALESCE(i.contact, '') AS contact,
         COALESCE(i.contact_telephone, '') AS contact_telephone,
         COALESCE(i.statut, 'nouveau') AS statut,
         COALESCE(i.notes_internes, '') AS notes_internes,
         i.updated_at,
         COALESCE(f.nom, i.filiere_autre) AS filiere_nom,
         u.nom AS universite_nom, u.ville AS universite_ville
  FROM inscriptions i
  LEFT JOIN filieres f ON f.id = i.filiere_id
  JOIN universites u ON u.id = i.universite_id`;

function cleanQuery(query = {}) {
  const { cleanAdminQuery } = require('./apiLite');
  return cleanAdminQuery(query);
}

async function fetchInscriptionById(id) {
  await ensureInscriptionsWorkflow();
  const [rows] = await db.query(`${INSCRIPTION_SELECT} WHERE i.id = ?`, [id]);
  return rows[0] || null;
}

async function patchInscription(id, body, actor) {
  await ensureInscriptionsWorkflow();
  const actorRole = normalizeRole(actor?.role);
  if (!hasPermission(actorRole, 'dossiers_write')) {
    return { status: 403, body: { error: 'Votre rôle ne permet pas de modifier les dossiers.' } };
  }
  const existing = await fetchInscriptionById(id);
  if (!existing) return { status: 404, body: { error: 'Inscription introuvable.' } };

  const b = body || {};
  const allowed = [
    'nom', 'prenom', 'date_naissance', 'sexe', 'telephone', 'email', 'ville',
    'niveau_etude', 'serie_bac', 'annee_bac', 'filiere_id', 'filiere_autre',
    'universite_id', 'type_universite', 'pays_bureau', 'contact', 'contact_telephone',
    'statut', 'notes_internes',
  ];
  const extra = Object.keys(b).filter((k) => !allowed.includes(k));
  if (extra.length) return { status: 400, body: { error: 'Champs non autorisés.' } };

  const sets = [];
  const params = [];

  const setStr = (col, val) => {
    sets.push(`${col} = ?`);
    params.push(val);
  };

  if (b.nom !== undefined) {
    const v = String(b.nom).trim();
    if (!v || v.length > 100) return { status: 400, body: { error: 'Nom invalide.' } };
    setStr('nom', v);
  }
  if (b.prenom !== undefined) {
    const v = String(b.prenom).trim();
    if (!v || v.length > 100) return { status: 400, body: { error: 'Prénom invalide.' } };
    setStr('prenom', v);
  }
  if (b.date_naissance !== undefined) {
    const v = String(b.date_naissance).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return { status: 400, body: { error: 'Date de naissance invalide.' } };
    setStr('date_naissance', v);
  }
  if (b.sexe !== undefined) {
    if (!['M', 'F'].includes(b.sexe)) return { status: 400, body: { error: 'Sexe invalide.' } };
    setStr('sexe', b.sexe);
  }
  if (b.telephone !== undefined) {
    const v = String(b.telephone).trim();
    if (!v || v.length > 20) return { status: 400, body: { error: 'Téléphone invalide.' } };
    setStr('telephone', v);
  }
  if (b.email !== undefined) {
    const v = String(b.email).trim().toLowerCase();
    if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { status: 400, body: { error: 'Email invalide.' } };
    setStr('email', v);
  }
  if (b.ville !== undefined) {
    const v = String(b.ville).trim();
    if (!v || v.length > 100) return { status: 400, body: { error: 'Ville invalide.' } };
    setStr('ville', v);
  }
  if (b.niveau_etude !== undefined) setStr('niveau_etude', String(b.niveau_etude || '').trim().slice(0, 100) || null);
  if (b.serie_bac !== undefined) setStr('serie_bac', String(b.serie_bac || '').trim().slice(0, 50) || null);
  if (b.annee_bac !== undefined) setStr('annee_bac', String(b.annee_bac || '').trim().slice(0, 10) || null);
  if (b.filiere_id !== undefined) {
    const v = b.filiere_id === null || b.filiere_id === '' ? null : Number(b.filiere_id);
    if (v !== null && (!Number.isInteger(v) || v < 1)) return { status: 400, body: { error: 'Filière invalide.' } };
    setStr('filiere_id', v);
  }
  if (b.filiere_autre !== undefined) setStr('filiere_autre', String(b.filiere_autre || '').trim().slice(0, 150) || null);
  if (b.universite_id !== undefined) {
    const v = Number(b.universite_id);
    if (!Number.isInteger(v) || v < 1) return { status: 400, body: { error: 'Université invalide.' } };
    setStr('universite_id', v);
  }
  if (b.type_universite !== undefined) {
    if (!['publique', 'privee'].includes(b.type_universite)) return { status: 400, body: { error: 'Type université invalide.' } };
    setStr('type_universite', b.type_universite);
  }
  if (b.pays_bureau !== undefined) {
    if (!['CI', 'BF'].includes(b.pays_bureau)) return { status: 400, body: { error: 'Bureau invalide.' } };
    setStr('pays_bureau', b.pays_bureau);
  }
  if (b.contact !== undefined) setStr('contact', String(b.contact || '').trim().slice(0, 120) || null);
  if (b.contact_telephone !== undefined) setStr('contact_telephone', String(b.contact_telephone || '').trim().slice(0, 20) || null);
  if (b.statut !== undefined) {
    if (!INSCRIPTION_STATUTS.includes(b.statut)) return { status: 400, body: { error: 'Statut invalide.' } };
    setStr('statut', b.statut);
  }
  if (b.notes_internes !== undefined) setStr('notes_internes', String(b.notes_internes || '').slice(0, 8000) || null);

  if (!sets.length) return { status: 400, body: { error: 'Rien à mettre à jour.' } };

  params.push(id);
  const driver = getDbDriver();
  let sql;
  if (driver === 'sqlite') {
    sql = `UPDATE inscriptions SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`;
  } else if (driver === 'postgres') {
    sql = `UPDATE inscriptions SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  } else {
    sql = `UPDATE inscriptions SET ${sets.join(', ')} WHERE id = ?`;
  }
  await db.query(sql, params);
  writeAudit('inscription.updated', { id, adminId: actor?.id });
  const row = await fetchInscriptionById(id);
  return { status: 200, body: row };
}

module.exports = {
  INSCRIPTION_STATUTS,
  cleanQuery,
  fetchInscriptionById,
  patchInscription,
};
