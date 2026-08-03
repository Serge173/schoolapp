/** Onze grands groupes de filières (page Filières + catalogue FIGS). */

export const GROUPS = [
  'Agri agro management',
  'Communication',
  'Comptabilite - gestion',
  'Design',
  'Environnement',
  'Finance',
  'Informatique',
  'Management',
  'Marketing',
  'Relations internationales',
  'Tourisme',
];

/**
 * Sous-filières / spécialisations affichées sous chaque grand groupe (référentiel pédagogique).
 * Les filières réelles du réseau (API) s’affichent en complément lorsqu’elles existent.
 */
export const GROUP_SOUS_FILIERES = {
  'Agri agro management': [
    'Agroéconomie',
    'Agronomie',
    'Agroalimentaire',
    'Sciences agronomiques et territoires',
    'Filières animales et productions',
    'Filières végétales',
    'Agroécologie et transitions',
    'Management et commerce agricole',
  ],
  Communication: [
    'Journalisme et médias',
    'Communication publicitaire',
    'Relations publiques',
    'Stratégie de marque et éditoriale',
    'Production audiovisuelle',
    'Communication digitale et réseaux sociaux',
    'Événementiel',
    'Communication interne et corporate',
  ],
  'Comptabilite - gestion': [
    'Comptabilité générale et financière',
    'Audit et contrôle',
    'Gestion des paies et RH administratives',
    'Contrôle de gestion et pilotage',
    'Expertise comptable (parcours)',
    'Trésorerie et finance d’entreprise',
    'Systèmes d’information de gestion',
    'Fiscalité des entreprises',
  ],
  Design: [
    'Design graphique et identité visuelle',
    'Design produit et industriel',
    'Design d’espace et scénographie',
    'Architecture d’intérieur',
    'Design UX / UI',
    'Design mode et textile',
    'Design interactif et numérique',
  ],
  Environnement: [
    'Écologie, biodiversité et naturaliste',
    'Génie civil et aménagement durable',
    'QHSE, RSE et management environnemental',
    'Énergie et transition écologique',
    'Eau, déchets et milieux',
    'Urbanisme et territoires durables',
    'Climat et économie circulaire',
  ],
  Finance: [
    'Banque et marchés financiers',
    'Assurance et actuariat',
    'Fiscalité et droit fiscal',
    'Analyse financière et corporate finance',
    'Risques et conformité',
    'Trésorerie et cash management',
    'Investissement et gestion de patrimoine',
  ],
  Informatique: [
    'Développement logiciel et web',
    'Cybersécurité',
    'Data science et big data',
    'Administration systèmes et réseaux',
    'Intelligence artificielle',
    'Cloud, DevOps et infrastructure',
    'Métiers du numérique (ex. WIS, alternance tech)',
  ],
  Management: [
    'Management général et stratégie',
    'Consulting et transformation',
    'Ressources humaines',
    'Management de projet',
    'Entrepreneuriat et innovation',
    'Operations et supply chain',
    'Qualité et performance',
    'Commerce et développement B2B',
    'Parcours type grandes écoles / MBA (hors filières sectorielles listées ailleurs)',
    'Santé, médecine et psychologie (parcours management)',
  ],
  Marketing: [
    'Marketing stratégique',
    'Marketing digital et growth',
    'Trade marketing et retail',
    'Études et data marketing',
    'Brand content et création',
    'Vente et négociation commerciale',
    'E-commerce et marketplace',
  ],
  'Relations internationales': [
    'Commerce international',
    'Affaires européennes et réglementation',
    'Coopération et diplomatie économique',
    'Droit des affaires et droit international',
    'Supply chain internationale',
    'Langues, cultures et interculturalité',
    'Géopolitique et intelligence économique',
  ],
  Tourisme: [
    'Hôtellerie et restauration',
    'Management du tourisme et des loisirs',
    'Animation et accueil du public',
    'Agences de voyages et événementiel',
    'Marketing et promotion touristique',
    'Patrimoine, culture et écotourisme',
    'Transport et logistique touristique',
  ],
};

