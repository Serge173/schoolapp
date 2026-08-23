'use strict';

const db = require('../config/db');

const CACHE_TTL_MS = 45_000;
let listCache = null;
let listCacheAt = 0;
let treeCache = null;
let treeCacheAt = 0;

async function fetchAdminFilieresList() {
  const now = Date.now();
  if (listCache && now - listCacheAt < CACHE_TTL_MS) {
    return listCache;
  }
  const [rows] = await db.query('SELECT id, nom, slug, actif, grand_groupe FROM filieres ORDER BY nom');
  listCache = rows;
  listCacheAt = now;
  return rows;
}

async function fetchAdminFilieresTree() {
  const now = Date.now();
  if (treeCache && now - treeCacheAt < CACHE_TTL_MS) {
    return treeCache;
  }
  const [filRows] = await db.query('SELECT id, nom, slug, actif, grand_groupe FROM filieres ORDER BY nom');
  const [sousRows] = await db.query('SELECT id, filiere_id, nom, slug FROM sous_filieres ORDER BY nom');
  const grouped = sousRows.reduce((acc, row) => {
    if (!acc[row.filiere_id]) acc[row.filiere_id] = [];
    acc[row.filiere_id].push(row);
    return acc;
  }, {});
  treeCache = filRows.map((f) => ({ ...f, sous_filieres: grouped[f.id] || [] }));
  treeCacheAt = now;
  return treeCache;
}

function clearFilieresCache() {
  listCache = null;
  listCacheAt = 0;
  treeCache = null;
  treeCacheAt = 0;
}

module.exports = { fetchAdminFilieresList, fetchAdminFilieresTree, clearFilieresCache };
