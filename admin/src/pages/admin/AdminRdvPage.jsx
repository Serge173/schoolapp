import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '../../api';
import { RDV_CRENEAU_LABELS, RDV_STATUT_LABELS, RDV_TYPE_LABELS, rdvStatutBadgeClass } from './adminConstants';

function formatRdvDate(value) {
  if (!value) return 'Date non précisée';
  return new Date(value).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function AdminRdvPage() {
  const { stats, reloadStats } = useOutletContext();
  const [rdvList, setRdvList] = useState([]);
  const [listState, setListState] = useState('loading');
  const [rdvFilter, setRdvFilter] = useState({ statut: '', pays_bureau: '', date_debut: '', date_fin: '' });

  const loadRendezVous = useCallback(
    () => {
      setListState('loading');
      return api.admin
        .rendezVous(rdvFilter)
        .then((rows) => {
          setRdvList(rows);
          setListState('ready');
        })
        .catch(() => setListState('error'));
    },
    [rdvFilter]
  );

  useEffect(() => {
    loadRendezVous();
    reloadStats();
  }, [loadRendezVous, reloadStats]);

  const handleRdvFilterChange = (key, value) => {
    setRdvFilter((f) => ({ ...f, [key]: value }));
  };

  return (
    <>
      <h1 className="admin-shell__page-title">Rendez-vous</h1>
      <p className="admin-shell__page-desc">
        Choisissez une demande pour ouvrir son détail.
      </p>
      <div className="admin-shell__stat-badges">
        {['total', 'nouveau', 'a_confirmer', 'confirme', 'annule', 'termine'].map((k) => (
          <span
            key={k}
            className="badge"
            style={{
              background: k === 'nouveau' && Number(stats?.rendezVous?.nouveau) > 0 ? 'rgba(220,38,38,0.15)' : 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              padding: '0.35rem 0.65rem',
            }}
          >
            {k === 'total' ? 'Total' : RDV_STATUT_LABELS[k] || k}: {stats?.rendezVous?.[k] ?? 0}
          </span>
        ))}
      </div>
      <div className="admin-shell__filters">
        <select
          value={rdvFilter.statut}
          onChange={(e) => handleRdvFilterChange('statut', e.target.value)}
        >
          <option value="">Tous statuts</option>
          {Object.entries(RDV_STATUT_LABELS).map(([v, lab]) => (
            <option key={v} value={v}>
              {lab}
            </option>
          ))}
        </select>
        <select
          value={rdvFilter.pays_bureau}
          onChange={(e) => handleRdvFilterChange('pays_bureau', e.target.value)}
        >
          <option value="">Tous bureaux</option>
          <option value="CI">Côte d’Ivoire</option>
          <option value="BF">Burkina Faso</option>
        </select>
        <input
          type="date"
          value={rdvFilter.date_debut}
          onChange={(e) => handleRdvFilterChange('date_debut', e.target.value)}
        />
        <input
          type="date"
          value={rdvFilter.date_fin}
          onChange={(e) => handleRdvFilterChange('date_fin', e.target.value)}
        />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => loadRendezVous().then(() => reloadStats())}
        >
          Actualiser
        </button>
      </div>
      {listState === 'loading' ? (
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Chargement…</p>
      ) : listState === 'error' ? (
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Impossible de charger les rendez-vous.</p>
      ) : rdvList.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Aucun rendez-vous pour ces filtres.</p>
      ) : (
        <ul className="admin-tile-grid">
          {rdvList.map((r) => (
            <li key={r.id}>
              <Link to={`/admin/rendez-vous/${r.id}`} className="admin-tile">
                <span className="admin-tile__name">
                  {r.prenom} {r.nom}
                </span>
                <span className="admin-tile__meta">{RDV_TYPE_LABELS[r.type_rdv] || r.type_rdv}</span>
                <span className="admin-tile__meta">
                  {formatRdvDate(r.date_souhaitee)} · {RDV_CRENEAU_LABELS[r.creneau] || r.creneau}
                </span>
                <span className={rdvStatutBadgeClass(r.statut)}>
                  {RDV_STATUT_LABELS[r.statut] || r.statut}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
