const { ensureJwtSecretEnv } = require('../config/ensureJwtSecretEnv');
const { pathnameOf } = require('../includes/apiLite');
const { applySecurityHeaders } = require('../includes/securityHeaders');

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
  applySecurityHeaders(res);
  const path = pathnameOf(req);

  if (path === '/api/health') {
    const ready = hasJwtConfig();
    return res.status(200).json({ ok: true, ready });
  }

  const ready = hasJwtConfig();
  res.status(200).json({
    ok: true,
    v: 'fast-api-7',
    ready,
    vercel: Boolean(process.env.VERCEL || process.env.VERCEL_ENV),
  });
};
