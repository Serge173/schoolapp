import { GROUP_SOUS_FILIERES, mergeSpecialiteLists, normalize, resolveFiliereGrandGroupe } from '../../data/filieresGroupsConfig';

/** Comme la page Filières publique : référentiel + titres catalogue FIGS + spécialités en base (sans doublon). */
export function specialitesAfficheesPourFiliere(f, catalogueByG) {
  const g = resolveFiliereGrandGroupe(f);
  const refEtCatalogue = mergeSpecialiteLists(GROUP_SOUS_FILIERES[g] || [], catalogueByG[g] || []);
  const fromDb = (f.sous_filieres || []).map((s) => String(s.nom || '').trim()).filter(Boolean);
  return mergeSpecialiteLists(refEtCatalogue, fromDb);
}

export function specCatalogKey(filiereId, libelle) {
  return `${Number(filiereId)}|${normalize(libelle)}`;
}

export function resolveSpecRow(f, label) {
  const n = normalize(label);
  const sous = (f.sous_filieres || []).find((s) => normalize(String(s.nom || '')) === n);
  if (sous) return { kind: 'sous', id: Number(sous.id), label: sous.nom };
  return { kind: 'catalog', filiere_id: Number(f.id), label };
}

export function isSpecSelectedState(f, label, st) {
  const row = resolveSpecRow(f, label);
  if (row.kind === 'sous') return (st.sous_filiere_ids || []).map(Number).includes(row.id);
  const k = specCatalogKey(row.filiere_id, row.label);
  return (st.specialites_catalogue || []).some((c) => specCatalogKey(c.filiere_id, c.libelle) === k);
}
