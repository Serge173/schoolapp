const path = require('path');
const fs = require('fs');

const CERTIFICATEUR_TO_ECOLE_HINTS = [
  { test: /idrac/i, ecole: 'IDRAC Business School' },
  { test: /aptil|aptim/i, ecole: '3A' },
  { test: /ifag|^aipf$/i, ecole: 'IFAG' },
  { test: /supdecom|sup.?de.?com/i, ecole: "SUP'DE COM" },
  { test: /ileri|expert analyste.*relations internationales/i, ecole: 'ILERI' },
  { test: /iet\b|ccit portes|environnement|responsable qualit.*sécurité|40563/i, ecole: 'IET' },
  { test: /ieft|afmge|bts.*tourisme/i, ecole: 'IEFT' },
  { test: /vivamundi/i, ecole: 'VIVAMUNDI' },
  { test: /igefi|aftec|expert financier|36596|collaborateur.*gestion comptable/i, ecole: 'IGEFI' },
  { test: /epsi|afinum|35584|expert en informatique et syst/i, ecole: 'EPSI' },
  { test: /ynov|cybersécurité|40897/i, ecole: 'EPSI' },
  { test: /simplon|37827|développeur.*intelligence artificielle/i, ecole: 'WIS' },
  { test: /igensia|35594|administrateur syst/i, ecole: 'EPSI' },
  { test: /esail|architecte.*intérieur|designer en espaces/i, ecole: 'ESAIL' },
  { test: /ihedrea|droit rural|agro|37824|38609|expert-conseil.*filières agricoles/i, ecole: 'IHEDREA' },
  { test: /hesca|icl\b/i, ecole: 'HESCA' },
  { test: /cefam/i, ecole: 'CEFAM' },
];

function norm(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function ecoleHint(cert) {
  const c = String(cert || '');
  for (const { test, ecole } of CERTIFICATEUR_TO_ECOLE_HINTS) {
    if (test.test(c)) return ecole;
  }
  return null;
}

function getDataPath() {
  return path.join(__dirname, '..', 'data', 'figs-programmes.json');
}

let cache = null;
let mtime = 0;

function loadCatalog() {
  const p = getDataPath();
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

function getCatalog() {
  const p = getDataPath();
  const stat = fs.statSync(p);
  if (!cache || stat.mtimeMs !== mtime) {
    mtime = stat.mtimeMs;
    cache = loadCatalog();
  }
  return cache;
}

function listPrograms(query = {}) {
  const data = getCatalog();
  const programs = data.programs || [];
  let list = programs;

  const q = norm(query.q);
  const rythme = (query.rythme || '').trim();
  const ecole = norm(query.ecole);
  const code = (query.code_rncp || '').trim();

  if (code) list = list.filter((p) => String(p.codeRncp || '').includes(code));
  if (rythme) list = list.filter((p) => norm(p.rythme).includes(norm(rythme)));
  if (ecole) {
    list = list.filter((p) => {
      const hint = ecoleHint(p.certificateur);
      if (hint && norm(hint).includes(ecole)) return true;
      return norm(p.certificateur).includes(ecole) || norm(p.titreVisaGrade || '').includes(ecole);
    });
  }
  if (q) {
    list = list.filter((p) => {
      const blob = norm(
        [
          p.titreVisaGrade,
          p.certificateur,
          p.codeRncp,
          p.commentaires,
          p.prerequis,
          p.rythme,
          p.repartitionCoursEntreprise,
        ].join(' ')
      );
      return q.split(/\s+/).every((word) => word.length < 2 || blob.includes(word));
    });
  }

  return {
    meta: {
      total: list.length,
      sourceTotal: programs.length,
      generatedAt: data.generatedAt || null,
    },
    programs: list,
  };
}

function getProgram(id) {
  const data = getCatalog();
  const programs = data.programs || [];
  const program = programs.find((p) => Number(p.id) === id);
  if (!program) return null;
  return {
    meta: { generatedAt: data.generatedAt || null },
    program,
  };
}

module.exports = {
  getCatalog,
  listPrograms,
  getProgram,
  norm,
  ecoleHint,
};
