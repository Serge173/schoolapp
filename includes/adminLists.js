'use strict';

const db = require('../config/db');

async function fetchAdminInscriptionsList(query = {}) {
  let sql = `
    SELECT i.id, i.nom, i.prenom, i.date_naissance, i.sexe, i.telephone, i.email, i.ville,
           i.niveau_etude, i.serie_bac, i.annee_bac, i.filiere_id, i.filiere_autre,
           i.universite_id, i.type_universite, i.created_at,
           COALESCE(i.pays_bureau, 'CI') AS pays_bureau,
           COALESCE(f.nom, i.filiere_autre) AS filiere_nom,
           u.nom AS universite_nom, u.ville AS universite_ville
    FROM inscriptions i
    LEFT JOIN filieres f ON f.id = i.filiere_id
    JOIN universites u ON u.id = i.universite_id
    WHERE 1=1`;
  const params = [];
  if (query.type) {
    sql += ' AND i.type_universite = ?';
    params.push(query.type);
  }
  if (query.filiere_id) {
    sql += ' AND i.filiere_id = ?';
    params.push(query.filiere_id);
  }
  if (query.universite_id) {
    sql += ' AND i.universite_id = ?';
    params.push(query.universite_id);
  }
  if (query.pays_bureau) {
    sql += ' AND COALESCE(i.pays_bureau, \'CI\') = ?';
    params.push(query.pays_bureau);
  }
  if (query.date_debut) {
    sql += ' AND DATE(i.created_at) >= ?';
    params.push(query.date_debut);
  }
  if (query.date_fin) {
    sql += ' AND DATE(i.created_at) <= ?';
    params.push(query.date_fin);
  }
  sql += ' ORDER BY i.created_at DESC';
  const [rows] = await db.query(sql, params);
  return rows;
}

const RDV_STATUTS = ['nouveau', 'a_confirmer', 'confirme', 'annule', 'termine'];

async function fetchAdminRendezVousList(query = {}) {
  let sql = `SELECT id, nom, prenom, email, telephone, pays_bureau, type_rdv, date_souhaitee, creneau, message,
    statut, notes_internes, created_at, updated_at
    FROM rendez_vous WHERE 1=1`;
  const params = [];
  if (query.statut) {
    if (!RDV_STATUTS.includes(query.statut)) throw new Error('statut invalide');
    sql += ' AND statut = ?';
    params.push(query.statut);
  }
  if (query.pays_bureau) {
    if (!['CI', 'BF'].includes(query.pays_bureau)) throw new Error('pays_bureau invalide');
    sql += ' AND pays_bureau = ?';
    params.push(query.pays_bureau);
  }
  if (query.date_debut) {
    sql += ' AND DATE(created_at) >= ?';
    params.push(query.date_debut);
  }
  if (query.date_fin) {
    sql += ' AND DATE(created_at) <= ?';
    params.push(query.date_fin);
  }
  sql += ' ORDER BY (statut = \'nouveau\') DESC, created_at DESC';
  try {
    const [rows] = await db.query(sql, params);
    return rows;
  } catch (err) {
    if (
      String(err.message || '').includes('no such table') ||
      String(err.code) === 'ER_NO_SUCH_TABLE'
    ) {
      return [];
    }
    throw err;
  }
}

module.exports = { fetchAdminInscriptionsList, fetchAdminRendezVousList, RDV_STATUTS };
