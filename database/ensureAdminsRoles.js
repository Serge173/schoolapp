'use strict';

const db = require('../config/db');
const { getDbDriver } = require('../config/dbDriver');

let ensured = false;

async function ensureAdminsRoles() {
  if (ensured) return;
  const driver = getDbDriver();

  if (driver === 'postgres') {
    const statements = [
      `ALTER TABLE admins ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'admin'`,
      `ALTER TABLE admins ADD COLUMN IF NOT EXISTS actif SMALLINT NOT NULL DEFAULT 1`,
      `ALTER TABLE admins ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    ];
    for (const sql of statements) {
      try {
        await db.query(sql);
      } catch (err) {
        if (!/already exists|duplicate/i.test(String(err.message))) {
          console.warn('[ensureAdminsRoles]', err.message);
        }
      }
    }
    await db.query(
      `UPDATE admins SET role = 'super_admin' WHERE email IN ('admin@shoolapp.com', 'admin@schoolapp.com') OR id = (SELECT MIN(id) FROM admins)`
    );
  } else if (driver === 'sqlite') {
    const cols = [
      ['role', "TEXT NOT NULL DEFAULT 'admin'"],
      ['actif', 'INTEGER NOT NULL DEFAULT 1'],
      ['updated_at', 'TEXT'],
    ];
    for (const [name, def] of cols) {
      try {
        await db.query(`ALTER TABLE admins ADD COLUMN ${name} ${def}`);
      } catch (err) {
        if (!/duplicate column/i.test(String(err.message))) {
          console.warn('[ensureAdminsRoles]', err.message);
        }
      }
    }
    await db.query('UPDATE admins SET role = \'super_admin\' WHERE id = (SELECT MIN(id) FROM admins)');
  } else if (driver === 'mysql') {
    const cols = [
      ['role', "VARCHAR(20) NOT NULL DEFAULT 'admin'"],
      ['actif', 'TINYINT NOT NULL DEFAULT 1'],
      ['updated_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
    ];
    for (const [name, def] of cols) {
      try {
        await db.query(`ALTER TABLE admins ADD COLUMN ${name} ${def}`);
      } catch (err) {
        if (!/duplicate column/i.test(String(err.message))) {
          console.warn('[ensureAdminsRoles]', err.message);
        }
      }
    }
    await db.query('UPDATE admins SET role = \'super_admin\' WHERE id = (SELECT MIN(id) FROM (SELECT id FROM admins) AS t)');
  }

  ensured = true;
}

module.exports = { ensureAdminsRoles };
