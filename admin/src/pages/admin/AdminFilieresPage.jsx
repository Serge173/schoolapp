import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';
import AdminConfirmDialog from '../../components/AdminConfirmDialog';
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
  const [selectedSfByFiliere, setSelectedSfByFiliere] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [openFiliereId, setOpenFiliereId] = useState(null);

  const loadFilieresTree = () =>
    api.admin.filieresTree().then((rows) => {
      setFilieresTree(rows);
      setSelectedSfByFiliere((prev) => {
        const next = { ...prev };
        for (const f of rows) {
          const sous = f.sous_filieres || [];
          const cur = next[f.id];
          const stillValid = sous.some((s) => String(s.id) === String(cur));
          if (!stillValid) next[f.id] = sous[0]?.id ?? '';
        }
        return next;
      });
    });

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

  const handleDeleteFiliere = (f) => {
    setConfirm({
      title: 'Supprimer cette filière ?',
      message: `« ${f.nom} » et ses sous-filières seront retirées. Cette action est irréversible.`,
      run: async () => {
        await api.admin.filiereDelete(f.id);
        loadFilieresTree();
      },
    });
  };

  const handleCreateSousFiliere = async (filiereId) => {
    const nom = (subFiliereDraft[filiereId] || '').trim();
    if (!nom) return;
    try {
      const created = await api.admin.sousFiliereCreate(filiereId, { nom });
      setSubFiliereDraft((prev) => ({ ...prev, [filiereId]: '' }));
      if (created?.id) {
        setSelectedSfByFiliere((prev) => ({ ...prev, [filiereId]: created.id }));
      }
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

  const handleDeleteSousFiliere = (sf) => {
    setConfirm({
      title: 'Supprimer cette spécialité ?',
      message: `« ${sf.nom} » sera retirée. Cette action est irréversible.`,
      run: async () => {
        await api.admin.sousFiliereDelete(sf.id);
        loadFilieresTree();
      },
    });
  };

  const runConfirm = async () => {
    const job = confirm?.run;
    setConfirm(null);
    if (!job) return;
    try {
      await job();
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
  const openFiliere = filieresTree.find((item) => String(item.id) === String(openFiliereId)) || null;

  return (
    <>
      {openFiliere ? (
        <div className="admin-rdv-detail__top">
          <button type="button" className="btn btn-secondary" onClick={() => setOpenFiliereId(null)}>
            ← Retour
          </button>
          <div className="admin-rdv-detail__title">
            <h1 className="admin-shell__page-title">{openFiliere.nom}</h1>
            <p className="admin-shell__page-desc">
              {resolveFiliereGrandGroupe(openFiliere)} · {openFiliere.slug}
            </p>
          </div>
        </div>
      ) : (
        <>
          <h1 className="admin-shell__page-title">Filières</h1>
          <p className="admin-shell__page-desc">
            {filieresTree.filter((x) => x.actif).length} actives · {filieresTree.filter((x) => !x.actif).length} suspendues.
            Choisissez une filière pour ouvrir son détail.
          </p>
        </>
      )}

      {!openFiliere ? (
        <>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Spécialités référentiel → sous-filières</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem', lineHeight: 1.45 }}>
          Les intitulés des <strong>onze domaines</strong> (comme sur la page publique Filières) sont ajoutés en sous-filières pour chaque filière,
          selon le <strong>domaine résolu</strong> (grand groupe choisi ou auto). Les libellés déjà présents ne sont pas dupliqués. L&apos;import
          se lance aussi automatiquement à la création d&apos;une filière ou au changement de grand groupe.
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
            style={{ minWidth: 'min(100%, 160px)', maxWidth: '100%', flex: '1 1 160px', boxSizing: 'border-box', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            required
          />
          <select
            value={newFiliereGroupe}
            onChange={(e) => setNewFiliereGroupe(e.target.value)}
            style={{ minWidth: 'min(100%, 160px)', maxWidth: '100%', flex: '1 1 160px', boxSizing: 'border-box', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
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
            style={{ minWidth: 'min(100%, 160px)', maxWidth: '100%', flex: '1 1 180px', boxSizing: 'border-box', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
          <select
            value={filiereDomaineFilter}
            onChange={(e) => setFiliereDomaineFilter(e.target.value)}
            style={{ minWidth: 'min(100%, 160px)', maxWidth: '100%', flex: '1 1 160px', boxSizing: 'border-box', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
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

      {filieresVisibleCount === 0 ? (
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Aucune filière ne correspond aux filtres.</p>
      ) : (
        <ul className="admin-tile-grid">
          {filieresFilteredForAdmin.map((f) => {
            const sousCount = (f.sous_filieres || []).length;
            return (
              <li key={f.id}>
                <button type="button" className="admin-tile" onClick={() => setOpenFiliereId(f.id)}>
                  <span className="admin-tile__name">{f.nom}</span>
                  <span className="admin-tile__meta">{resolveFiliereGrandGroupe(f)}</span>
                  <span className="admin-tile__meta">
                    {sousCount} spécialité{sousCount !== 1 ? 's' : ''}
                  </span>
                  <span className={`badge ${f.actif ? 'badge-public' : 'badge-private'}`}>
                    {f.actif ? 'Actif' : 'Suspendu'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
        </>
      ) : (
        <>
          <div className="admin-rdv-detail__grid">
            <section className="admin-rdv-detail__block">
              <h2>Domaine</h2>
              <p className="admin-rdv-detail__label">Affiché sur le site</p>
              <p>{resolveFiliereGrandGroupe(openFiliere)}</p>
              <label className="admin-rdv-detail__label" htmlFor="filiere-groupe">
                Grand groupe
              </label>
              <select
                id="filiere-groupe"
                className="admin-filiere-select"
                style={{ maxWidth: '20rem', padding: '0.45rem 0.6rem', fontSize: '0.9rem' }}
                value={openFiliere.grand_groupe || ''}
                onChange={(e) => handleGrandGroupeChange(openFiliere, e.target.value)}
                aria-label={`Grand groupe pour ${openFiliere.nom}`}
              >
                <option value="">Auto (mots-clés)</option>
                {GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <p className="admin-rdv-detail__label">Statut</p>
              <span className={`badge ${openFiliere.actif ? 'badge-public' : 'badge-private'}`}>
                {openFiliere.actif ? 'Actif' : 'Suspendu'}
              </span>
            </section>
            <section className="admin-rdv-detail__block">
              <h2>Actions</h2>
              <div className="admin-filiere-detail__actions">
                <button type="button" className="btn btn-secondary" onClick={() => handleRenameFiliere(openFiliere)}>
                  Modifier le nom
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => handleToggleFiliere(openFiliere)}>
                  {openFiliere.actif ? 'Suspendre' : 'Activer'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ color: '#b91c1c', borderColor: 'rgba(220,38,38,0.35)' }}
                  onClick={() => handleDeleteFiliere(openFiliere)}
                >
                  Supprimer
                </button>
              </div>
            </section>
          </div>
          <section className="admin-rdv-detail__block admin-filiere-detail__sf">
            <h2>Spécialités</h2>
            {(() => {
              const sous = openFiliere.sous_filieres || [];
              const selectedSfId = selectedSfByFiliere[openFiliere.id] ?? sous[0]?.id ?? '';
              const selectedSf = sous.find((s) => String(s.id) === String(selectedSfId));
              return (
                <div className="admin-filiere-sf-compact">
                  {sous.length === 0 ? (
                    <span className="admin-filiere-sf-empty">Aucune spécialité</span>
                  ) : (
                    <>
                      <select
                        className="admin-filiere-select"
                        style={{ maxWidth: '100%', padding: '0.45rem 0.6rem', fontSize: '0.9rem' }}
                        value={selectedSfId}
                        onChange={(e) =>
                          setSelectedSfByFiliere((prev) => ({ ...prev, [openFiliere.id]: e.target.value }))
                        }
                        aria-label={`Spécialités de ${openFiliere.nom}`}
                      >
                        {sous.map((sf) => (
                          <option key={sf.id} value={sf.id}>
                            {sf.nom}
                          </option>
                        ))}
                      </select>
                      <span className="admin-filiere-sf-count">{sous.length} au total</span>
                    </>
                  )}
                  {selectedSf ? (
                    <div className="admin-filiere-detail__actions">
                      <button type="button" className="btn btn-secondary" onClick={() => handleRenameSousFiliere(selectedSf)}>
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ color: '#b91c1c', borderColor: 'rgba(220,38,38,0.35)' }}
                        onClick={() => handleDeleteSousFiliere(selectedSf)}
                      >
                        Supprimer
                      </button>
                    </div>
                  ) : null}
                  <div className="admin-filiere-sf-add">
                    <input
                      value={subFiliereDraft[openFiliere.id] || ''}
                      onChange={(e) => setSubFiliereDraft((prev) => ({ ...prev, [openFiliere.id]: e.target.value }))}
                      placeholder="Nouvelle spécialité"
                      aria-label={`Nouvelle spécialité pour ${openFiliere.nom}`}
                    />
                    <button type="button" className="btn btn-primary" onClick={() => handleCreateSousFiliere(openFiliere.id)}>
                      Ajouter
                    </button>
                  </div>
                </div>
              );
            })()}
          </section>
        </>
      )}
      <AdminConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel="Supprimer"
        onConfirm={runConfirm}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}
