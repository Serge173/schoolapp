const crypto = require('crypto');
const { ensureJwtSecretEnv, getDatabaseUrl: getDatabaseUrlFromEnv } = require('./ensureJwtSecretEnv');

function isVercelRuntime() {
  return Boolean(
    process.env.VERCEL === '1' ||
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.VERCEL_URL
  );
}

function getDatabaseUrl() {
  return getDatabaseUrlFromEnv() || '';
}

function deriveJwtFromDatabaseUrl(dbUrl) {
  return crypto.createHash('sha256').update(`${dbUrl}:figsapp-jwt-v1`).digest('hex');
}

function getJwtSecret() {
  ensureJwtSecretEnv();
  const manual = (process.env.JWT_SECRET || '').trim();
  if (manual) return manual;
  const dbUrl = getDatabaseUrl();
  if (dbUrl) return deriveJwtFromDatabaseUrl(dbUrl);
  if (process.env.NODE_ENV !== 'production') {
    return 'secret-dev-change-in-production';
  }
  return null;
}

function assertJwtSecretConfigured() {
  ensureJwtSecretEnv();
  if (!getJwtSecret()) {
    throw new Error(
      'JWT_SECRET is required in production (ou DATABASE_URL Neon sur Vercel).'
    );
  }
}

module.exports = {
  getJwtSecret,
  assertJwtSecretConfigured,
  isVercelRuntime,
  getDatabaseUrl,
};
