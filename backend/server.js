require('dotenv').config();
const app = require('./app');
const { runStartupMigrations } = require('./database/startupMigrations');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await runStartupMigrations();
  } catch (err) {
    console.error('[migration] Échec au démarrage:', err.message || err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Serveur FigsApp-Côte d'Ivoire sur http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;
