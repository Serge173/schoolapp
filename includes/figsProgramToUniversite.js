import { normalize } from '../data/filieresGroupsConfig';

/**
 * Rapproche un certificateur FIGS d’une école du référentiel (pour pré-remplir l’inscription).
 */
export function resolveUniversiteIdForProgram(program, universites) {
  const cert = String(program.certificateur || '');
  const rows = universites.map((u) => ({ id: u.id, n: normalize(u.nom) }));

  const pick = (pred) => rows.find((r) => pred(r.n))?.id ?? null;

  if (/idrac/i.test(cert)) return pick((n) => n.includes('idrac'));
  if (/aptim|aptil|aipf-aptim/i.test(cert)) return pick((n) => n.includes('3a'));
  if (/^aipf$|ifag/i.test(cert.trim())) return pick((n) => n.includes('ifag'));
  if (/supdecom|sup de com/i.test(cert)) return pick((n) => n.includes('sup') && n.includes('com'));
  if (/ileri/i.test(cert)) return pick((n) => n.includes('ileri'));
  if (/iet\b|ccit portes/i.test(cert)) return pick((n) => n === 'iet' || n.startsWith('iet '));
  if (/ieft|afmge/i.test(cert)) return pick((n) => n.includes('ieft'));
  if (/vivamundi/i.test(cert)) return pick((n) => n.includes('vivamundi'));
  if (/igefi|aftec/i.test(cert)) return pick((n) => n.includes('igefi'));
  if (/epsi|afinum|igensia/i.test(cert)) return pick((n) => n.includes('epsi'));
  if (/ynov/i.test(cert)) return pick((n) => n.includes('epsi'));
  if (/simplon/i.test(cert)) return pick((n) => n.includes('wis'));
  if (/esail/i.test(cert)) return pick((n) => n.includes('esail'));
  if (/ihedrea/i.test(cert)) return pick((n) => n.includes('ihedrea'));
  if (/hesca/i.test(cert)) return pick((n) => n.includes('hesca'));
  if (/icl\b/i.test(cert)) return pick((n) => n.includes('icl'));
  if (/cefam/i.test(cert)) return pick((n) => n.includes('cefam'));

  const blob = normalize(cert);
  const first = blob.split(/\s+/).filter(Boolean)[0];
  if (first && first.length > 2) {
    const loose = rows.find((r) => r.n.includes(first));
    if (loose) return loose.id;
  }

  return null;
}
