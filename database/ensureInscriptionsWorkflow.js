'use strict';

const db = require('../config/db');
const { getDbDriver } = require('../config/dbDriver');

let ensured = false;

async function ensureInscriptionsWorkflow() {
  if (ensured) return;
  const driver = getDbDriver();

  if (driver === 'postgres') {
    const statements = [
      `ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS contact VARCHAR(120)`,
      `ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS contact_telephone VARCHAR(20)`,
      `ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS statut VARCHAR(20) NOT NULL DEFAULT 'nouveau'`,
      `ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS notes_internes TEXT`,
      `ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    ];
    for (const sql of statements) {
      try {
        await db.query(sql);
      } catch (err) {
        if (!/already exists|duplicate/i.test(String(err.message))) {
          console.warn('[ensureInscriptionsWorkflow]', err.message);
        }
      }
    }
  } else if (driver === 'sqlite') {
    const cols = [
      ['contact', 'TEXT'],
      ['contact_telephone', 'TEXT'],
      ['statut', "TEXT NOT NULL DEFAULT 'nouveau'"],
      ['notes_internes', 'TEXT'],
      ['updated_at', 'TEXT'],
    ];
    for (const [name, def] of cols) {
      try {
        await db.query(`ALTER TABLE inscriptions ADD COLUMN ${name} ${def}`);
      } catch (err) {
        if (!/duplicate column/i.test(String(err.message))) {
          console.warn('[ensureInscriptionsWorkflow]', err.message);
        }
      }
    }
  } else if (driver === 'mysql') {
    const cols = [
      ['contact', 'VARCHAR(120) NULL'],
      ['contact_telephone', 'VARCHAR(20) NULL'],
      ['statut', "VARCHAR(20) NOT NULL DEFAULT 'nouveau'"],
      ['notes_internes', 'TEXT NULL'],
      ['updated_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
    ];
    for (const [name, def] of cols) {
      try {
        await db.query(`ALTER TABLE inscriptions ADD COLUMN ${name} ${def}`);
      } catch (err) {
        if (!/duplicate column/i.test(String(err.message))) {
          console.warn('[ensureInscriptionsWorkflow]', err.message);
        }
      }
    }
  }

  ensured = true;
}

module.exports = { ensureInscriptionsWorkflow };
