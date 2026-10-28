import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { INSCRIPTION_STATUT_LABELS, compactFilterDate, inscriptionStatutBadgeClass } from './adminConstants';

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
        <label className={`admin-filter-sq${filter.statut ? ' is-on' : ''}`} title="Tous statuts">
          <span className="admin-filter-sq__text">
            {filter.statut ? INSCRIPTION_STATUT_LABELS[filter.statut] || filter.statut : 'Tous statuts'}
          </span>
          <select
            aria-label="Tous statuts"
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
        </label>
        <label className={`admin-filter-sq${filter.type ? ' is-on' : ''}`} title="Tous types">
          <span className="admin-filter-sq__text">{filter.type === 'publique' ? 'Publique' : filter.type === 'privee' ? 'Privée' : 'Tous types'}</span>
          <select
            aria-label="Tous types"
            value={filter.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">Tous types</option>
            <option value="publique">Publique</option>
            <option value="privee">Privée</option>
          </select>
        </label>
        <label className={`admin-filter-sq${filter.pays_bureau ? ' is-on' : ''}`} title="Tous bureaux">
          <span className="admin-filter-sq__text">
            {filter.pays_bureau === 'CI' ? 'Abidjan' : filter.pays_bureau === 'BF' ? 'Burkina' : 'Tous bureaux'}
          </span>
          <select
            aria-label="Tous bureaux"
            value={filter.pays_bureau}
            onChange={(e) => handleFilterChange('pays_bureau', e.target.value)}
          >
            <option value="">Tous bureaux</option>
            <option value="CI">Côte d&apos;Ivoire (Abidjan)</option>
            <option value="BF">Burkina Faso</option>
          </select>
        </label>
        <label className={`admin-filter-sq${filter.filiere_id ? ' is-on' : ''}`} title="Toutes filières">
          <span className="admin-filter-sq__text">
            {filter.filiere_id
              ? filieres.find((f) => String(f.id) === String(filter.filiere_id))?.nom || 'Filière'
              : 'Toutes filières'}
          </span>
          <select
            aria-label="Toutes filières"
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
        </label>
        <label className={`admin-filter-sq${filter.universite_id ? ' is-on' : ''}`} title="Toutes universités">
          <span className="admin-filter-sq__text">
            {filter.universite_id
              ? universites.find((u) => String(u.id) === String(filter.universite_id))?.nom || 'Université'
              : 'Toutes universités'}
          </span>
          <select
            aria-label="Toutes universités"
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
        </label>
        <label className={`admin-filter-sq${filter.date_debut ? ' is-on' : ''}`} title="Date de début">
          <span className="admin-filter-sq__text">{compactFilterDate(filter.date_debut, 'Début')}</span>
          <input
            type="date"
            aria-label="Date de début"
            value={filter.date_debut}
            onChange={(e) => handleFilterChange('date_debut', e.target.value)}
          />
        </label>
        <label className={`admin-filter-sq${filter.date_fin ? ' is-on' : ''}`} title="Date de fin">
          <span className="admin-filter-sq__text">{compactFilterDate(filter.date_fin, 'Fin')}</span>
          <input
            type="date"
            aria-label="Date de fin"
            value={filter.date_fin}
            onChange={(e) => handleFilterChange('date_fin', e.target.value)}
          />
        </label>
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
