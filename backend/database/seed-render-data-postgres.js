/**
 * Seed Neon/PostgreSQL — mêmes données que Render (seed-universites.js + référentiel).
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.neon.local node database/seed-render-data-postgres.js
 */
const path = require('path');

if (process.env.DOTENV_CONFIG_PATH) {
  require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH, override: true });
} else if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

const { Pool, neonConfig } = require('@neondatabase/serverless');
const { universites, filieresParUniversite } = require('../data/universites-seed');
const { campusesRowsForUniversite } = require('../data/campuses-seed');
const {
  computeNewSousFilieres,
  ensureReferentielSousFilieresAll,
} = require('../utils/filiereReferentielSync');

if (!process.env.VERCEL) {
  try {
    neonConfig.webSocketConstructor = require('ws');
  } catch {
    neonConfig.poolQueryViaFetch = true;
  }
}

const FILIERES_BASE = [
  ['Médecine', 'medecine'],
  ['Informatique', 'informatique'],
  ['Droit', 'droit'],
  ['Gestion', 'gestion'],
  ['Marketing', 'marketing'],
  ['Génie civil', 'genie-civil'],
  ['Finance', 'finance'],
  ['Communication', 'communication'],
  ['Architecture', 'architecture'],
  ['Psychologie', 'psychologie'],
];

function createDbAdapter(pool) {
  return {
    query(sql, params = []) {
      let i = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++i}`);
      return pool.query(pgSql, params).then((r) => [r.rows, r]);
    },
  };
}

async function run() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('DATABASE_URL ou POSTGRES_URL requis.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const db = createDbAdapter(pool);

  console.log('Filières de base...');
  for (const [nom, slug] of FILIERES_BASE) {
    await pool.query(
      `INSERT INTO filieres (nom, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING`,
      [nom, slug]
    );
  }

  console.log('Sous-filières (référentiel)...');
  const filRes = await pool.query('SELECT id, nom, slug, grand_groupe FROM filieres ORDER BY id');
  for (const f of filRes.rows) {
    const existing = await pool.query('SELECT slug, nom FROM sous_filieres WHERE filiere_id = $1', [f.id]);
    const { group, toInsert } = computeNewSousFilieres(f, existing.rows);
    if (group && f.grand_groupe !== group) {
      await pool.query('UPDATE filieres SET grand_groupe = $1 WHERE id = $2', [group, f.id]);
    }
    for (const row of toInsert) {
      await pool.query(
        `INSERT INTO sous_filieres (filiere_id, nom, slug) VALUES ($1, $2, $3)
         ON CONFLICT (filiere_id, slug) DO NOTHING`,
        [f.id, row.nom, row.slug]
      );
    }
  }

  console.log('Nettoyage données démo (universités, liaisons, inscriptions)...');
  await pool.query(`
    TRUNCATE TABLE
      universite_specialites_libelle,
      universite_sous_filieres,
      universite_filieres,
      universite_photos,
      campuses,
      inscriptions,
      rendez_vous,
      demandes_orientation,
      universites
    RESTART IDENTITY CASCADE
  `);

  console.log('Insertion des 22 universités (5 publiques + 17 MLA)...');
  const ids = [];
  for (const u of universites) {
    const r = await pool.query(
      `INSERT INTO universites (nom, type, ville, description, logo)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [u.nom, u.type, u.ville, u.description, u.logo ?? null]
    );
    ids.push(r.rows[0].id);
  }

  console.log('Liaison universités ↔ filières...');
  for (let i = 0; i < ids.length; i++) {
    const universiteId = ids[i];
    const filiereIds = filieresParUniversite[i + 1] || [1, 2];
    for (const fid of filiereIds) {
      await pool.query(
        `INSERT INTO universite_filieres (universite_id, filiere_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [universiteId, fid]
      );
    }
  }

  console.log('Insertion des campus...');
  const uniRows = await pool.query('SELECT id, nom, ville FROM universites ORDER BY id');
  for (const row of uniRows.rows) {
    const campusRows = campusesRowsForUniversite(row.nom, row.ville);
    for (const c of campusRows) {
      await pool.query(
        `INSERT INTO campuses (universite_id, nom, ville, adresse, latitude, longitude, ordre)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [row.id, c.nom, c.ville, c.adresse, c.latitude, c.longitude, c.ordre]
      );
    }
  }

  try {
    const sync = await ensureReferentielSousFilieresAll(db);
    console.log(`Référentiel → sous-filières : ${sync.sousFilieresAdded} ajoutée(s) sur ${sync.filieres} filière(s).`);
  } catch (e) {
    console.warn('Sync référentiel ignorée:', e.message || e);
  }

  const counts = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM filieres) AS filieres,
      (SELECT COUNT(*)::int FROM sous_filieres) AS sous_filieres,
      (SELECT COUNT(*)::int FROM universites) AS universites,
      (SELECT COUNT(*)::int FROM campuses) AS campuses,
      (SELECT COUNT(*)::int FROM universite_filieres) AS liaisons
  `);
  console.log('Résumé Neon:', counts.rows[0]);
  console.log('Terminé — données alignées sur Render (22 universités, campus, filières, référentiel).');

  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
