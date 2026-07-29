const crypto = require('crypto');

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  );
}

/** Dérive JWT_SECRET depuis Neon si absent ou vide (Vercel + ancien code déployé). */
function ensureJwtSecretEnv() {
  const manual = (process.env.JWT_SECRET || '').trim();
  if (manual) {
    process.env.JWT_SECRET = manual;
    return manual;
  }

  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return null;

  const derived = crypto.createHash('sha256').update(`${dbUrl}:figsapp-jwt-v1`).digest('hex');
  process.env.JWT_SECRET = derived;
  return derived;
}

module.exports = { ensureJwtSecretEnv, getDatabaseUrl };
