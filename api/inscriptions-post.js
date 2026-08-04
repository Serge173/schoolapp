/**
 * POST /api/inscriptions — handler léger (sans boot Express).
 */
const { readJsonBody } = require('./_lite');
const { createInscription } = require('../includes/createInscription');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  try {
    const body = await readJsonBody(req);
    const result = await createInscription(body);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[api/inscriptions-post]', err);
    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement.' });
  }
};
