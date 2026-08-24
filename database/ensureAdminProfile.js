'use strict';

const db = require('../config/db');
const { getDbDriver } = require('../config/dbDriver');

let ensured = false;

async function ensureAdminProfile() {
  if (ensured) return;
  const driver = getDbDriver();

  const cols = [
    ['prenom', driver === 'postgres' ? 'VARCHAR(100)' : driver === 'mysql' ? 'VARCHAR(100)' : 'TEXT'],
    ['telephone', driver === 'postgres' ? 'VARCHAR(20)' : driver === 'mysql' ? 'VARCHAR(20)' : 'TEXT'],
    ['whatsapp', driver === 'postgres' ? 'VARCHAR(20)' : driver === 'mysql' ? 'VARCHAR(20)' : 'TEXT'],
    ['poste', driver === 'postgres' ? 'VARCHAR(120)' : driver === 'mysql' ? 'VARCHAR(120)' : 'TEXT'],
    ['pays_bureau', driver === 'postgres' ? 'VARCHAR(5)' : driver === 'mysql' ? 'VARCHAR(5)' : 'TEXT'],
    ['photo_url', driver === 'postgres' ? 'VARCHAR(500)' : driver === 'mysql' ? 'VARCHAR(500)' : 'TEXT'],
  ];

  if (driver === 'postgres') {
    for (const [name, type] of cols) {
      try {
        await db.query(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS ${name} ${type}`);
      } catch (err) {
        if (!/already exists|duplicate/i.test(String(err.message))) {
          console.warn('[ensureAdminProfile]', err.message);
        }
      }
    }
  } else {
    for (const [name, type] of cols) {
      try {
        await db.query(`ALTER TABLE admins ADD COLUMN ${name} ${type}`);
      } catch (err) {
        if (!/duplicate column/i.test(String(err.message))) {
          console.warn('[ensureAdminProfile]', err.message);
        }
      }
    }
  }

  ensured = true;
}

module.exports = { ensureAdminProfile };
