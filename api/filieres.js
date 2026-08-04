/**
 * GET filières — handler léger (sans boot Express).
 */
const db = require('../config/db');
const { pathnameOf } = require('../includes/apiLite');

async function listFilieres(query) {
  const type = query.type;
  const [rows] = await db.query(
    `SELECT f.id, f.nom, f.slug, f.actif, f.grand_groupe,
      (SELECT COUNT(DISTINCT u.id) FROM universites u
       INNER JOIN universite_filieres uf ON u.id = uf.universite_id
       WHERE uf.filiere_id = f.id AND u.type = ?) AS nb_publiques,
      (SELECT COUNT(DISTINCT u.id) FROM universites u
       INNER JOIN universite_filieres uf ON u.id = uf.universite_id
       WHERE uf.filiere_id = f.id AND u.type = ?) AS nb_privees
     FROM filieres f
     WHERE f.actif = 1
     ORDER BY f.nom`,
    [type === 'publique' ? 'publique' : 'publique', type === 'privee' ? 'privee' : 'privee']
  );
  const [sousRows] = await db.query(
    'SELECT id, filiere_id, nom, slug FROM sous_filieres ORDER BY nom'
  );
  const sousByFiliere = {};
  for (const s of sousRows || []) {
    const fid = s.filiere_id;
    if (!sousByFiliere[fid]) sousByFiliere[fid] = [];
    sousByFiliere[fid].push({ id: s.id, nom: s.nom, slug: s.slug });
  }
  let filieres = rows.map((f) => ({
    ...f,
    sous_filieres: sousByFiliere[f.id] || [],
  }));
  if (type) {
    const t = type === 'privee' ? 'privee' : 'publique';
    filieres = filieres.filter((f) => (t === 'privee' ? f.nb_privees > 0 : f.nb_publiques > 0));
  }
  return filieres;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  try {
    const path = pathnameOf(req);
    const listMatch = path === '/api/filieres';
    const detailMatch = path.match(/^\/api\/filieres\/(\d+)$/);
    const niveauxMatch = path.match(/^\/api\/filieres\/(\d+)\/niveaux-disponibles$/);

    if (listMatch) {
      const url = new URL(req.url, 'http://localhost');
      return res.status(200).json(await listFilieres(Object.fromEntries(url.searchParams)));
    }

    if (niveauxMatch) {
      const id = Number(niveauxMatch[1]);
      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: 'Identifiant de filière invalide.' });
      }
      const [rows] = await db.query(
        'SELECT id, nom, slug, actif, grand_groupe FROM filieres WHERE id = ? AND actif = 1',
        [id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Filière introuvable.' });
      const filiere = rows[0];
      const [uniRows] = await db.query(
        `SELECT u.id, u.nom FROM universites u
         INNER JOIN universite_filieres uf ON uf.universite_id = u.id
         WHERE uf.filiere_id = ? AND u.type = 'privee'
         ORDER BY u.nom`,
        [id]
      );
      const { getAvailableNiveauxForFiliere } = require('../includes/figsParcoursMatch');
      return res.status(200).json({ niveaux: getAvailableNiveauxForFiliere(filiere, uniRows || []) });
    }

    if (detailMatch) {
      const id = detailMatch[1];
      const [rows] = await db.query(
        'SELECT id, nom, slug, actif, grand_groupe FROM filieres WHERE id = ? AND actif = 1',
        [id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Filière introuvable.' });
      const [sousRows] = await db.query(
        'SELECT id, nom, slug FROM sous_filieres WHERE filiere_id = ? ORDER BY nom',
        [id]
      );
      return res.status(200).json({ ...rows[0], sous_filieres: sousRows || [] });
    }

    return res.status(404).json({ error: 'Route introuvable.' });
  } catch (err) {
    console.error('[api/filieres]', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};
