const crypto = require('crypto');

function isVercelRuntime() {
  return Boolean(
    process.env.VERCEL === '1' ||
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.VERCEL_URL
  );
}

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (dbUrl && isVercelRuntime()) {
    return crypto.createHash('sha256').update(`${dbUrl}:figsapp-jwt-v1`).digest('hex');
  }
  if (process.env.NODE_ENV !== 'production') {
    return 'secret-dev-change-in-production';
  }
  return null;
}

function assertJwtSecretConfigured() {
  if (!getJwtSecret()) {
    throw new Error(
      'JWT_SECRET is required in production (ou DATABASE_URL sur Vercel).'
    );
  }
}

module.exports = { getJwtSecret, assertJwtSecretConfigured, isVercelRuntime };
