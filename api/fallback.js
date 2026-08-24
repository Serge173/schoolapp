/** Réponse instantanée pour routes API non gérées (évite timeout server.js). */
const { withServerlessSecurity } = require('../includes/serverlessSecurity');

module.exports = withServerlessSecurity((_req, res) => {
  res.status(404).json({ error: 'Route API introuvable.' });
});
