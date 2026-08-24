import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { INSCRIPTION_STATUT_LABELS, inscriptionStatutBadgeClass } from './adminConstants';

export default function AdminInscriptionsPage() {
  const [inscriptions, setInscriptions] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [universites, setUniversites] = useState([]);
  const [filter, setFilter] = useState({
    type: '',
    statut: '',
    filiere_id: '',
    universite_id: '',
    pays_bureau: '',
    date_debut: '',
    date_fin: '',
  });

  const loadInscriptions = () => api.admin.inscriptions(filter).then(setInscriptions);

  useEffect(() => {
    api.admin.filieres().then(setFilieres);
    api.admin.universites().then(setUniversites);
  }, []);

  useEffect(() => {
    loadInscriptions();
  }, [filter]);

  const handleFilterChange = (key, value) => {
    setFilter((f) => ({ ...f, [key]: value }));
  };

  return (
    <>
      <h1 className="admin-shell__page-title">Inscriptions</h1>
      <p className="admin-shell__page-desc">
        Consultez et modifiez chaque dossier d&apos;inscription via « Voir ».
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
      <div className="admin-shell__table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Contact</th>
              <th>Filière</th>
              <th>Université</th>
              <th>Statut</th>
              <th>Date</th>
              <th> </th>
            </tr>
          </thead>
          <tbody>
            {inscriptions.map((i) => (
              <tr key={i.id}>
                <td>
                  {i.prenom} {i.nom}
                </td>
                <td style={{ padding: '0.75rem' }}>{i.telephone}</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {i.contact ? (
                    <>
                      {i.contact}
                      {i.contact_telephone ? (
                        <span style={{ display: 'block' }}>{i.contact_telephone}</span>
                      ) : null}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td style={{ padding: '0.75rem' }}>{i.filiere_nom}</td>
                <td style={{ padding: '0.75rem' }}>{i.universite_nom}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span className={inscriptionStatutBadgeClass(i.statut)}>
                    {INSCRIPTION_STATUT_LABELS[i.statut] || i.statut || 'Nouveau'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{new Date(i.created_at).toLocaleDateString('fr-FR')}</td>
                <td style={{ padding: '0.75rem' }}>
                  <Link
                    to={`/admin/inscriptions/${i.id}`}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem', textDecoration: 'none' }}
                  >
                    Ouvrir le dossier
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {inscriptions.length === 0 && <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Aucune inscription.</p>}
    </>
  );
}
