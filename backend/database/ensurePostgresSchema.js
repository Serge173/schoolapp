const fs = require('fs');
const path = require('path');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { getDbDriver } = require('../utils/dbDriver');

if (!process.env.VERCEL) {
  try {
    neonConfig.webSocketConstructor = require('ws');
  } catch {
    neonConfig.poolQueryViaFetch = true;
  }
}

async function ensurePostgresSchema() {
  const dotenvPath = process.env.DOTENV_CONFIG_PATH;
  if (dotenvPath) require('dotenv').config({ path: dotenvPath, override: true });

  if (getDbDriver() !== 'postgres') return;

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for PostgreSQL.');
  }

  const pool = new Pool({ connectionString });
  const schemaPath = path.join(__dirname, 'schema-postgres.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .map((s) => s.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n').trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (err) {
      if (!/already exists|duplicate/i.test(err.message)) {
        console.warn('[postgres-schema]', err.message);
      }
    }
  }

  await pool.end();
  console.log('[postgres-schema] Schéma vérifié.');
}

if (require.main === module) {
  ensurePostgresSchema()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { ensurePostgresSchema };
