/** Rôles admin — aligné avec includes/adminRoles.js */

export const ADMIN_ROLE_LABELS = {
  super_admin: 'Super administrateur',
  admin: 'Administrateur',
  conseiller: 'Conseiller / agent',
  lecteur: 'Lecture seule',
};

export const ADMIN_ROLE_DESCRIPTIONS = {
  super_admin: 'Accès total, gestion des comptes et configuration des écoles et filières.',
  admin: 'Gestion des écoles, filières, inscriptions et rendez-vous.',
  conseiller: 'Suivi des dossiers et rendez-vous (sans modification des écoles/filières).',
  lecteur: 'Consultation uniquement — pas de modification des dossiers.',
};

export const ADMIN_ROLES = ['super_admin', 'admin', 'conseiller', 'lecteur'];

export function normalizeRole(role) {
  const r = String(role || 'lecteur').trim().toLowerCase();
  return ADMIN_ROLES.includes(r) ? r : 'lecteur';
}

export function canManageAccounts(role) {
  return normalizeRole(role) === 'super_admin';
}

export function canManageContent(role) {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'admin';
}

export function canReadDossiers(role) {
  return ADMIN_ROLES.includes(normalizeRole(role));
}

export function canWriteDossiers(role) {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'admin' || r === 'conseiller';
}

export function roleBadgeClass(role) {
  const r = normalizeRole(role);
  if (r === 'super_admin') return 'badge-private';
  if (r === 'admin') return 'badge-public';
  if (r === 'conseiller') return 'badge';
  return 'badge';
}
