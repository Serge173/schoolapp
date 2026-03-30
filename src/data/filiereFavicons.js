/**
 * Domaines pour favicons Google (s2/favicons) — groupes de filières et libellés du sélecteur.
 */

function norm(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Icône du thème pour chaque groupe (carte filières) */
export const GROUP_FAVICON_DOMAIN = {
  'Agri agro management': 'agriculture.gouv.fr',
  Assurance: 'acpr.fr',
  Communication: 'arcom.fr',
  'Comptabilite - gestion': 'ordre-experts-comptables.fr',
  Design: 'culture.gouv.fr',
  Digital: 'numerique.gouv.fr',
  Droit: 'justice.gouv.fr',
  Environnement: 'ecologie.gouv.fr',
  Finance: 'amf-france.org',
  'Grandes ecoles': 'enseignementsup-recherche.gouv.fr',
  Informatique: 'ssi.gouv.fr',
  Management: 'cnam.fr',
  Marketing: 'ffc.fr',
  'Relations internationales': 'diplomatie.gouv.fr',
  Tourisme: 'atout-france.fr',
};

/** Libellés de sous-filières (liste Agri agro, etc.) → domaine plus précis */
const LABEL_DOMAIN_OVERRIDES = {
  [norm('Agro management')]: 'agriculture.gouv.fr',
  [norm('Assurance')]: 'acpr.fr',
  [norm('Business development')]: 'bpifrance.fr',
  [norm('Communication')]: 'arcom.fr',
  [norm('Comptabilite / Gestion')]: 'ordre-experts-comptables.fr',
  [norm('Design')]: 'culture.gouv.fr',
  [norm('Environnement')]: 'ecologie.gouv.fr',
  [norm('Gestion & finance')]: 'amf-france.org',
  [norm('Informatique')]: 'ssi.gouv.fr',
  [norm('Management')]: 'cnam.fr',
  [norm('Marketing')]: 'ffc.fr',
  [norm('Relations internationales')]: 'diplomatie.gouv.fr',
  [norm('Tourisme')]: 'atout-france.fr',
};

/**
 * Domaine favicon pour une ligne filière (libellé affiché + groupe parent).
 */
export function faviconDomainForFiliereLabel(label, groupName) {
  const n = norm(label);
  if (LABEL_DOMAIN_OVERRIDES[n]) return LABEL_DOMAIN_OVERRIDES[n];
  if (n.includes('informatique') || n.includes('data') || n.includes('cyber')) return 'ssi.gouv.fr';
  if (n.includes('droit') || n.includes('jurid')) return 'justice.gouv.fr';
  if (n.includes('commerce') || n.includes('marketing')) return 'ffc.fr';
  if (n.includes('tourisme')) return 'atout-france.fr';
  if (n.includes('international') || n.includes('relations internationales')) return 'diplomatie.gouv.fr';
  if (n.includes('compta') || n.includes('gestion') || n.includes('finance')) return 'ordre-experts-comptables.fr';
  if (n.includes('environnement') || n.includes('ecolog')) return 'ecologie.gouv.fr';
  if (n.includes('design') || n.includes('architect')) return 'culture.gouv.fr';
  if (n.includes('communication') || n.includes('media')) return 'arcom.fr';
  if (n.includes('assurance')) return 'acpr.fr';
  if (n.includes('agri') || n.includes('agro')) return 'agriculture.gouv.fr';
  return GROUP_FAVICON_DOMAIN[groupName] || 'onisep.fr';
}
