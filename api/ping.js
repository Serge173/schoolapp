const { ensureJwtSecretEnv } = require('../config/ensureJwtSecretEnv');
const { pathnameOf } = require('../includes/apiLite');

function hasJwtConfig() {
  ensureJwtSecretEnv();
  const manual = (process.env.JWT_SECRET || '').trim();
  if (manual) return true;
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  return Boolean(dbUrl);
}

module.exports = (req, res) => {
  const path = pathnameOf(req);

  if (path === '/api/health') {
    const jwtReady = hasJwtConfig();
    return res.status(200).json({
      ok: true,
      jwt: jwtReady,
      env: process.env.NODE_ENV || process.env.VERCEL_ENV || null,
      vercel: Boolean(process.env.VERCEL || process.env.VERCEL_ENV),
      db: jwtReady && !(process.env.JWT_SECRET || '').trim(),
    });
  }

  res.status(200).json({
    v: 'fast-api-3',
    vercel: Boolean(process.env.VERCEL || process.env.VERCEL_ENV),
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasJwtSecret: Boolean((process.env.JWT_SECRET || '').trim()),
    nodeEnv: process.env.NODE_ENV || process.env.VERCEL_ENV || null,
  });
};
