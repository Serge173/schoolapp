/**
 * POST /api/rendez-vous — handler léger (sans boot Express).
 */
const { readJsonBody } = require('./_lite');
const { createRendezVous } = require('../includes/createRendezVous');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  try {
    const body = await readJsonBody(req);
    const result = await createRendezVous(body);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[api/rendez-vous-post]', err);
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement.' });
  }
};
