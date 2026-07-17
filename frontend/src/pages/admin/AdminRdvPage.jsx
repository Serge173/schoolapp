import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../api';
import { RDV_CRENEAU_LABELS, RDV_STATUT_LABELS, RDV_TYPE_LABELS } from './adminConstants';

export default function AdminRdvPage() {
  const { stats, reloadStats } = useOutletContext();
  const [rdvList, setRdvList] = useState([]);
  const [rdvFilter, setRdvFilter] = useState({ statut: '', pays_bureau: '', date_debut: '', date_fin: '' });
  const [notesDraft, setNotesDraft] = useState({});

  const loadRendezVous = useCallback(
    () =>
      api.admin.rendezVous(rdvFilter).then((rows) => {
        setRdvList(rows);
        setNotesDraft((prev) => {
          const next = { ...prev };
          for (const r of rows) {
            if (next[r.id] === undefined) next[r.id] = r.notes_internes || '';
          }
          return next;
        });
      }),
    [rdvFilter]
  );

  useEffect(() => {
    loadRendezVous();
    reloadStats();
  }, [loadRendezVous, reloadStats]);

  const handleRdvFilterChange = (key, value) => {
    setRdvFilter((f) => ({ ...f, [key]: value }));
  };

  const handleRdvStatut = async (id, statut) => {
    try {
      await api.admin.rendezVousUpdate(id, { statut });
      await loadRendezVous();
      await reloadStats();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRdvNotesSave = async (id) => {
    try {
      await api.admin.rendezVousUpdate(id, { notes_internes: notesDraft[id] ?? '' });
      await loadRendezVous();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <h1 style={{ marginBottom: '1.5rem' }}>Rendez-vous</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', maxWidth: '52rem' }}>
        Gérez les demandes de rendez-vous : statut, filtres et notes internes. Les nouvelles demandes déclenchent une alerte e-mail et
        WhatsApp côté serveur (variables <code style={{ fontSize: '0.85em' }}>NOTIFY_EMAIL_TO</code>, SMTP,{' '}
        <code style={{ fontSize: '0.85em' }}>WHATSAPP_*</code>).
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <select
          value={rdvFilter.statut}
          onChange={(e) => handleRdvFilterChange('statut', e.target.value)}
          style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
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
          style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
        >
          <option value="">Tous bureaux</option>
          <option value="CI">Côte d’Ivoire</option>
          <option value="BF">Burkina Faso</option>
        </select>
        <input
          type="date"
          value={rdvFilter.date_debut}
          onChange={(e) => handleRdvFilterChange('date_debut', e.target.value)}
          style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
        />
        <input
          type="date"
          value={rdvFilter.date_fin}
          onChange={(e) => handleRdvFilterChange('date_fin', e.target.value)}
          style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
        />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => loadRendezVous().then(() => reloadStats())}
        >
          Actualiser
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Reçu</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Contact</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Bureau</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Motif</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Date souhaitée</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Créneau</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Message</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Statut</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Notes internes</th>
            </tr>
          </thead>
          <tbody>
            {rdvList.map((r) => {
              const telDigits = String(r.telephone || '').replace(/\D/g, '');
              const waHref = telDigits ? `https://wa.me/${telDigits.replace(/^0+/, '')}` : null;
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(r.created_at).toLocaleString('fr-FR')}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 600 }}>
                      {r.prenom} {r.nom}
                    </div>
                    <a href={`mailto:${encodeURIComponent(r.email)}`} style={{ fontSize: '0.88rem', color: 'var(--accent)' }}>
                      {r.email}
                    </a>
                    <div style={{ fontSize: '0.88rem', marginTop: '0.2rem' }}>
                      {r.telephone}
                      {waHref && (
                        <>
                          {' '}
                          <a href={waHref} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                            WhatsApp
                          </a>
                        </>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${r.pays_bureau === 'BF' ? 'badge-private' : 'badge-public'}`}>
                      {r.pays_bureau === 'BF' ? 'Burkina Faso' : 'Côte d’Ivoire'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{RDV_TYPE_LABELS[r.type_rdv] || r.type_rdv}</td>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                    {r.date_souhaitee
                      ? new Date(r.date_souhaitee).toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{RDV_CRENEAU_LABELS[r.creneau] || r.creneau}</td>
                  <td style={{ padding: '0.75rem', maxWidth: 200, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    {r.message ? String(r.message).slice(0, 180) + (String(r.message).length > 180 ? '…' : '') : '—'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <select
                      value={r.statut}
                      onChange={(e) => handleRdvStatut(r.id, e.target.value)}
                      style={{
                        padding: '0.35rem 0.5rem',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        color: 'var(--text)',
                        minWidth: 140,
                      }}
                    >
                      {Object.entries(RDV_STATUT_LABELS).map(([v, lab]) => (
                        <option key={v} value={v}>
                          {lab}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <textarea
                      value={notesDraft[r.id] ?? ''}
                      onChange={(e) => setNotesDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                      rows={3}
                      placeholder="Notes visibles uniquement dans le dash…"
                      style={{
                        width: '100%',
                        minWidth: 180,
                        maxWidth: 280,
                        padding: '0.4rem',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        color: 'var(--text)',
                        fontSize: '0.85rem',
                        resize: 'vertical',
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ marginTop: '0.35rem', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => handleRdvNotesSave(r.id)}
                    >
                      Enregistrer notes
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rdvList.length === 0 && <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Aucun rendez-vous pour ces filtres.</p>}
    </>
  );
}
