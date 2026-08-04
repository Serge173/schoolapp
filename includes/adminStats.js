'use strict';

const db = require('../config/db');

async function fetchAdminStats() {
  const [total] = await db.query('SELECT COUNT(*) AS total FROM inscriptions');
  const [byType] = await db.query(
    'SELECT type_universite AS type, COUNT(*) AS count FROM inscriptions GROUP BY type_universite'
  );
  const [byFiliere] = await db.query(
    `SELECT f.nom AS filiere, COUNT(i.id) AS count FROM filieres f
     LEFT JOIN inscriptions i ON i.filiere_id = f.id GROUP BY f.id ORDER BY count DESC`
  );
  const [byUniversite] = await db.query(
    `SELECT u.nom AS universite, u.type, COUNT(i.id) AS count FROM universites u
     LEFT JOIN inscriptions i ON i.universite_id = u.id GROUP BY u.id ORDER BY count DESC`
  );
  let byPaysBureau = { CI: 0, BF: 0 };
  try {
    const [byPays] = await db.query(
      'SELECT pays_bureau AS pays, COUNT(*) AS count FROM inscriptions GROUP BY pays_bureau'
    );
    byPaysBureau = byPays.reduce((acc, r) => ({ ...acc, [r.pays]: r.count }), { CI: 0, BF: 0 });
  } catch (e) {
    const msg = String(e.message || '');
    if (!msg.includes('no such column') && !msg.includes('Unknown column')) throw e;
  }
  let rendezVous = { total: 0, nouveau: 0, a_confirmer: 0, confirme: 0, annule: 0, termine: 0 };
  try {
    const [rvTotal] = await db.query('SELECT COUNT(*) AS n FROM rendez_vous');
    rendezVous.total = rvTotal[0]?.n ?? 0;
    const [rvBy] = await db.query('SELECT statut, COUNT(*) AS n FROM rendez_vous GROUP BY statut');
    for (const row of rvBy || []) {
      if (row.statut in rendezVous) rendezVous[row.statut] = row.n;
    }
  } catch (e) {
    const msg = String(e.message || '');
    if (!msg.includes('no such table') && !msg.includes("doesn't exist") && !msg.includes('Unknown table')) throw e;
  }
  let demandesOrientation = {
    total: 0,
    nouveau: 0,
    validee: 0,
    traitee: 0,
    annulee: 0,
  };
  try {
    const [dTotal] = await db.query('SELECT COUNT(*) AS n FROM demandes_orientation');
    demandesOrientation.total = dTotal[0]?.n ?? 0;
    const [dBy] = await db.query('SELECT statut, COUNT(*) AS n FROM demandes_orientation GROUP BY statut');
    for (const row of dBy || []) {
      if (row.statut in demandesOrientation) demandesOrientation[row.statut] = row.n;
    }
  } catch (e) {
    const msg = String(e.message || '');
    if (!msg.includes('no such table') && !msg.includes("doesn't exist") && !msg.includes('Unknown table')) throw e;
  }
  return {
    total: total[0].total,
    byType: byType.reduce((acc, r) => ({ ...acc, [r.type]: r.count }), { publique: 0, privee: 0 }),
    byPaysBureau,
    byFiliere,
    byUniversite,
    rendezVous,
    demandesOrientation,
  };
}

module.exports = { fetchAdminStats };
