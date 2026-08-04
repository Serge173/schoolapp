if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  require('dotenv').config({ path: require('path').join(__dirname, '.env') });
}
const path = require('path');
const { getDbDriver } = require('./dbDriver');

const driver = getDbDriver();

function convertPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

if (driver === 'sqlite') {
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch (err) {
    throw new Error(
      'better-sqlite3 est requis pour SQLite (dev local). Exécutez: npm install'
    );
  }
  const dbPath = path.join(__dirname, '..', 'database', 'shoolapp.db');
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const runQuery = (sql, params = []) => {
    const stmt = db.prepare(sql);
    const upper = sql.trim().toUpperCase();
    if (upper.startsWith('SELECT') || upper.startsWith('WITH')) {
      const rows = params.length ? stmt.all(...params) : stmt.all();
      return [rows];
    }
    const info = params.length ? stmt.run(...params) : stmt.run();
    return [{ insertId: info.lastInsertRowid, affectedRows: info.changes }];
  };
  module.exports = {
    query(sql, params) {
      return Promise.resolve(runQuery(sql, params || []));
    },
    execute(sql, params) {
      return Promise.resolve(runQuery(sql, params || []));
    },
  };
} else if (driver === 'postgres') {
  const { configureNeon } = require('./neon');
  configureNeon();

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  const QUERY_TIMEOUT_MS = isVercel ? 12000 : 0;

  function withQueryTimeout(promise) {
    if (!QUERY_TIMEOUT_MS) return promise;
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timed out')), QUERY_TIMEOUT_MS);
      }),
    ]);
  }

  let runPgQuery;

  if (isVercel) {
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(connectionString);
    runPgQuery = async (sqlStr, params = []) => {
      const upper = sqlStr.trim().toUpperCase();
      const isSelect = upper.startsWith('SELECT') || upper.startsWith('WITH');
      const isInsert = upper.startsWith('INSERT');
      let pgSql = convertPlaceholders(sqlStr);
      if (isInsert && !/RETURNING/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }
      const rows = await withQueryTimeout(sql(pgSql, params));
      if (isSelect) return [rows];
      if (isInsert) {
        const id = rows[0]?.id;
        return [{ insertId: id, affectedRows: rows.length }];
      }
      return [{ affectedRows: rows.length }];
    };
  } else {
    const { Pool } = require('@neondatabase/serverless');
    const pool = new Pool({ connectionString });
    runPgQuery = async (sqlStr, params = []) => {
      const upper = sqlStr.trim().toUpperCase();
      const isSelect = upper.startsWith('SELECT') || upper.startsWith('WITH');
      const isInsert = upper.startsWith('INSERT');
      let pgSql = convertPlaceholders(sqlStr);
      if (isInsert && !/RETURNING/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }
      const result = await pool.query(pgSql, params);
      if (isSelect) return [result.rows];
      if (isInsert) {
        const id = result.rows[0]?.id;
        return [{ insertId: id, affectedRows: result.rowCount }];
      }
      return [{ affectedRows: result.rowCount }];
    };
  }

  module.exports = {
    query: runPgQuery,
    execute: runPgQuery,
  };
} else {
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shoolapp',
    ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  module.exports = pool;
}
