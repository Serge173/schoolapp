/**
 * GET universités — handler léger (sans boot Express).
 */
const path = require('path');
const db = require('../config/db');
const { resolveLogoUrl } = require('../includes/logoUrl');
const { pathnameOf } = require('./_lite');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathOnly = pathnameOf(req);
    const detailMatch = pathOnly.match(/^\/api\/universites\/(\d+)$/);

    if (detailMatch) {
      const id = detailMatch[1];
      const [universites] = await db.query(
        'SELECT id, nom, type, ville, description, logo, brochure FROM universites WHERE id = ?',
        [id]
      );
      if (!universites.length) return res.status(404).json({ error: 'Université introuvable.' });
      const u = universites[0];
      if (u.logo) u.logoUrl = resolveLogoUrl(u.logo);
      if (u.brochure) u.brochureUrl = '/uploads/brochures/' + path.basename(u.brochure);
      const [campuses] = await db.query(
        'SELECT id, nom, ville, adresse FROM campuses WHERE universite_id = ? ORDER BY nom',
        [id]
      );
      const [filieres] = await db.query(
        `SELECT f.id, f.nom, f.slug FROM filieres f
         INNER JOIN universite_filieres uf ON uf.filiere_id = f.id
         WHERE uf.universite_id = ? AND f.actif = 1 ORDER BY f.nom`,
        [id]
      );
      const [photos] = await db.query(
        'SELECT id, filename FROM universite_photos WHERE universite_id = ? ORDER BY id',
        [id]
      );
      u.campuses = campuses || [];
      u.filieres = filieres || [];
      u.photos = (photos || []).map((p) => ({
        id: p.id,
        url: '/uploads/photos/' + path.basename(p.filename),
      }));
      return res.status(200).json(u);
    }

    if (pathOnly !== '/api/universites') {
      return res.status(404).json({ error: 'Route introuvable.' });
    }

    let sql = `
      SELECT u.id, u.nom, u.type, u.ville, u.description, u.logo, u.brochure,
        (SELECT COUNT(*) FROM campuses c WHERE c.universite_id = u.id) AS nb_campus
      FROM universites u
      WHERE 1=1`;
    const params = [];
    const filiereId = url.searchParams.get('filiere_id');
    const type = url.searchParams.get('type');
    if (filiereId) {
      sql += ` AND EXISTS (SELECT 1 FROM universite_filieres uf WHERE uf.universite_id = u.id AND uf.filiere_id = ?)`;
      params.push(filiereId);
    }
    if (type) {
      sql += ` AND u.type = ?`;
      params.push(type);
    }
    sql += ' ORDER BY u.nom';
    let [rows] = await db.query(sql, params);

    const niveau = (url.searchParams.get('niveau') || '').trim();
    const fid = filiereId ? Number(filiereId) : null;
    if (niveau && fid && Number.isInteger(fid) && fid > 0) {
      const [filRows] = await db.query('SELECT id, nom, slug FROM filieres WHERE id = ? AND actif = 1', [fid]);
      const filiere = filRows[0];
      if (filiere) {
        const { filterUniversitesByFiliereNiveauFigs } = require('../includes/figsParcoursMatch');
        rows = filterUniversitesByFiliereNiveauFigs(rows, filiere, niveau);
      }
    }

    for (const u of rows) {
      if (u.logo) u.logoUrl = resolveLogoUrl(u.logo);
      if (u.brochure) u.brochureUrl = '/uploads/brochures/' + path.basename(u.brochure);
    }
    return res.status(200).json(rows);
  } catch (err) {
    console.error('[api/universites]', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};
