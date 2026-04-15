import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../api';
import { GROUPS, bucketCatalogueTitresByGroup, resolveFiliereGrandGroupe } from '../../data/filieresGroupsConfig';
import { getUniversiteImage } from './adminConstants';
import {
  isSpecSelectedState,
  resolveSpecRow,
  specCatalogKey,
  specialitesAfficheesPourFiliere,
} from './adminUniversiteSpecUtils';

const PAGE_SIZE = 10;

export default function AdminUniversitesPage() {
  const { reloadStats } = useOutletContext();
  const [universites, setUniversites] = useState([]);
  const [filieresTree, setFilieresTree] = useState([]);
  const [modal, setModal] = useState(null);
  const [formUni, setFormUni] = useState({
    nom: '',
    type: 'publique',
    ville: '',
    description: '',
    logo_mode: 'none',
    logo_url: '',
    logo_file: null,
    filieres_entieres: [],
    sous_filiere_ids: [],
    specialites_catalogue: [],
  });
  const [uniModalFiliereFilter, setUniModalFiliereFilter] = useState('');
  const [searchUni, setSearchUni] = useState('');
  const [uniPage, setUniPage] = useState(1);
  const [figsPrograms, setFigsPrograms] = useState([]);

  const loadUniversites = () => api.admin.universites().then(setUniversites);
  const loadFilieresTree = () => api.admin.filieresTree().then(setFilieresTree);

  useEffect(() => {
    loadUniversites();
    loadFilieresTree();
  }, []);

  useEffect(() => {
    api.programmesFigs
      .list({})
      .then((d) => setFigsPrograms(Array.isArray(d?.programs) ? d.programs : []))
      .catch(() => setFigsPrograms([]));
  }, []);

  const sousParentMap = useMemo(() => {
    const m = new Map();
    for (const f of filieresTree) {
      for (const s of f.sous_filieres || []) {
        m.set(Number(s.id), Number(f.id));
      }
    }
    return m;
  }, [filieresTree]);

  const catalogueTitresByGroup = useMemo(() => bucketCatalogueTitresByGroup(figsPrograms), [figsPrograms]);

  const uniModalLinkedFiliereCount = useMemo(() => {
    const s = new Set((formUni.filieres_entieres || []).map(Number));
    for (const sid of formUni.sous_filiere_ids || []) {
      const p = sousParentMap.get(Number(sid));
      if (p) s.add(p);
    }
    for (const c of formUni.specialites_catalogue || []) {
      s.add(Number(c.filiere_id));
    }
    return s.size;
  }, [formUni.filieres_entieres, formUni.sous_filiere_ids, formUni.specialites_catalogue, sousParentMap]);

  const toggleUniversiteFiliereParent = (f) => {
    setFormUni((prev) => {
      const fid = Number(f.id);
      const entiere = (prev.filieres_entieres || []).map(Number).includes(fid);
      const specs = specialitesAfficheesPourFiliere(f, catalogueTitresByGroup);
      const allSpecs = specs.length > 0 && specs.every((label) => isSpecSelectedState(f, label, prev));
      if (entiere || (!entiere && allSpecs)) {
        return {
          ...prev,
          filieres_entieres: (prev.filieres_entieres || []).filter((id) => Number(id) !== fid),
          sous_filiere_ids: (prev.sous_filiere_ids || []).filter((sid) => sousParentMap.get(Number(sid)) !== fid),
          specialites_catalogue: (prev.specialites_catalogue || []).filter((c) => Number(c.filiere_id) !== fid),
        };
      }
      const nextEnt = [...new Set([...(prev.filieres_entieres || []).map(Number), fid])].sort((a, b) => a - b);
      return {
        ...prev,
        filieres_entieres: nextEnt,
        sous_filiere_ids: (prev.sous_filiere_ids || []).filter((sid) => sousParentMap.get(Number(sid)) !== fid),
        specialites_catalogue: (prev.specialites_catalogue || []).filter((c) => Number(c.filiere_id) !== fid),
      };
    });
  };

  const toggleUniversiteSpec = (f, label) => {
    setFormUni((prev) => {
      const row = resolveSpecRow(f, label);
      const fid = Number(f.id);
      const sous = [...(prev.sous_filiere_ids || [])].map(Number);
      const cats = [...(prev.specialites_catalogue || [])];
      const entieres = (prev.filieres_entieres || []).map(Number).filter((id) => id !== fid);
      if (row.kind === 'sous') {
        const i = sous.indexOf(row.id);
        if (i >= 0) sous.splice(i, 1);
        else sous.push(row.id);
      } else {
        const k = specCatalogKey(row.filiere_id, row.label);
        const j = cats.findIndex((c) => specCatalogKey(c.filiere_id, c.libelle) === k);
        if (j >= 0) cats.splice(j, 1);
        else cats.push({ filiere_id: row.filiere_id, libelle: row.label });
      }
      sous.sort((a, b) => a - b);
      cats.sort((a, b) => `${a.filiere_id}|${a.libelle}`.localeCompare(`${b.filiere_id}|${b.libelle}`, 'fr'));
      return {
        ...prev,
        filieres_entieres: entieres,
        sous_filiere_ids: sous,
        specialites_catalogue: cats,
      };
    });
  };

  const filieresForUniModalGrouped = useMemo(() => {
    const q = uniModalFiliereFilter.trim().toLowerCase();
    const matchesSearch = (f) => {
      if (!q) return true;
      const specs = specialitesAfficheesPourFiliere(f, catalogueTitresByGroup).join(' ');
      const hay = `${f.nom || ''} ${f.slug || ''} ${specs}`.toLowerCase();
      return hay.includes(q);
    };
    const filtered = filieresTree.filter(matchesSearch);
    const buckets = Object.fromEntries(GROUPS.map((g) => [g, []]));
    for (const f of filtered) {
      const g = resolveFiliereGrandGroupe(f);
      if (buckets[g]) buckets[g].push(f);
    }
    for (const g of GROUPS) {
      buckets[g].sort((a, b) => String(a.nom || '').localeCompare(String(b.nom || ''), 'fr', { sensitivity: 'base', numeric: true }));
    }
    return GROUPS.map((group) => ({ group, items: buckets[group] })).filter((x) => x.items.length > 0);
  }, [filieresTree, uniModalFiliereFilter, catalogueTitresByGroup]);

  const filteredUniversites = universites.filter((u) => {
    const q = searchUni.trim().toLowerCase();
    if (!q) return true;
    const haystack = `${u.nom || ''} ${u.ville || ''} ${u.description || ''}`.toLowerCase();
    return haystack.includes(q);
  });
  const totalUniPages = Math.max(1, Math.ceil(filteredUniversites.length / PAGE_SIZE));
  const safeUniPage = Math.min(uniPage, totalUniPages);
  const paginatedUniversites = filteredUniversites.slice((safeUniPage - 1) * PAGE_SIZE, safeUniPage * PAGE_SIZE);

  const handleSaveUniversite = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nom: formUni.nom,
        type: formUni.type,
        ville: formUni.ville,
        description: formUni.description,
        logo: formUni.logo_mode === 'url' ? formUni.logo_url.trim() || null : null,
      };
      let uniId = modal === 'add' ? null : modal.id;

      if (modal === 'add') {
        const created = await api.admin.universiteCreate(payload);
        uniId = created?.id;
      } else {
        await api.admin.universiteUpdate(modal.id, payload);
      }

      if (!uniId) throw new Error('Identifiant université manquant.');

      if (formUni.logo_mode === 'upload' && formUni.logo_file && uniId) {
        const result = await api.admin.uploadLogo(uniId, formUni.logo_file);
        if (result?.error) throw new Error(result.error);
      }

      await api.admin.universiteFilieres(uniId, {
        filieres_entieres: (formUni.filieres_entieres || []).map(Number).filter((n) => Number.isInteger(n) && n > 0),
        sous_filiere_ids: (formUni.sous_filiere_ids || []).map(Number).filter((n) => Number.isInteger(n) && n > 0),
        specialites_catalogue: (formUni.specialites_catalogue || []).map((c) => ({
          filiere_id: Number(c.filiere_id),
          libelle: String(c.libelle || '').trim(),
        })),
      });

      setModal(null);
      setUniModalFiliereFilter('');
      setFormUni({
        nom: '',
        type: 'publique',
        ville: '',
        description: '',
        logo_mode: 'none',
        logo_url: '',
        logo_file: null,
        filieres_entieres: [],
        sous_filiere_ids: [],
        specialites_catalogue: [],
      });
      loadUniversites();
      reloadStats();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUniversite = async (id) => {
    if (!confirm('Supprimer cette université ?')) return;
    try {
      await api.admin.universiteDelete(id);
      loadUniversites();
      reloadStats();
      setUniModalFiliereFilter('');
      setModal(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const openEdit = (u) => {
    setUniModalFiliereFilter('');
    const rawLogo = String(u.logo || '').trim();
    const isUrlMode = /^https?:\/\//i.test(rawLogo) || /^\/?images\//i.test(rawLogo);
    const sous_filiere_ids = (u.sous_filiere_ids || [])
      .map((id) => Number(id))
      .filter((n) => Number.isInteger(n) && n > 0)
      .sort((a, b) => a - b);
    const specialites_catalogue = Array.isArray(u.specialites_catalogue)
      ? u.specialites_catalogue
          .map((c) => ({ filiere_id: Number(c.filiere_id), libelle: String(c.libelle || '').trim() }))
          .filter((c) => Number.isInteger(c.filiere_id) && c.filiere_id > 0 && c.libelle.length >= 2)
      : [];
    let filieres_entieres = (u.filieres_entieres || [])
      .map((id) => Number(id))
      .filter((n) => Number.isInteger(n) && n > 0)
      .sort((a, b) => a - b);
    if (
      !filieres_entieres.length &&
      !sous_filiere_ids.length &&
      !specialites_catalogue.length &&
      (u.filiere_ids || []).length
    ) {
      filieres_entieres = (u.filiere_ids || [])
        .map((id) => Number(id))
        .filter((n) => Number.isInteger(n) && n > 0)
        .sort((a, b) => a - b);
    }
    setFormUni({
      nom: u.nom,
      type: u.type,
      ville: u.ville,
      description: u.description || '',
      logo_mode: isUrlMode ? 'url' : 'none',
      logo_url: isUrlMode ? rawLogo : '',
      logo_file: null,
      filieres_entieres,
      sous_filiere_ids,
      specialites_catalogue,
    });
    setModal({ id: u.id });
  };

  return (
    <>
      <h1 style={{ marginBottom: '1.5rem' }}>Universités</h1>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setUniModalFiliereFilter('');
            setModal('add');
            setFormUni({
              nom: '',
              type: 'publique',
              ville: '',
              description: '',
              logo_mode: 'none',
              logo_url: '',
              logo_file: null,
              filieres_entieres: [],
              sous_filiere_ids: [],
              specialites_catalogue: [],
            });
          }}
        >
          + Ajouter une université
        </button>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-public">Total écoles: {filteredUniversites.length}</span>
          <input
            value={searchUni}
            onChange={(e) => {
              setSearchUni(e.target.value);
              setUniPage(1);
            }}
            placeholder="Rechercher par nom ou mot-clé"
            style={{ minWidth: 280, padding: '0.55rem 0.8rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
        </div>
      </div>
      <div className="grid-cards">
        {paginatedUniversites.map((u) => (
          <div key={u.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: 14,
                border: '1px solid var(--border)',
                background: 'var(--surface-hover)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {getUniversiteImage(u) ? (
                <img src={getUniversiteImage(u)} alt="" referrerPolicy="no-referrer" style={{ width: 56, height: 56, objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(28,117,183,0.08)' }} />
              )}
            </div>
            <h3>{u.nom}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {u.ville} · <span className={`badge badge-${u.type === 'privee' ? 'private' : 'public'}`}>{u.type === 'privee' ? 'Privée' : 'Publique'}</span>
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {(u.filiere_ids || []).length} filière{(u.filiere_ids || []).length !== 1 ? 's' : ''} · {(u.sous_filiere_ids || []).length + (u.specialites_catalogue || []).length}{' '}
              spécialité
              {(u.sous_filiere_ids || []).length + (u.specialites_catalogue || []).length !== 1 ? 's' : ''} au détail
            </p>
            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => openEdit(u)}>
                Modifier
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => handleDeleteUniversite(u.id)}>
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
      {filteredUniversites.length === 0 && <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Aucune école trouvée.</p>}
      {filteredUniversites.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" disabled={safeUniPage <= 1} onClick={() => setUniPage((p) => Math.max(1, p - 1))}>
            Précédent
          </button>
          <span style={{ color: 'var(--text-muted)' }}>
            Page {safeUniPage} / {totalUniPages}
          </span>
          <button type="button" className="btn btn-secondary" disabled={safeUniPage >= totalUniPages} onClick={() => setUniPage((p) => Math.min(totalUniPages, p + 1))}>
            Suivant
          </button>
        </div>
      )}

      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => {
            setUniModalFiliereFilter('');
            setModal(null);
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 720, maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem' }}>{modal === 'add' ? 'Nouvelle université' : "Modifier l'université"}</h2>
            <form onSubmit={handleSaveUniversite}>
              <div className="form-group">
                <label>Nom *</label>
                <input value={formUni.nom} onChange={(e) => setFormUni((f) => ({ ...f, nom: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select value={formUni.type} onChange={(e) => setFormUni((f) => ({ ...f, type: e.target.value }))}>
                  <option value="publique">Publique</option>
                  <option value="privee">Privée</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ville *</label>
                <input value={formUni.ville} onChange={(e) => setFormUni((f) => ({ ...f, ville: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={formUni.description} onChange={(e) => setFormUni((f) => ({ ...f, description: e.target.value }))} rows={4} />
              </div>
              <div className="form-group">
                <label>Filières et spécialités proposées</label>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.65rem', lineHeight: 1.45 }}>
                  Comme la <strong>page Filières</strong> : chaque <strong>spécialité</strong> (référentiel + catalogue FIGS + base) est <strong>cochable</strong>. La case{' '}
                  <strong>filière</strong> = offre de <strong>toute</strong> la filière ; sinon cochez les spécialités précises. La recherche couvre filières et libellés.
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.45rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.55rem',
                    alignItems: 'center',
                    padding: '0.55rem 0.65rem',
                    borderRadius: 10,
                    background: 'var(--surface-hover)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                    onClick={() =>
                      setFormUni((f) => ({
                        ...f,
                        filieres_entieres: filieresTree.map((x) => Number(x.id)).filter((n) => Number.isInteger(n) && n > 0),
                        sous_filiere_ids: [],
                        specialites_catalogue: [],
                      }))
                    }
                  >
                    Tout cocher
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                    onClick={() =>
                      setFormUni((f) => ({
                        ...f,
                        filieres_entieres: [],
                        sous_filiere_ids: [],
                        specialites_catalogue: [],
                      }))
                    }
                  >
                    Tout décocher
                  </button>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.15rem' }}>
                    <strong style={{ color: 'var(--text)' }}>{uniModalLinkedFiliereCount}</strong> filière
                    {uniModalLinkedFiliereCount !== 1 ? 's' : ''} liée{uniModalLinkedFiliereCount !== 1 ? 's' : ''} ·{' '}
                    <strong style={{ color: 'var(--text)' }}>{(formUni.sous_filiere_ids || []).length + (formUni.specialites_catalogue || []).length}</strong> spécialité
                    {(formUni.sous_filiere_ids || []).length + (formUni.specialites_catalogue || []).length !== 1 ? 's' : ''} au détail
                  </span>
                </div>
                <input
                  value={uniModalFiliereFilter}
                  onChange={(e) => setUniModalFiliereFilter(e.target.value)}
                  placeholder="Rechercher une filière ou une spécialité…"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    boxSizing: 'border-box',
                  }}
                />
                <div
                  style={{
                    maxHeight: 320,
                    overflowY: 'auto',
                    marginTop: '0.5rem',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  {filieresForUniModalGrouped.length === 0 ? (
                    <p style={{ margin: 0, padding: '1rem 0.85rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aucune filière ne correspond à la recherche.</p>
                  ) : (
                    filieresForUniModalGrouped.map(({ group, items }) => (
                      <div key={group} style={{ borderBottom: '1px solid var(--border)' }}>
                        <div
                          style={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: 'var(--text-muted)',
                            background: 'linear-gradient(180deg, var(--surface-hover) 0%, var(--surface) 100%)',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                          }}
                        >
                          <span>{group}</span>
                          <span style={{ fontWeight: 600, opacity: 0.85 }}>{items.length}</span>
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 288px), 1fr))',
                            gap: 0,
                            padding: '0.35rem 0.4rem 0.6rem',
                          }}
                        >
                          {items.map((f) => {
                            const fid = Number(f.id);
                            const entiere = (formUni.filieres_entieres || []).map(Number).includes(fid);
                            const specsLabels = specialitesAfficheesPourFiliere(f, catalogueTitresByGroup);
                            const hasGranular = (() => {
                              for (const sid of formUni.sous_filiere_ids || []) {
                                if (sousParentMap.get(Number(sid)) === fid) return true;
                              }
                              for (const c of formUni.specialites_catalogue || []) {
                                if (Number(c.filiere_id) === fid) return true;
                              }
                              return false;
                            })();
                            const allSpecs = specsLabels.length > 0 && specsLabels.every((label) => isSpecSelectedState(f, label, formUni));
                            const parentChecked = entiere || allSpecs;
                            const parentIndeterminate = !entiere && hasGranular && !allSpecs;
                            return (
                              <div
                                key={f.id}
                                style={{
                                  margin: 0,
                                  padding: '0.4rem 0.55rem',
                                  borderRadius: 8,
                                  fontSize: '0.88rem',
                                  lineHeight: 1.35,
                                  background: parentChecked ? 'rgba(28, 117, 183, 0.06)' : 'transparent',
                                  border: parentChecked ? '1px solid rgba(28, 117, 183, 0.2)' : '1px solid transparent',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                  <input
                                    ref={(el) => {
                                      if (el) el.indeterminate = parentIndeterminate;
                                    }}
                                    type="checkbox"
                                    checked={parentChecked}
                                    onChange={() => toggleUniversiteFiliereParent(f)}
                                    style={{ marginTop: '0.15rem', flexShrink: 0, width: 16, height: 16, cursor: 'pointer' }}
                                    aria-label={`Toute la filière ${f.nom}`}
                                  />
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.35rem' }}>
                                      <span style={{ fontWeight: parentChecked ? 600 : 500 }}>{f.nom}</span>
                                      {!f.actif ? (
                                        <span
                                          style={{
                                            display: 'inline-block',
                                            fontSize: '0.72rem',
                                            fontWeight: 600,
                                            padding: '0.12rem 0.35rem',
                                            borderRadius: 4,
                                            color: 'var(--text-muted)',
                                            border: '1px solid var(--border)',
                                            background: 'var(--surface-hover)',
                                          }}
                                        >
                                          Suspendue
                                        </span>
                                      ) : null}
                                    </div>
                                    <div
                                      role="group"
                                      aria-label={`Spécialités de la filière ${f.nom}`}
                                      style={{
                                        marginTop: '0.45rem',
                                        padding: '0.4rem 0 0.15rem 0.55rem',
                                        borderLeft: '3px solid rgba(28, 117, 183, 0.35)',
                                        background: 'rgba(0,0,0,0.02)',
                                        borderRadius: '0 8px 8px 0',
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: '0.68rem',
                                          fontWeight: 700,
                                          letterSpacing: '0.06em',
                                          textTransform: 'uppercase',
                                          color: 'var(--text-muted)',
                                          marginBottom: specsLabels.length > 0 ? '0.3rem' : '0.15rem',
                                        }}
                                      >
                                        Spécialités
                                        <span style={{ fontWeight: 600, opacity: 0.75, marginLeft: '0.35rem' }}>({specsLabels.length})</span>
                                      </div>
                                      {specsLabels.length > 0 ? (
                                        <div
                                          style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.2rem',
                                            maxHeight: 220,
                                            overflowY: 'auto',
                                            paddingRight: '0.25rem',
                                          }}
                                        >
                                          {specsLabels.map((label) => {
                                            const specChecked = entiere || isSpecSelectedState(f, label, formUni);
                                            return (
                                              <label
                                                key={`${fid}-${specCatalogKey(fid, label)}`}
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'flex-start',
                                                  gap: '0.45rem',
                                                  cursor: entiere ? 'default' : 'pointer',
                                                  fontSize: '0.8rem',
                                                  color: 'var(--text)',
                                                  lineHeight: 1.45,
                                                  margin: 0,
                                                }}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={specChecked}
                                                  disabled={entiere}
                                                  onChange={() => !entiere && toggleUniversiteSpec(f, label)}
                                                  style={{ marginTop: '0.12rem', flexShrink: 0, width: 15, height: 15 }}
                                                />
                                                <span>{label}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: '0.76rem',
                                            fontStyle: 'italic',
                                            color: 'var(--text-muted)',
                                            lineHeight: 1.4,
                                          }}
                                        >
                                          Aucune spécialité listée pour cette filière.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Image / logo</label>
                <select
                  value={formUni.logo_mode}
                  onChange={(e) => setFormUni((f) => ({ ...f, logo_mode: e.target.value, logo_file: null }))}
                >
                  <option value="none">Aucune image</option>
                  <option value="url">Par URL / chemin image</option>
                  <option value="upload">Par upload fichier</option>
                </select>
              </div>
              {formUni.logo_mode === 'url' && (
                <div className="form-group">
                  <label>URL image ou chemin local</label>
                  <input
                    value={formUni.logo_url}
                    onChange={(e) => setFormUni((f) => ({ ...f, logo_url: e.target.value }))}
                    placeholder="https://... ou /images/ecoles/nom-fichier.png"
                  />
                </div>
              )}
              {formUni.logo_mode === 'upload' && (
                <div className="form-group">
                  <label>Fichier image</label>
                  <input type="file" accept="image/*" onChange={(e) => setFormUni((f) => ({ ...f, logo_file: e.target.files?.[0] || null }))} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  Enregistrer
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setUniModalFiliereFilter('');
                    setModal(null);
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
