const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config/.env') });

const app = require('./app');
const { runStartupMigrations } = require('../database/startupMigrations');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await runStartupMigrations();
  } catch (err) {
    console.error('[migration] Échec au démarrage:', err.message || err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`FigsApp API → http://localhost:${PORT}`);
  });
}

start();
