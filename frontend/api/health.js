function hasJwtConfig() {
  if (process.env.JWT_SECRET) return true;
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  return Boolean(dbUrl);
}

module.exports = (_req, res) => {
  res.status(200).json({
    ok: true,
    jwt: hasJwtConfig(),
    env: process.env.NODE_ENV || process.env.VERCEL_ENV || null,
    vercel: Boolean(process.env.VERCEL || process.env.VERCEL_ENV),
    db: hasJwtConfig() && !process.env.JWT_SECRET,
  });
};
