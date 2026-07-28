function hasJwtConfig() {
  if (process.env.JWT_SECRET) return true;
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) return false;
  return Boolean(
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.VERCEL_URL
  );
}

module.exports = (_req, res) => {
  res.status(200).json({
    ok: true,
    jwt: hasJwtConfig(),
    env: process.env.NODE_ENV || process.env.VERCEL_ENV || null,
    vercel: Boolean(process.env.VERCEL || process.env.VERCEL_ENV),
  });
};
