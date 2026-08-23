'use strict';

const db = require('../config/db');
const { getDbDriver } = require('../config/dbDriver');
const { writeAudit } = require('./auditLog');
const { RDV_STATUTS } = require('./adminLists');
const { hasPermission, normalizeRole } = require('./adminRoles');

async function patchRendezVous(id, body, actor) {
  const actorRole = normalizeRole(actor?.role);
  if (!hasPermission(actorRole, 'dossiers_write')) {
    return { status: 403, body: { error: 'Votre rôle ne permet pas de modifier les rendez-vous.' } };
  }
  if (!Number.isInteger(id) || id < 1) {
    return { status: 400, body: { error: 'Identifiant invalide.' } };
  }
  const b = body || {};
  const { statut, notes_internes } = b;
  if (statut === undefined && notes_internes === undefined) {
    return { status: 400, body: { error: 'Rien à mettre à jour.' } };
  }
  const sets = [];
  const params = [];
  if (statut !== undefined) {
    if (!RDV_STATUTS.includes(statut)) {
      return { status: 400, body: { error: 'Statut invalide.' } };
    }
    sets.push('statut = ?');
    params.push(statut);
  }
  if (notes_internes !== undefined) {
    sets.push('notes_internes = ?');
    params.push(notes_internes);
  }
  params.push(id);
  const driver = getDbDriver();
  let finalSql;
  if (driver === 'sqlite') {
    finalSql = `UPDATE rendez_vous SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`;
  } else if (driver === 'postgres') {
    finalSql = `UPDATE rendez_vous SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  } else {
    finalSql = `UPDATE rendez_vous SET ${sets.join(', ')} WHERE id = ?`;
  }
  const [r] = await db.query(finalSql, params);
  const affected = r.affectedRows ?? r.changes ?? 0;
  if (!affected) return { status: 404, body: { error: 'Rendez-vous introuvable.' } };
  writeAudit('rendez_vous.updated', { id, statut, adminId: actor?.id });
  const [rows] = await db.query('SELECT * FROM rendez_vous WHERE id = ?', [id]);
  return { status: 200, body: rows[0] };
}

module.exports = { patchRendezVous };
