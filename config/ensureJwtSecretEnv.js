const crypto = require('crypto');

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  if (process.env.POSTGRES_PRISMA_URL) return process.env.POSTGRES_PRISMA_URL;
  if (process.env.POSTGRES_URL_NON_POOLING) return process.env.POSTGRES_URL_NON_POOLING;

  const host = process.env.PGHOST || process.env.POSTGRES_HOST;
  const user = process.env.PGUSER || process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const database = process.env.PGDATABASE || process.env.POSTGRES_DATABASE;
  if (host && user && password && database) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/${database}?sslmode=require`;
  }
  return '';
}

/** Dérive JWT_SECRET depuis Neon si absent ou vide (Vercel + ancien code déployé). */
function ensureJwtSecretEnv() {
  if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL;
  }
  const manual = (process.env.JWT_SECRET || '').trim();
  if (manual) {
    process.env.JWT_SECRET = manual;
    return manual;
  }

  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return null;

  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    console.warn('[jwt] JWT_SECRET absent — valeur dérivée de DATABASE_URL (définir JWT_SECRET explicite recommandé).');
  }

  const derived = crypto.createHash('sha256').update(`${dbUrl}:figsapp-jwt-v1`).digest('hex');
  process.env.JWT_SECRET = derived;
  return derived;
}

module.exports = { ensureJwtSecretEnv, getDatabaseUrl };
