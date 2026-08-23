'use strict';

/** Rôles admin FIGS — hiérarchie décroissante. */
const ADMIN_ROLES = ['super_admin', 'admin', 'conseiller', 'lecteur'];

const ADMIN_ROLE_LABELS = {
  super_admin: 'Super administrateur',
  admin: 'Administrateur',
  conseiller: 'Conseiller / agent',
  lecteur: 'Lecture seule',
};

const ADMIN_ROLE_DESCRIPTIONS = {
  super_admin: 'Accès total, gestion des comptes et de la configuration.',
  admin: 'Gestion des écoles, filières, inscriptions et rendez-vous.',
  conseiller: 'Suivi des dossiers d\'inscription et rendez-vous (pas de config écoles/filières).',
  lecteur: 'Consultation du tableau de bord, inscriptions et RDV sans modification.',
};

/** Permission → rôles autorisés. */
const PERMISSION_ROLES = {
  accounts_manage: ['super_admin'],
  content_manage: ['super_admin', 'admin'],
  dossiers_read: ['super_admin', 'admin', 'conseiller', 'lecteur'],
  dossiers_write: ['super_admin', 'admin', 'conseiller'],
};

function normalizeRole(role) {
  const r = String(role || 'lecteur').trim().toLowerCase();
  return ADMIN_ROLES.includes(r) ? r : 'lecteur';
}

function hasPermission(role, permission) {
  const allowed = PERMISSION_ROLES[permission];
  if (!allowed) return false;
  return allowed.includes(normalizeRole(role));
}

function roleRank(role) {
  const r = normalizeRole(role);
  return ADMIN_ROLES.indexOf(r);
}

/** Un super_admin ne peut pas être rétrogradé par un rôle inférieur. */
function canAssignRole(actorRole, targetRole) {
  if (!hasPermission(actorRole, 'accounts_manage')) return false;
  const target = normalizeRole(targetRole);
  if (actorRole === 'super_admin') return true;
  return roleRank(target) >= roleRank(actorRole);
}

module.exports = {
  ADMIN_ROLES,
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_DESCRIPTIONS,
  PERMISSION_ROLES,
  normalizeRole,
  hasPermission,
  canAssignRole,
};
