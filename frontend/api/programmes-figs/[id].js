const { getProgram } = require('../../../backend/lib/figsProgrammesCatalog');

module.exports = (req, res) => {
  try {
    const id = Number(req.query.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Identifiant invalide.' });
    }
    const result = getProgram(id);
    if (!result) {
      return res.status(404).json({ error: 'Formation introuvable.' });
    }
    res.status(200).json(result);
  } catch (e) {
    console.error('[api/programmes-figs/id]', e);
    res.status(500).json({ error: 'Impossible de charger la fiche FIGS.' });
  }
};
