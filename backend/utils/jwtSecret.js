const crypto = require('crypto');

function isVercelRuntime() {
  return Boolean(
    process.env.VERCEL === '1' ||
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.VERCEL_URL
  );
}

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  );
}

function deriveJwtFromDatabaseUrl(dbUrl) {
  return crypto.createHash('sha256').update(`${dbUrl}:figsapp-jwt-v1`).digest('hex');
}

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const dbUrl = getDatabaseUrl();
  if (dbUrl) return deriveJwtFromDatabaseUrl(dbUrl);
  if (process.env.NODE_ENV !== 'production') {
    return 'secret-dev-change-in-production';
  }
  return null;
}

function assertJwtSecretConfigured() {
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
