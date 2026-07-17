const { getDbDriver } = require('../utils/dbDriver');
const { ensurePostgresSchema } = require('./ensurePostgresSchema');

async function runStartupMigrations() {
  const driver = getDbDriver();

  if (driver === 'postgres') {
    await ensurePostgresSchema();
    const { Pool } = require('@neondatabase/serverless');
    const { configureNeon } = require('../config/neon');
    configureNeon();
    const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL });
    const { ensureAdminPostgres } = require('./ensureAdminPostgres');
    await ensureAdminPostgres(pool);
    await pool.end();
    return;
  }

  if (driver === 'mysql' && process.env.SKIP_DB_MIGRATION !== '1') {
    const { runPaysBureauMigrationMysql } = require('./migratePaysBureauMysql');
    await runPaysBureauMigrationMysql();
    const { ensureRendezVousTableMysql } = require('./ensureRendezVousTableMysql');
    await ensureRendezVousTableMysql();
    const { ensureDemandesOrientationMysql } = require('./ensureDemandesOrientationMysql');
    await ensureDemandesOrientationMysql();
    const { migrateFiliereGrandGroupeMysql } = require('./migrateFiliereGrandGroupeMysql');
    await migrateFiliereGrandGroupeMysql();
    const { ensureUniversiteOffresMysql } = require('./ensureUniversiteOffresMysql');
    await ensureUniversiteOffresMysql();
    return;
  }

  if (driver === 'sqlite') {
    const { ensureRendezVousTableSqlite } = require('./ensureRendezVousTableSqlite');
    ensureRendezVousTableSqlite();
    const { ensureDemandesOrientationSqlite } = require('./ensureDemandesOrientationSqlite');
    ensureDemandesOrientationSqlite();
    const { ensureInscriptionsPaysBureauSqlite } = require('./ensureInscriptionsPaysBureauSqlite');
    ensureInscriptionsPaysBureauSqlite();
    const { ensureFiliereGrandGroupeSqlite } = require('./ensureFiliereGrandGroupeSqlite');
    ensureFiliereGrandGroupeSqlite();
    const { ensureUniversiteOffresSqlite } = require('./ensureUniversiteOffresSqlite');
    ensureUniversiteOffresSqlite();
  }
}

module.exports = { runStartupMigrations };
