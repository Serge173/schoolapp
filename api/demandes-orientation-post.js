/**
 * POST /api/demandes-orientation — handler léger (sans boot Express).
 */
const { readJsonBody } = require('./_lite');
const { createDemandeOrientation } = require('../includes/createDemandeOrientation');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  try {
    const body = await readJsonBody(req);
    const result = await createDemandeOrientation(body);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[api/demandes-orientation-post]', err);
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement.' });
  }
};
