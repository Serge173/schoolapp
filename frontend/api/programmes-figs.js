/**
 * Catalogue FIGS — handler léger sans boot Express (pas de JWT / DB requis).
 */
const { listPrograms, getProgram } = require('../../backend/lib/figsProgrammesCatalog');

module.exports = (req, res) => {
  try {
    const id = Number(req.query?.id);
    if (Number.isFinite(id) && id > 0) {
      const result = getProgram(id);
      if (!result) {
        return res.status(404).json({ error: 'Formation introuvable.' });
      }
      return res.status(200).json(result);
    }
    res.status(200).json(listPrograms(req.query || {}));
  } catch (e) {
    console.error('[api/programmes-figs]', e);
    res.status(500).json({ error: 'Impossible de charger le catalogue FIGS.' });
  }
};
