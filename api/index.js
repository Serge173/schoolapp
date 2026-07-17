const app = require('../backend/app');
const { runStartupMigrations } = require('../backend/database/startupMigrations');

let initPromise = runStartupMigrations().catch((err) => {
  console.error('[vercel-api] Startup failed:', err.message || err);
  throw err;
});

module.exports = (req, res) => {
  initPromise
    .then(() => app(req, res))
    .catch((err) => {
      console.error('[vercel-api]', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Initialisation du service impossible.' });
      }
    });
};
