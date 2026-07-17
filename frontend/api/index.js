const { runStartupMigrations } = require('../../backend/database/startupMigrations');

let expressApp;
let initPromise;
let bootError;

function boot() {
  if (bootError) return Promise.reject(bootError);
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const app = require('../../backend/app');
        await runStartupMigrations();
        expressApp = app;
      } catch (err) {
        bootError = err;
        throw err;
      }
    })();
  }
  return initPromise;
}

module.exports = (req, res) => {
  boot()
    .then(() => expressApp(req, res))
    .catch((err) => {
      console.error('[vercel-api]', err);
      if (!res.headersSent) {
        const msg = err.message || 'Initialisation du service impossible.';
        res.status(500).json({ error: msg });
      }
    });
};
