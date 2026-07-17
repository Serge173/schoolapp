/** Images écoles connues + helpers libellés admin (RDV, demandes orientation). */

export const ECOLE_IMAGE_BY_NAME = {
  '3A': '/images/ecoles/medium_LOGO_3_A_and_GRIS_CMJN_2596bcbdf1_657a5eab8f.jpg',
  CEFAM: '/images/ecoles/medium_CEFAM_RVB_c2f531b12a.jpg',
  EPSI: '/images/ecoles/medium_LOGO_EPSI_and_RVB_1_6d626ce03d_dd2487977b.png',
  ESAIL: '/images/ecoles/medium_LOGO_ESAIL_and_RVB_2_5605366d43_fc3ccf1fa5.png',
  ESMD: '/images/ecoles/medium_ESMD_88ab6b12d7.png',
  HESCA: '/images/ecoles/Logo_Hesca_2025_66788c9a0c.png',
  ICL: '/images/ecoles/medium_LOGO_ICL_and_RVB_NOIR_vf_f8b2f7ce8e.png',
  'IDRAC Business School': '/images/ecoles/medium_IDRAC_logo_cdc71d3614.png',
  IEFT: '/images/ecoles/medium_LOGO_IEFT_and_RVB_1_29eaf3f17c_22c1a58275.png',
  IET: '/images/ecoles/medium_LOGO_IET_and_RVB_a65724f649_b8d12a0cb4.png',
  IFAG: '/images/ecoles/IFAG_Bloc_Marque_rouge_2c8f4a0025.png',
  IGEFI: '/images/ecoles/medium_LOGO_IGEFI_SIGN_BAS_and_CMJN_e91be09e87.jpg',
  IHEDREA: '/images/ecoles/small_LOGO_IHEDREA_and_RVB_1_0e1efcec2b_7c5d354b79.png',
  ILERI: '/images/ecoles/medium_LOGO_ILERI_and_RVB_1_624b35dd3b_949aaaf49f.png',
  "SUP'DE COM": 'https://www.ecoles-supdecom.com/_ipx/s_180x72/images/logo-navbar.svg',
  VIVAMUNDI: '/images/ecoles/medium_VIVA_MUNDI_LOGO_RVB_3_bf48a63bb2_a4fb51bc01.png',
  WIS: '/images/ecoles/medium_LOGO_WIS_and_RVB_2025_WIS_VECTORISE_NOIR_4fb2d87bde.png',
};

export function getUniversiteImage(u) {
  if (ECOLE_IMAGE_BY_NAME[u.nom]) return ECOLE_IMAGE_BY_NAME[u.nom];
  const src = String(u.logoUrl || '').trim();
  if (!src) return null;
  if (src.startsWith('/uploads/') || src.startsWith('/images/')) return src;
  if (/^https?:\/\//i.test(src)) return src;
  return null;
}

export const RDV_STATUT_LABELS = {
  nouveau: 'Nouveau',
  a_confirmer: 'À confirmer',
  confirme: 'Confirmé',
  annule: 'Annulé',
  termine: 'Terminé',
};

export const RDV_TYPE_LABELS = {
  orientation: 'Orientation',
  inscription: 'Inscription / dossier',
  suivi: 'Suivi candidature',
  renseignements: 'Renseignements',
  autre: 'Autre',
};

export const RDV_CRENEAU_LABELS = {
  matin: 'Matin',
  apres_midi: 'Après-midi',
  flexible: 'Flexible',
};

export const DO_STATUT_LABELS = {
  nouveau: 'Nouveau',
  validee: 'Validée (prise en charge)',
  traitee: 'Traitée',
  annulee: 'Annulée',
};
