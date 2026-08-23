/** Réponse instantanée pour routes API non gérées (évite timeout server.js). */
module.exports = (_req, res) => {
  res.status(404).json({ error: 'Route API introuvable.' });
};
