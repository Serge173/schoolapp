'use strict';

const path = require('path');
const db = require('../config/db');
const { resolveLogoUrl } = require('./logoUrl');

async function fetchAdminUniversitesList() {
  const [rows] = await db.query(
    'SELECT id, nom, type, ville, description, logo, brochure FROM universites ORDER BY nom'
  );
  let ufRows = [];
  try {
    const [r] = await db.query(
      'SELECT universite_id, filiere_id, offre_filiere_entiere FROM universite_filieres'
    );
    ufRows = r || [];
  } catch (e) {
    const [r] = await db.query('SELECT universite_id, filiere_id FROM universite_filieres');
    ufRows = (r || []).map((row) => ({ ...row, offre_filiere_entiere: 1 }));
  }
  const filieresByUni = {};
  const filieresEntieresByUni = {};
  for (const row of ufRows || []) {
    const uid = Number(row.universite_id);
    const fid = Number(row.filiere_id);
    if (!Number.isInteger(uid) || !Number.isInteger(fid)) continue;
    if (!filieresByUni[uid]) filieresByUni[uid] = [];
    filieresByUni[uid].push(fid);
    const offreEntiere =
      row.offre_filiere_entiere === undefined || row.offre_filiere_entiere === null
        ? 1
        : Number(row.offre_filiere_entiere);
    if (offreEntiere === 1) {
      if (!filieresEntieresByUni[uid]) filieresEntieresByUni[uid] = [];
      filieresEntieresByUni[uid].push(fid);
    }
  }
  let sfRows = [];
  let slRows = [];
  try {
    const [a] = await db.query('SELECT universite_id, sous_filiere_id FROM universite_sous_filieres');
    sfRows = a || [];
  } catch {
    /* table absente */
  }
  try {
    const [b] = await db.query('SELECT universite_id, filiere_id, libelle FROM universite_specialites_libelle');
    slRows = b || [];
  } catch {
    /* table absente */
  }
  const sousByUni = {};
  for (const row of sfRows) {
    const uid = Number(row.universite_id);
    const sid = Number(row.sous_filiere_id);
    if (!Number.isInteger(uid) || !Number.isInteger(sid)) continue;
    if (!sousByUni[uid]) sousByUni[uid] = [];
    sousByUni[uid].push(sid);
  }
  const catByUni = {};
  for (const row of slRows) {
    const uid = Number(row.universite_id);
    const fid = Number(row.filiere_id);
    const libelle = String(row.libelle || '').trim();
    if (!Number.isInteger(uid) || !Number.isInteger(fid) || !libelle) continue;
    if (!catByUni[uid]) catByUni[uid] = [];
    catByUni[uid].push({ filiere_id: fid, libelle });
  }
  for (const u of rows) {
    const id = Number(u.id);
    u.filiere_ids = filieresByUni[id] ? [...filieresByUni[id]].sort((a, b) => a - b) : [];
    u.filieres_entieres = filieresEntieresByUni[id] ? [...filieresEntieresByUni[id]].sort((a, b) => a - b) : [];
    u.sous_filiere_ids = sousByUni[id] ? [...sousByUni[id]].sort((a, b) => a - b) : [];
    u.specialites_catalogue = catByUni[id] ? [...catByUni[id]] : [];
    if (u.logo) u.logoUrl = resolveLogoUrl(u.logo);
    if (u.brochure) u.brochureUrl = '/uploads/brochures/' + path.basename(u.brochure);
  }
  return rows;
}

module.exports = { fetchAdminUniversitesList };
