import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';

const ECOLE_IMAGE_BY_NAME = {
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
  "SUP'DE COM": '/images/ecoles/medium_LOGO_SUPDECOM_and_RVB_1_3cfa6e6ffd_3b38beca52.png',
  VIVAMUNDI: '/images/ecoles/medium_VIVA_MUNDI_LOGO_RVB_3_bf48a63bb2_a4fb51bc01.png',
  WIS: '/images/ecoles/medium_LOGO_WIS_and_RVB_2025_WIS_VECTORISE_NOIR_4fb2d87bde.png',
};

function getUniversiteImage(u) {
  if (ECOLE_IMAGE_BY_NAME[u.nom]) return ECOLE_IMAGE_BY_NAME[u.nom];
  const src = String(u.logoUrl || '').trim();
  if (!src) return null;
  if (src.startsWith('/uploads/') || src.startsWith('/images/')) return src;
  if (/^https?:\/\//i.test(src)) return src;
  return null;
}

export default function AdminDashboard() {
  const PAGE_SIZE = 10;
  const [stats, setStats] = useState(null);
  const [inscriptions, setInscriptions] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [filieresTree, setFilieresTree] = useState([]);
  const [universites, setUniversites] = useState([]);
  const [filter, setFilter] = useState({ type: '', filiere_id: '', universite_id: '', date_debut: '', date_fin: '' });
  const [tab, setTab] = useState('inscriptions'); // inscriptions | universites | filieres
  const [modal, setModal] = useState(null); // 'add' | { id } edit
  const [formUni, setFormUni] = useState({
    nom: '',
    type: 'publique',
    ville: '',
    description: '',
    logo_mode: 'none', // none | url | upload
    logo_url: '',
    logo_file: null,
  });
  const [searchUni, setSearchUni] = useState('');
  const [uniPage, setUniPage] = useState(1);
  const [newFiliereNom, setNewFiliereNom] = useState('');
  const [subFiliereDraft, setSubFiliereDraft] = useState({});
  const [searchFiliere, setSearchFiliere] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStats = () => api.admin.stats().then(setStats);
  const loadInscriptions = () => api.admin.inscriptions(filter).then(setInscriptions);
  const loadFilieres = () => api.admin.filieres().then(setFilieres);
  const loadFilieresTree = () => api.admin.filieresTree().then(setFilieresTree);
  const loadUniversites = () => api.admin.universites().then(setUniversites);

  useEffect(() => {
    api.admin.me()
      .then(() => Promise.all([loadStats(), loadFilieres(), loadFilieresTree(), loadUniversites()]))
      .catch(() => {
        sessionStorage.removeItem('adminSession');
        window.location.href = '/admin';
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'inscriptions') loadInscriptions();
  }, [tab, filter]);

  const handleLogout = () => {
    api.admin.logout().finally(() => {
      sessionStorage.removeItem('adminSession');
      window.location.href = '/admin';
    });
  };

  const handleFilterChange = (key, value) => {
    setFilter((f) => ({ ...f, [key]: value }));
  };

  const handleCreateFiliere = async (e) => {
    e.preventDefault();
    if (!newFiliereNom.trim()) return;
    try {
      await api.admin.filiereCreate({ nom: newFiliereNom.trim() });
      setNewFiliereNom('');
      loadFilieres();
      loadFilieresTree();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRenameFiliere = async (f) => {
    const nom = prompt('Nouveau nom de la filière', f.nom);
    if (!nom || !nom.trim()) return;
    try {
      await api.admin.filiereUpdate(f.id, { nom: nom.trim() });
      loadFilieres();
      loadFilieresTree();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteFiliere = async (f) => {
    if (!confirm(`Supprimer la filière "${f.nom}" et ses sous-filières ?`)) return;
    try {
      await api.admin.filiereDelete(f.id);
      loadFilieres();
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
      loadFilieres();
      loadFilieresTree();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredFilieresTree = filieresTree.filter((f) => {
    const q = searchFiliere.trim().toLowerCase();
    if (!q) return true;
    const sub = (f.sous_filieres || []).map((s) => s.nom).join(' ');
    return `${f.nom} ${f.slug} ${sub}`.toLowerCase().includes(q);
  });

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

      if (formUni.logo_mode === 'upload' && formUni.logo_file && uniId) {
        const result = await api.admin.uploadLogo(uniId, formUni.logo_file);
        if (result?.error) throw new Error(result.error);
      }

      setModal(null);
      setFormUni({ nom: '', type: 'publique', ville: '', description: '', logo_mode: 'none', logo_url: '', logo_file: null });
      loadUniversites();
      loadStats();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUniversite = async (id) => {
    if (!confirm('Supprimer cette université ?')) return;
    try {
      await api.admin.universiteDelete(id);
      loadUniversites();
      loadStats();
      setModal(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const openEdit = (u) => {
    const rawLogo = String(u.logo || '').trim();
    const isUrlMode = /^https?:\/\//i.test(rawLogo) || /^\/?images\//i.test(rawLogo);
    setFormUni({
      nom: u.nom,
      type: u.type,
      ville: u.ville,
      description: u.description || '',
      logo_mode: isUrlMode ? 'url' : 'none',
      logo_url: isUrlMode ? rawLogo : '',
      logo_file: null,
    });
    setModal({ id: u.id });
  };

  if (loading) return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chargement…</p>;

  return (
    <div className="admin-page">
      <header className="admin-header" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/" style={{ color: 'var(--text-muted)', marginRight: '1rem' }}>Site</Link>
          <span style={{ fontWeight: 600 }}>Dashboard Admin</span>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleLogout}>Déconnexion</button>
      </header>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem', display: 'grid', gridTemplateColumns: '240px minmax(0, 1fr)', gap: '1rem' }}>
        <aside className="card" style={{ alignSelf: 'start', position: 'sticky', top: '1rem', padding: '1rem' }}>
          <h2 style={{ marginBottom: '0.85rem', fontSize: '1rem' }}>Menu admin</h2>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn ${tab === 'inscriptions' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab('inscriptions')}
              style={{ justifyContent: 'flex-start' }}
            >
              Inscriptions
            </button>
            <button
              type="button"
              className={`btn ${tab === 'universites' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab('universites')}
              style={{ justifyContent: 'flex-start' }}
            >
              Universités
            </button>
            <button
              type="button"
              className={`btn ${tab === 'filieres' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab('filieres')}
              style={{ justifyContent: 'flex-start' }}
            >
              Filières
            </button>
          </div>
        </aside>

        <main>
          <h1 style={{ marginBottom: '1.5rem' }}>Tableau de bord</h1>

          {/* Stats */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total demandes</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats?.total ?? 0}</div>
            </div>
            <div className="card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Publiques</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--public)' }}>{stats?.byType?.publique ?? 0}</div>
            </div>
            <div className="card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Privées</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--private)' }}>{stats?.byType?.privee ?? 0}</div>
            </div>
          </section>

          {tab === 'inscriptions' && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <select value={filter.type} onChange={(e) => handleFilterChange('type', e.target.value)} style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}>
                <option value="">Tous types</option>
                <option value="publique">Publique</option>
                <option value="privee">Privée</option>
              </select>
              <select value={filter.filiere_id} onChange={(e) => handleFilterChange('filiere_id', e.target.value)} style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}>
                <option value="">Toutes filières</option>
                {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
              <select value={filter.universite_id} onChange={(e) => handleFilterChange('universite_id', e.target.value)} style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}>
                <option value="">Toutes universités</option>
                {universites.map((u) => <option key={u.id} value={u.id}>{u.nom}</option>)}
              </select>
              <input type="date" value={filter.date_debut} onChange={(e) => handleFilterChange('date_debut', e.target.value)} style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} placeholder="Date début" />
              <input type="date" value={filter.date_fin} onChange={(e) => handleFilterChange('date_fin', e.target.value)} style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} placeholder="Date fin" />
              </div>
              <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Nom</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Téléphone</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Filière</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Université</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {inscriptions.map((i) => (
                    <tr key={i.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem' }}>{i.prenom} {i.nom}</td>
                      <td style={{ padding: '0.75rem' }}>{i.telephone}</td>
                      <td style={{ padding: '0.75rem' }}>{i.filiere_nom}</td>
                      <td style={{ padding: '0.75rem' }}>{i.universite_nom}</td>
                      <td style={{ padding: '0.75rem' }}><span className={`badge badge-${i.type_universite === 'privee' ? 'private' : 'public'}`}>{i.type_universite === 'privee' ? 'Privée' : 'Publique'}</span></td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{new Date(i.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              {inscriptions.length === 0 && <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Aucune inscription.</p>}
            </>
          )}

          {tab === 'universites' && (
            <>
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setModal('add');
                  setFormUni({ nom: '', type: 'publique', ville: '', description: '', logo_mode: 'none', logo_url: '', logo_file: null });
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
                        <img
                          src={getUniversiteImage(u)}
                          alt=""
                          referrerPolicy="no-referrer"
                          style={{ width: 56, height: 56, objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(28,117,183,0.08)' }} />
                      )}
                    </div>
                    <h3>{u.nom}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{u.ville} · <span className={`badge badge-${u.type === 'privee' ? 'private' : 'public'}`}>{u.type === 'privee' ? 'Privée' : 'Publique'}</span></p>
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => openEdit(u)}>Modifier</button>
                      <button type="button" className="btn btn-secondary" onClick={() => handleDeleteUniversite(u.id)}>Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
              {filteredUniversites.length === 0 && (
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Aucune école trouvée.</p>
              )}
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
            </>
          )}

          {tab === 'filieres' && (
            <>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>Créer une filière</h3>
                <form onSubmit={handleCreateFiliere} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <input
                    value={newFiliereNom}
                    onChange={(e) => setNewFiliereNom(e.target.value)}
                    placeholder="Nom de la filière"
                    style={{ minWidth: 260, padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    required
                  />
                  <button type="submit" className="btn btn-primary">Ajouter</button>
                </form>
              </div>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <input
                  value={searchFiliere}
                  onChange={(e) => setSearchFiliere(e.target.value)}
                  placeholder="Rechercher filière par nom ou mot-clé"
                  style={{ minWidth: 300, width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                />
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Filière</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Sous-filières</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Statut</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Gestion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFilieresTree.map((f) => (
                      <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', minWidth: 220 }}>
                          <strong>{f.nom}</strong>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{f.slug}</div>
                        </td>
                        <td style={{ padding: '0.75rem', minWidth: 320 }}>
                          <div style={{ display: 'grid', gap: '0.35rem' }}>
                            {(f.sous_filieres || []).map((sf) => (
                              <div key={sf.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.35rem 0.5rem' }}>
                                <span>{sf.nom}</span>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                  <button type="button" className="btn btn-secondary" onClick={() => handleRenameSousFiliere(sf)}>Modifier</button>
                                  <button type="button" className="btn btn-secondary" onClick={() => handleDeleteSousFiliere(sf)}>Supprimer</button>
                                </div>
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <input
                                value={subFiliereDraft[f.id] || ''}
                                onChange={(e) => setSubFiliereDraft((prev) => ({ ...prev, [f.id]: e.target.value }))}
                                placeholder="Nouvelle sous-filière"
                                style={{ minWidth: 210, padding: '0.45rem 0.6rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                              />
                              <button type="button" className="btn btn-primary" onClick={() => handleCreateSousFiliere(f.id)}>Ajouter</button>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`badge ${f.actif ? 'badge-public' : 'badge-private'}`}>{f.actif ? 'Actif' : 'Suspendu'}</span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => handleRenameFiliere(f)}>Modifier</button>
                            <button type="button" className="btn btn-secondary" onClick={() => handleDeleteFiliere(f)}>Supprimer</button>
                            <button type="button" className="btn btn-secondary" onClick={() => handleToggleFiliere(f)}>
                              {f.actif ? 'Suspendre' : 'Activer'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredFilieresTree.length === 0 && (
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Aucune filière trouvée.</p>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal Add/Edit Université */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setModal(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem' }}>{modal === 'add' ? 'Nouvelle université' : 'Modifier l\'université'}</h2>
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
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormUni((f) => ({ ...f, logo_file: e.target.files?.[0] || null }))}
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
