import { useEffect, useState } from 'react';
import { api } from '../../api';

function formatDateFr(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTimeFr(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
}

function sexeLabel(v) {
  if (v === 'F') return 'Femme';
  if (v === 'M') return 'Homme';
  return v || '—';
}

function bureauLabel(v) {
  if (v === 'BF') return 'Burkina Faso';
  return 'Côte d’Ivoire (Abidjan)';
}

function DetailRow({ label, children }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(140px, 32%) 1fr',
        gap: '0.5rem 1rem',
        padding: '0.45rem 0',
        borderBottom: '1px solid var(--border)',
        fontSize: '0.9rem',
        alignItems: 'start',
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <div style={{ color: 'var(--text)', lineHeight: 1.45 }}>{children}</div>
    </div>
  );
}

export default function AdminInscriptionsPage() {
  const [inscriptions, setInscriptions] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [universites, setUniversites] = useState([]);
  const [filter, setFilter] = useState({
    type: '',
    filiere_id: '',
    universite_id: '',
    pays_bureau: '',
    date_debut: '',
    date_fin: '',
  });
  const [detail, setDetail] = useState(null);

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
      <h1 style={{ marginBottom: '0.5rem' }}>Inscriptions</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', maxWidth: '720px' }}>
        Chaque candidature enregistrée ici est aussi envoyée à l’équipe FIGS (deux e-mails, deux WhatsApp) si SMTP et
        l’API Meta sont configurés sur le serveur — voir <code style={{ fontSize: '0.85em' }}>backend/.env.example</code>.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <select
          value={filter.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
        >
          <option value="">Tous types</option>
          <option value="publique">Publique</option>
          <option value="privee">Privée</option>
        </select>
        <select
          value={filter.pays_bureau}
          onChange={(e) => handleFilterChange('pays_bureau', e.target.value)}
          style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
        >
          <option value="">Tous bureaux</option>
          <option value="CI">Côte d’Ivoire (Abidjan)</option>
          <option value="BF">Burkina Faso</option>
        </select>
        <select
          value={filter.filiere_id}
          onChange={(e) => handleFilterChange('filiere_id', e.target.value)}
          style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
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
          style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
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
          style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
        />
        <input
          type="date"
          value={filter.date_fin}
          onChange={(e) => handleFilterChange('date_fin', e.target.value)}
          style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
        />
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
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Bureau</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}> </th>
            </tr>
          </thead>
          <tbody>
            {inscriptions.map((i) => (
              <tr key={i.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem' }}>
                  {i.prenom} {i.nom}
                </td>
                <td style={{ padding: '0.75rem' }}>{i.telephone}</td>
                <td style={{ padding: '0.75rem' }}>{i.filiere_nom}</td>
                <td style={{ padding: '0.75rem' }}>{i.universite_nom}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span className={`badge badge-${i.type_universite === 'privee' ? 'private' : 'public'}`}>
                    {i.type_universite === 'privee' ? 'Privée' : 'Publique'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span className={`badge ${i.pays_bureau === 'BF' ? 'badge-private' : 'badge-public'}`} title="Bureau FIGS d’origine">
                    {i.pays_bureau === 'BF' ? 'Burkina Faso' : 'Côte d’Ivoire'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{new Date(i.created_at).toLocaleDateString('fr-FR')}</td>
                <td style={{ padding: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem' }} onClick={() => setDetail(i)}>
                    Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {inscriptions.length === 0 && <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Aucune inscription.</p>}

      {detail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="inscription-detail-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
            boxSizing: 'border-box',
          }}
          onClick={() => setDetail(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 560,
              maxHeight: '90vh',
              overflow: 'auto',
              margin: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <h2 id="inscription-detail-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                Dossier d’inscription
              </h2>
              <button type="button" className="btn btn-secondary" style={{ flexShrink: 0 }} onClick={() => setDetail(null)} aria-label="Fermer">
                ✕
              </button>
            </div>
            <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              <strong>
                {detail.prenom} {detail.nom}
              </strong>
              <span style={{ color: 'var(--text-muted)' }}> · demande du {formatDateTimeFr(detail.created_at)}</span>
            </p>

            <div style={{ margin: 0 }}>
              <DetailRow label="Date de naissance">{formatDateFr(detail.date_naissance)}</DetailRow>
              <DetailRow label="Sexe">{sexeLabel(detail.sexe)}</DetailRow>
              <DetailRow label="Téléphone">
                <a href={`tel:${String(detail.telephone || '').replace(/\s/g, '')}`} style={{ color: 'var(--accent)' }}>
                  {detail.telephone}
                </a>
              </DetailRow>
              <DetailRow label="E-mail">
                <a href={`mailto:${encodeURIComponent(detail.email || '')}`} style={{ color: 'var(--accent)' }}>
                  {detail.email}
                </a>
              </DetailRow>
              <DetailRow label="Ville (résidence / saisie)">{detail.ville || '—'}</DetailRow>
              <DetailRow label="Niveau d’étude visé">{detail.niveau_etude?.trim() || '—'}</DetailRow>
              <DetailRow label="Série du bac">{detail.serie_bac?.trim() || '—'}</DetailRow>
              <DetailRow label="Année du bac">{detail.annee_bac?.trim() || '—'}</DetailRow>
              <DetailRow label="Filière choisie">{detail.filiere_nom || '—'}</DetailRow>
              <DetailRow label="Université / école">
                {detail.universite_nom}
                {detail.universite_ville ? (
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    Ville de l’établissement : {detail.universite_ville}
                  </span>
                ) : null}
              </DetailRow>
              <DetailRow label="Type d’établissement">
                {detail.type_universite === 'privee' ? 'École privée' : 'Université publique'}
              </DetailRow>
              <DetailRow label="Bureau FIGS (origine)">{bureauLabel(detail.pays_bureau)}</DetailRow>
              <DetailRow label="Références internes">
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Inscription n°{detail.id} · Filière ID {detail.filiere_id ?? '—'} · Université ID {detail.universite_id}
                </span>
              </DetailRow>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-primary" onClick={() => setDetail(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
