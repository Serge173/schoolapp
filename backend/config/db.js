require('dotenv').config();
const path = require('path');
const { getDbDriver } = require('../utils/dbDriver');

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
      'better-sqlite3 est requis pour SQLite (dev local). Exécutez: npm install dans backend/'
    );
  }
  const dbPath = path.join(__dirname, '..', 'data', 'shoolapp.db');
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
  const { Pool } = require('@neondatabase/serverless');

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const pool = new Pool({ connectionString });

  async function runPgQuery(sql, params = []) {
    const upper = sql.trim().toUpperCase();
    const isSelect = upper.startsWith('SELECT') || upper.startsWith('WITH');
    const isInsert = upper.startsWith('INSERT');
    let pgSql = convertPlaceholders(sql);
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
