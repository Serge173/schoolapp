/**
 * Catalogue FIGS — handler léger sans boot Express (pas de JWT / DB requis).
 */
const { listPrograms } = require('../../backend/lib/figsProgrammesCatalog');

module.exports = (req, res) => {
  try {
    res.status(200).json(listPrograms(req.query || {}));
  } catch (e) {
    console.error('[api/programmes-figs]', e);
    res.status(500).json({ error: 'Impossible de charger le catalogue FIGS.' });
  }
};
