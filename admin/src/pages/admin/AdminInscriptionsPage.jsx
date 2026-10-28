import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { INSCRIPTION_STATUT_LABELS, inscriptionStatutBadgeClass } from './adminConstants';

export default function AdminInscriptionsPage() {
  const [inscriptions, setInscriptions] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [universites, setUniversites] = useState([]);
  const [listState, setListState] = useState('loading');
  const [filter, setFilter] = useState({
    type: '',
    statut: '',
    filiere_id: '',
    universite_id: '',
    pays_bureau: '',
    date_debut: '',
    date_fin: '',
  });

  const loadInscriptions = useCallback(() => {
    setListState('loading');
    return api.admin
      .inscriptions(filter)
      .then((rows) => {
        setInscriptions(rows);
        setListState('ready');
      })
      .catch(() => setListState('error'));
  }, [filter]);

  useEffect(() => {
    api.admin.filieres().then(setFilieres);
    api.admin.universites().then(setUniversites);
  }, []);

  useEffect(() => {
    loadInscriptions();
  }, [loadInscriptions]);

  const handleFilterChange = (key, value) => {
    setFilter((f) => ({ ...f, [key]: value }));
  };

  return (
    <>
      <h1 className="admin-shell__page-title">Inscriptions</h1>
      <p className="admin-shell__page-desc">
        Choisissez un dossier pour ouvrir son détail.
      </p>
      <div className="admin-shell__filters">
        <select
          value={filter.statut}
          onChange={(e) => handleFilterChange('statut', e.target.value)}
        >
          <option value="">Tous statuts</option>
          {Object.entries(INSCRIPTION_STATUT_LABELS).map(([v, lab]) => (
            <option key={v} value={v}>
              {lab}
            </option>
          ))}
        </select>
        <select
          value={filter.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
        >
          <option value="">Tous types</option>
          <option value="publique">Publique</option>
          <option value="privee">Privée</option>
        </select>
        <select
          value={filter.pays_bureau}
          onChange={(e) => handleFilterChange('pays_bureau', e.target.value)}
        >
          <option value="">Tous bureaux</option>
          <option value="CI">Côte d&apos;Ivoire (Abidjan)</option>
          <option value="BF">Burkina Faso</option>
        </select>
        <select
          value={filter.filiere_id}
          onChange={(e) => handleFilterChange('filiere_id', e.target.value)}
        >
          <option value="">Toutes filières</option>
          {filieres.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nom}
            </option>
          ))}
        </select>
        <select
          value={filter.universite_id}
          onChange={(e) => handleFilterChange('universite_id', e.target.value)}
        >
          <option value="">Toutes universités</option>
          {universites.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nom}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filter.date_debut}
          onChange={(e) => handleFilterChange('date_debut', e.target.value)}
        />
        <input
          type="date"
          value={filter.date_fin}
          onChange={(e) => handleFilterChange('date_fin', e.target.value)}
        />
      </div>
      {listState === 'loading' ? (
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Chargement…</p>
      ) : listState === 'error' ? (
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Impossible de charger les inscriptions.</p>
      ) : inscriptions.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Aucune inscription.</p>
      ) : (
        <ul className="admin-tile-grid">
          {inscriptions.map((i) => {
            const track = [i.filiere_nom, i.universite_nom].filter(Boolean).join(' · ') || 'Filière non précisée';
            return (
              <li key={i.id}>
                <Link to={`/admin/inscriptions/${i.id}`} className="admin-tile">
                  <span className="admin-tile__name">
                    {i.prenom} {i.nom}
                  </span>
                  <span className="admin-tile__meta">{track}</span>
                  <span className="admin-tile__meta">
                    {i.telephone || 'Téléphone non précisé'}
                    {i.created_at ? ` · ${new Date(i.created_at).toLocaleDateString('fr-FR')}` : ''}
                  </span>
                  <span className={inscriptionStatutBadgeClass(i.statut)}>
                    {INSCRIPTION_STATUT_LABELS[i.statut] || i.statut || 'Nouveau'}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
