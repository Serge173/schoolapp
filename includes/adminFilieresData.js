'use strict';

const db = require('../config/db');

async function fetchAdminFilieresList() {
  const [rows] = await db.query('SELECT id, nom, slug, actif, grand_groupe FROM filieres ORDER BY nom');
  return rows;
}

async function fetchAdminFilieresTree() {
  const [filRows] = await db.query('SELECT id, nom, slug, actif, grand_groupe FROM filieres ORDER BY nom');
  const [sousRows] = await db.query('SELECT id, filiere_id, nom, slug FROM sous_filieres ORDER BY nom');
  const grouped = sousRows.reduce((acc, row) => {
    if (!acc[row.filiere_id]) acc[row.filiere_id] = [];
    acc[row.filiere_id].push(row);
    return acc;
  }, {});
  return filRows.map((f) => ({ ...f, sous_filieres: grouped[f.id] || [] }));
}

module.exports = { fetchAdminFilieresList, fetchAdminFilieresTree };