export const GROUP_KEYWORDS = {
  'Agri agro management': [
    'agri',
    'agro',
    'agricole',
    'rural',
    'droit rural',
    'economie agricole',
    'filiere agricole',
    'agroalimentaire',
    'ihedrea',
    'culture agricole',
    'conseiller en droit',
    'expert-conseil',
    'filieres agricoles',
  ],
  Communication: [
    'communication',
    'journal',
    'media',
    'charge de communication',
    'bts communication',
    'strategie marketing',
    'manager de la strategie marketing',
  ],
  'Comptabilite - gestion': [
    'compta',
    'comptabilite',
    'gestion comptable',
    'collaborateur en gestion',
    'expert financier',
    'licence',
    'diplome de comptabilite',
    'aftec',
    'igefi',
    'igs',
    'controle de gestion',
  ],
  Design: ['design', 'architecture', 'interieur', 'espace', 'esail', 'portfolio'],
  Environnement: [
    'environnement',
    'ecologie',
    'genie civil',
    'qse',
    'qhse',
    'qualite securite',
    'impact social',
    'impact environnemental',
    'coordinateur de projets',
    'biodiversite',
    'naturaliste',
    'rse',
    'economie circulaire',
    'developpement durable',
    'ccit portes',
    'normes 9001',
    '45001',
    '14001',
  ],
  Finance: [
    'finance',
    'banque',
    'economie',
    'achats',
    'supply chain',
    'manager des achats',
    'assurance',
    'hesca',
    'icl',
  ],
  Informatique: [
    'informatique',
    'data',
    'cyber',
    'cybersecurite',
    'developpement',
    'developpeur',
    'intelligence artificielle',
    'simplon',
    'administrateur systeme',
    'reseaux',
    'bases de donnees',
    'bts sio',
    'services informatiques',
    'epsi',
    'ynov',
    'afinum',
    'expert en informatique',
    'igenisia',
    'digital',
    'numerique',
    'web',
    'wis',
  ],
  Management: [
    'management',
    'gestion',
    'business',
    'manager de commerce',
    'manager de la strategie',
    'manager de projets nationaux',
    'manager qualite',
    'expert-conseil en strategie',
    'strategie commerciale',
    'ifag',
    'aipf',
    'aptil',
    'centre de profit',
    'responsable du developpement commercial',
    'ingenieur',
    'grade de master',
    'bac+5',
    'mba',
    'ecole',
    'medecine',
    'psychologie',
    'sante',
  ],
  Marketing: [
    'marketing',
    'commerce',
    'commercial',
    'idrac',
    'developpement commercial',
    'vente',
    'business development',
  ],
  'Relations internationales': [
    'relations internationales',
    'international',
    'diplomatique',
    'intelligence economique',
    'geopolitique',
    'ileri',
    'expert analyste',
    'master droit international',
    'droit',
    'jurid',
    'conseiller en droit',
  ],
  Tourisme: ['tourisme', 'hospitalite', 'bts tourisme', 'agence', 'ieft', 'afmge', 'vivamundi', 'hotel'],
};

/** Ordre de priorité si scores proches (spécifique → général). */
export const GROUP_SCORE_ORDER = [
  'Tourisme',
  'Informatique',
  'Relations internationales',
  'Environnement',
  'Comptabilite - gestion',
  'Communication',
  'Marketing',
  'Design',
  'Agri agro management',
  'Finance',
  'Management',
];

export const GROUP_ICON_SRC = {
  'Agri agro management': '/icons/filieres/default.svg',
  Communication: '/icons/filieres/communication.svg',
  'Comptabilite - gestion': '/icons/filieres/gestion.svg',
  Design: '/icons/filieres/architecture.svg',
  Environnement: '/icons/filieres/genie-civil.svg',
  Finance: '/icons/filieres/finance.svg',
  Informatique: '/icons/filieres/informatique.svg',
  Management: '/icons/filieres/gestion.svg',
  Marketing: '/icons/filieres/marketing.svg',
  'Relations internationales': '/icons/filieres/communication.svg',
  Tourisme: '/icons/filieres/default.svg',
};

