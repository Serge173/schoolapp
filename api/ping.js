module.exports = (_req, res) => {
  res.status(200).json({
    v: 'lite-merge-1',
    vercel: Boolean(process.env.VERCEL || process.env.VERCEL_ENV),
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasJwtSecret: Boolean((process.env.JWT_SECRET || '').trim()),
    nodeEnv: process.env.NODE_ENV || process.env.VERCEL_ENV || null,
  });
};
