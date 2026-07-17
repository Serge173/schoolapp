import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';
import { GROUPS, resolveFiliereGrandGroupe } from '../../data/filieresGroupsConfig';
import './AdminFilieresPage.css';

export default function AdminFilieresPage() {
  const [filieresTree, setFilieresTree] = useState([]);
  const [newFiliereNom, setNewFiliereNom] = useState('');
  const [subFiliereDraft, setSubFiliereDraft] = useState({});
  const [searchFiliere, setSearchFiliere] = useState('');
  const [newFiliereGroupe, setNewFiliereGroupe] = useState('');
  const [showSuspendedFilieres, setShowSuspendedFilieres] = useState(true);
  const [filiereDomaineFilter, setFiliereDomaineFilter] = useState('');
  const [syncMsg, setSyncMsg] = useState('');
  const [syncAllLoading, setSyncAllLoading] = useState(false);

  const loadFilieresTree = () => api.admin.filieresTree().then(setFilieresTree);

  useEffect(() => {
    api.admin.filieresTree().then(setFilieresTree);
  }, []);

  const handleSyncAllReferentiel = async () => {
    setSyncMsg('');
    setSyncAllLoading(true);
    try {
      const r = await api.admin.filieresSyncReferentielSousAll();
      setSyncMsg(`${r.sousFilieresAdded} spécialité(s) ajoutée(s) sur ${r.filieres} filière(s).`);
      await loadFilieresTree();
    } catch (err) {
      alert(err.message);
    } finally {
      setSyncAllLoading(false);
    }
  };

  const handleCreateFiliere = async (e) => {
    e.preventDefault();
    if (!newFiliereNom.trim()) return;
    try {
      await api.admin.filiereCreate({
        nom: newFiliereNom.trim(),
        grand_groupe: newFiliereGroupe.trim() || null,
      });
      setNewFiliereNom('');
      setNewFiliereGroupe('');
      loadFilieresTree();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGrandGroupeChange = async (f, value) => {
    const grand_groupe = value === '' ? null : value;
    try {
      await api.admin.filiereSetGrandGroupe(f.id, { grand_groupe });
      await loadFilieresTree();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRenameFiliere = async (f) => {
    const nom = prompt('Nouveau nom de la filière', f.nom);
    if (!nom || !nom.trim()) return;
    try {
      await api.admin.filiereUpdate(f.id, { nom: nom.trim() });
      loadFilieresTree();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteFiliere = async (f) => {
    if (!confirm(`Supprimer la filière "${f.nom}" et ses sous-filières ?`)) return;
    try {
      await api.admin.filiereDelete(f.id);
      loadFilieresTree();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateSousFiliere = async (filiereId) => {
    const nom = (subFiliereDraft[filiereId] || '').trim();
    if (!nom) return;
    try {
      await api.admin.sousFiliereCreate(filiereId, { nom });
      setSubFiliereDraft((prev) => ({ ...prev, [filiereId]: '' }));
      loadFilieresTree();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRenameSousFiliere = async (sf) => {
    const nom = prompt('Nouveau nom de la sous-filière', sf.nom);
    if (!nom || !nom.trim()) return;
    try {
      await api.admin.sousFiliereUpdate(sf.id, { nom: nom.trim() });
      loadFilieresTree();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSousFiliere = async (sf) => {
    if (!confirm(`Supprimer la sous-filière "${sf.nom}" ?`)) return;
    try {
      await api.admin.sousFiliereDelete(sf.id);
      loadFilieresTree();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleFiliere = async (f) => {
    try {
      await api.admin.filiereToggle(f.id, !Boolean(f.actif));
      loadFilieresTree();
    } catch (err) {
      alert(err.message);
    }
  };

  const filieresSearchFiltered = useMemo(() => {
    const q = searchFiliere.trim().toLowerCase();
    return filieresTree
      .filter((f) => {
        if (!showSuspendedFilieres && !f.actif) return false;
        if (!q) return true;
        const sub = (f.sous_filieres || []).map((s) => s.nom).join(' ');
        return `${f.nom} ${f.slug} ${sub}`.toLowerCase().includes(q);
      })
      .sort((a, b) => String(a.nom).localeCompare(String(b.nom), 'fr'));
  }, [filieresTree, searchFiliere, showSuspendedFilieres]);

  const filieresByResolvedGroup = useMemo(() => {
    const out = Object.fromEntries(GROUPS.map((g) => [g, []]));
    for (const f of filieresSearchFiltered) {
      const g = resolveFiliereGrandGroupe(f);
      if (out[g]) out[g].push(f);
      else out[g] = [f];
    }
    for (const g of GROUPS) {
      out[g].sort((a, b) => String(a.nom).localeCompare(String(b.nom), 'fr'));
    }
    return out;
  }, [filieresSearchFiltered]);

  const filieresFilteredForAdmin = useMemo(() => {
    if (!filiereDomaineFilter) return filieresSearchFiltered;
    return filieresSearchFiltered.filter((f) => resolveFiliereGrandGroupe(f) === filiereDomaineFilter);
  }, [filieresSearchFiltered, filiereDomaineFilter]);

  const filieresVisibleCount = filieresFilteredForAdmin.length;

  return (
    <>
      <h1 style={{ marginBottom: '1.5rem' }}>Filières</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
        <strong>{filieresTree.length}</strong> filière(s) en base — <strong>{filieresTree.filter((x) => x.actif).length}</strong> actives,{' '}
        <strong>{filieresTree.filter((x) => !x.actif).length}</strong> suspendues. Ci-dessous : <strong>liste unique</strong> (ordre A–Z) avec
        toutes les actions. Le domaine affiché sur le site public correspond à la colonne « Domaine (site) » ; vous pouvez forcer un groupe via
        le menu ou laisser « Auto (mots-clés) ».
      </p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Spécialités référentiel → sous-filières</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem', lineHeight: 1.45 }}>
          Les intitulés des <strong>onze domaines</strong> (comme sur la page publique Filières) sont ajoutés en sous-filières pour chaque filière,
          selon le <strong>domaine résolu</strong> (grand groupe choisi ou auto). Les libellés déjà présents ne sont pas dupliqués. À la{' '}
          <strong>création</strong> d’une filière ou au <strong>changement de grand groupe</strong>, l’import partiel est aussi lancé côté serveur.
        </p>
        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.88rem' }} disabled={syncAllLoading} onClick={handleSyncAllReferentiel}>
          {syncAllLoading ? 'Import en cours…' : 'Importer pour toutes les filières'}
        </button>
        {syncMsg ? (
          <p style={{ marginTop: '0.65rem', fontSize: '0.85rem', color: 'var(--text-muted)' }} role="status">
            {syncMsg}
          </p>
        ) : null}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Créer une filière</h3>
        <form onSubmit={handleCreateFiliere} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={newFiliereNom}
            onChange={(e) => setNewFiliereNom(e.target.value)}
            placeholder="Nom de la filière"
            style={{ minWidth: 260, padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            required
          />
          <select
            value={newFiliereGroupe}
            onChange={(e) => setNewFiliereGroupe(e.target.value)}
            style={{ minWidth: 220, padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            aria-label="Grand groupe (optionnel)"
          >
            <option value="">Grand groupe — auto (mots-clés)</option>
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            Ajouter
          </button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text)' }}>
          <input type="checkbox" checked={showSuspendedFilieres} onChange={(e) => setShowSuspendedFilieres(e.target.checked)} />
          Afficher les filières suspendues
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
          <input
            value={searchFiliere}
            onChange={(e) => setSearchFiliere(e.target.value)}
            placeholder="Rechercher par nom, slug ou sous-filière"
            style={{ minWidth: 260, flex: '1 1 220px', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
          <select
            value={filiereDomaineFilter}
            onChange={(e) => setFiliereDomaineFilter(e.target.value)}
            style={{ minWidth: 240, padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            aria-label="Filtrer par grand domaine affiché sur le site"
          >
            <option value="">Tous les grands domaines</option>
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <details className="card" style={{ marginBottom: '1rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text)' }}>Grands domaines — effectifs (cliquer pour filtrer la liste)</summary>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.5rem 0 0.75rem' }}>
          Les comptes tiennent compte de la recherche et de l’option « suspendues », pas du filtre domaine ci-dessus.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
          {GROUPS.map((g) => {
            const n = filieresByResolvedGroup[g]?.length ?? 0;
            const active = filiereDomaineFilter === g;
            return (
              <button
                key={g}
                type="button"
                className={active ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.55rem' }}
                onClick={() => setFiliereDomaineFilter(active ? '' : g)}
              >
                {g} ({n})
              </button>
            );
          })}
          {filiereDomaineFilter ? (
            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.82rem' }} onClick={() => setFiliereDomaineFilter('')}>
              Réinitialiser le filtre domaine
            </button>
          ) : null}
        </div>
      </details>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.65rem', fontSize: '1.1rem' }}>
          Toutes les filières
          <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem', marginLeft: '0.35rem' }}>
            ({filieresVisibleCount} affichée{filieresVisibleCount !== 1 ? 's' : ''}
            {filiereDomaineFilter || searchFiliere.trim() || !showSuspendedFilieres ? ` sur ${filieresSearchFiltered.length} après recherche / options` : ''})
          </span>
        </h3>
        {filieresVisibleCount === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Aucune filière ne correspond aux filtres.</p>
        ) : (
          <div className="admin-filiere-table-wrap">
            <table className="admin-filiere-table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left' }}>Filière</th>
                  <th style={{ textAlign: 'left' }}>Domaine (site)</th>
                  <th style={{ textAlign: 'left' }}>Grand groupe</th>
                  <th style={{ textAlign: 'left' }}>Sous-filières</th>
                  <th style={{ textAlign: 'left' }}>Statut</th>
                  <th style={{ textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filieresFilteredForAdmin.map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ minWidth: 140 }}>
                      <strong style={{ fontSize: '0.88rem' }}>{f.nom}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.15rem', wordBreak: 'break-all' }}>{f.slug}</div>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 160 }}>
                      {resolveFiliereGrandGroupe(f)}
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <select
                        value={f.grand_groupe || ''}
                        onChange={(e) => handleGrandGroupeChange(f, e.target.value)}
                        className="admin-filiere-select"
                        aria-label={`Grand groupe pour ${f.nom}`}
                      >
                        <option value="">Auto (mots-clés)</option>
                        {GROUPS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="admin-filiere-sf-cell">
                      <div className="admin-filiere-sf-list">
                        {(f.sous_filieres || []).map((sf) => (
                          <div key={sf.id} className="admin-filiere-sf-line">
                            <span className="admin-filiere-sf-line-name">{sf.nom}</span>
                            <div className="admin-filiere-sf-line-actions">
                              <button type="button" className="admin-filiere-btn" onClick={() => handleRenameSousFiliere(sf)}>
                                Modifier
                              </button>
                              <button type="button" className="admin-filiere-btn" onClick={() => handleDeleteSousFiliere(sf)}>
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="admin-filiere-sf-add">
                          <input
                            value={subFiliereDraft[f.id] || ''}
                            onChange={(e) => setSubFiliereDraft((prev) => ({ ...prev, [f.id]: e.target.value }))}
                            placeholder="Nouvelle sous-filière"
                          />
                          <button type="button" className="admin-filiere-btn admin-filiere-btn--primary" onClick={() => handleCreateSousFiliere(f.id)}>
                            Ajouter
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${f.actif ? 'badge-public' : 'badge-private'}`} style={{ fontSize: '0.72rem' }}>
                        {f.actif ? 'Actif' : 'Suspendu'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-filiere-row-actions">
                        <button type="button" className="admin-filiere-btn" onClick={() => handleRenameFiliere(f)}>
                          Modifier
                        </button>
                        <button type="button" className="admin-filiere-btn" onClick={() => handleDeleteFiliere(f)}>
                          Supprimer
                        </button>
                        <button type="button" className="admin-filiere-btn" onClick={() => handleToggleFiliere(f)}>
                          {f.actif ? 'Suspendre' : 'Activer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