export function normalize(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Recherche sur une filière / domaine : sous-chaîne (phrase avec espaces),
 * même phrase « collée » (ex. collage de titre), ou initiales successives des mots (ex. « ri »).
 */
export function matchesFiliereSearch(text, rawQuery) {
  const raw = String(rawQuery || '').trim();
  if (!raw) return true;
  const hay = normalize(text);
  const qPhrase = normalize(raw).trim().replace(/\s+/g, ' ');
  if (!qPhrase) return true;

  if (hay.includes(qPhrase)) return true;

  const hayCompact = hay.replace(/\s+/g, '');
  const qCompact = qPhrase.replace(/\s+/g, '');
  if (qCompact && hayCompact.includes(qCompact)) return true;

  const words = hay.split(/[\s\-/'.]+/).filter((w) => w.length > 0);
  if (words.length === 0) return false;
  let qi = 0;
  for (const w of words) {
    if (qi < qCompact.length && w[0] === qCompact[qi]) qi += 1;
  }
  return qi === qCompact.length;
}

/** Première filière API associée au groupe (même classement que la page Filières). */
export function getDefaultFiliereIdForGroup(group, filieres) {
  const bucket = bucketFilieresByGroup(filieres);
  return (bucket[group] || [])[0]?.id ?? null;
}

/** Grand groupe figé en base (admin) ; sinon classement par mots-clés. */
export function resolveFiliereGrandGroupe(filiere) {
  const g = filiere?.grand_groupe;
  if (g && GROUPS.includes(g)) return g;
  return assignFiliereToGroup(filiere);
}

/** Classe une filière (nom + slug) dans un grand groupe. */
export function assignFiliereToGroup(filiere) {
  const blob = normalize([filiere.nom, filiere.slug].filter(Boolean).join(' '));

  const scores = {};
  for (const group of GROUPS) {
    const kws = GROUP_KEYWORDS[group] || [];
    let score = 0;
    for (const k of kws) {
      const nk = normalize(k);
      if (nk && blob.includes(nk)) score += Math.min(nk.length, 24);
    }
    scores[group] = score;
  }

  let best = 'Management';
  let bestScore = 0;
  for (const group of GROUP_SCORE_ORDER) {
    const s = scores[group] || 0;
    if (s > bestScore) {
      bestScore = s;
      best = group;
    }
  }

  if (bestScore === 0) {
    if (blob.includes('droit') || blob.includes('jurid')) return 'Relations internationales';
    if (blob.includes('medecine') || blob.includes('sante')) return 'Management';
    if (blob.includes('psychologie')) return 'Management';
    if (blob.includes('genie')) return 'Environnement';
  }

  return best;
}

/** Regroupe les filières API (une fois chacune) par grand domaine. */
export function bucketFilieresByGroup(filieres) {
  /** @type {Record<string, typeof filieres>} */
  const out = Object.fromEntries(GROUPS.map((g) => [g, []]));
  const list = Array.isArray(filieres) ? filieres : [];
  for (const f of list) {
    const g = resolveFiliereGrandGroupe(f);
    if (out[g]) out[g].push(f);
    else out[g] = [f];
  }
  for (const g of GROUPS) {
    out[g].sort((a, b) => String(a.nom).localeCompare(String(b.nom), 'fr'));
  }
  return out;
}

/** Classe un programme FIGS dans un grand groupe. */
export function assignProgramToGroup(program) {
  const blob = normalize(
    [
      program.titreVisaGrade,
      program.certificateur,
      program.commentaires,
      program.prerequis,
      program.repartitionCoursEntreprise,
    ].join(' ')
  );

  const scores = {};
  for (const group of GROUPS) {
    const kws = GROUP_KEYWORDS[group] || [];
    let score = 0;
    for (const k of kws) {
      const nk = normalize(k);
      if (nk && blob.includes(nk)) score += Math.min(nk.length, 24);
    }
    scores[group] = score;
  }

  let best = 'Management';
  let bestScore = 0;
  for (const group of GROUP_SCORE_ORDER) {
    const s = scores[group] || 0;
    if (s > bestScore) {
      bestScore = s;
      best = group;
    }
  }

  if (bestScore === 0) {
    if (blob.includes('tourisme') || blob.includes('agence')) return 'Tourisme';
    if (blob.includes('informatique') || blob.includes('numerique') || blob.includes('cyber')) return 'Informatique';
    if (blob.includes('international') || blob.includes('diplomatique')) return 'Relations internationales';
    if (blob.includes('droit') || blob.includes('jurid')) return 'Relations internationales';
  }

  return best;
}

/**
 * Fusionne spécialités « référentiel » + titres catalogue, sans doublon (texte normalisé), tri alphabétique fr.
 */
export function mergeSpecialiteLists(baseLabels, extraLabels) {
  const seen = new Set();
  const out = [];
  const add = (s) => {
    const t = String(s || '').trim();
    if (!t) return;
    const k = normalize(t);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  };
  for (const s of baseLabels || []) add(s);
  for (const s of extraLabels || []) add(s);
  out.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  return out;
}

/** Titres du catalogue FIGS (titreVisaGrade), classés par les 11 grands domaines. */
export function bucketCatalogueTitresByGroup(programs) {
  const out = Object.fromEntries(GROUPS.map((g) => [g, []]));
  const list = Array.isArray(programs) ? programs : [];
  for (const p of list) {
    const g = assignProgramToGroup(p);
    const t = String(p.titreVisaGrade || '').trim();
    if (!t) continue;
    if (out[g]) out[g].push(t);
  }
  return out;
}
