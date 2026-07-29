const { ensureJwtSecretEnv } = require('../../backend/utils/ensureJwtSecretEnv');

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

module.exports = (_req, res) => {
  const jwtReady = hasJwtConfig();
  res.status(200).json({
    ok: true,
    jwt: jwtReady,
    env: process.env.NODE_ENV || process.env.VERCEL_ENV || null,
    vercel: Boolean(process.env.VERCEL || process.env.VERCEL_ENV),
    db: jwtReady && !(process.env.JWT_SECRET || '').trim(),
  });
};
