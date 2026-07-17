function getDbDriver() {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) return 'postgres';
  if (process.env.DB_DRIVER === 'sqlite' || !process.env.DB_HOST) return 'sqlite';
  return 'mysql';
}

function isSqlite() {
  return getDbDriver() === 'sqlite';
}

function isPostgres() {
  return getDbDriver() === 'postgres';
}

module.exports = { getDbDriver, isSqlite, isPostgres };
