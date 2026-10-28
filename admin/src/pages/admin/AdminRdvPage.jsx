import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../api';
import AdminConfirmDialog from '../../components/AdminConfirmDialog';
import { RDV_CRENEAU_LABELS, RDV_STATUT_LABELS, RDV_TYPE_LABELS } from './adminConstants';
import { canWriteDossiers } from '../../data/adminRoles';

export default function AdminRdvPage() {
  const { stats, reloadStats, admin } = useOutletContext();
  const canEdit = canWriteDossiers(admin?.role);
  const [rdvList, setRdvList] = useState([]);
  const [rdvFilter, setRdvFilter] = useState({ statut: '', pays_bureau: '', date_debut: '', date_fin: '' });
  const [notesDraft, setNotesDraft] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);

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

  const handleRdvDelete = async () => {
    const r = pendingDelete;
    if (!r) return;
    setPendingDelete(null);
    try {
      await api.admin.rendezVousDelete(r.id);
      await loadRendezVous();
      await reloadStats();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <h1 className="admin-shell__page-title">Rendez-vous</h1>
      <p className="admin-shell__page-desc">
        Consultez les demandes, mettez à jour le statut et ajoutez des notes internes si besoin.
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
      <ul className="admin-rdv-list">
        {rdvList.map((r) => {
          const telDigits = String(r.telephone || '').replace(/\D/g, '');
          const waHref = telDigits ? `https://wa.me/${telDigits.replace(/^0+/, '')}` : null;
          const message = String(r.message || '').trim();
          const wished = r.date_souhaitee
            ? new Date(r.date_souhaitee).toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : 'Date non précisée';
          return (
            <li key={r.id} className="admin-rdv">
              <header className="admin-rdv__head">
                <div className="admin-rdv__who">
                  <h2>
                    {r.prenom} {r.nom}
                  </h2>
                  <a className="admin-rdv__mail" href={`mailto:${encodeURIComponent(r.email)}`}>
                    {r.email}
                  </a>
                  <p className="admin-rdv__phone">
                    {r.telephone}
                    {waHref ? (
                      <>
                        {' · '}
                        <a href={waHref} target="_blank" rel="noopener noreferrer">
                          WhatsApp
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>
                <time className="admin-rdv__time" dateTime={r.created_at}>
                  {new Date(r.created_at).toLocaleString('fr-FR')}
                </time>
              </header>
              <ul className="admin-rdv__facts">
                <li>{r.pays_bureau === 'BF' ? 'Burkina Faso' : 'Côte d’Ivoire'}</li>
                <li>{RDV_TYPE_LABELS[r.type_rdv] || r.type_rdv}</li>
                <li>{wished}</li>
                <li>{RDV_CRENEAU_LABELS[r.creneau] || r.creneau}</li>
              </ul>
              <label className="admin-rdv__statut">
                Statut
                <select value={r.statut} onChange={(e) => handleRdvStatut(r.id, e.target.value)} disabled={!canEdit}>
                  {Object.entries(RDV_STATUT_LABELS).map(([v, lab]) => (
                    <option key={v} value={v}>
                      {lab}
                    </option>
                  ))}
                </select>
              </label>
              <details className="admin-rdv__panel">
                <summary>Message</summary>
                <div className="admin-rdv__scroll">{message || 'Aucun message.'}</div>
              </details>
              <details className="admin-rdv__panel">
                <summary>Notes internes</summary>
                <textarea
                  className="admin-rdv__notes"
                  value={notesDraft[r.id] ?? ''}
                  onChange={(e) => setNotesDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                  disabled={!canEdit}
                  rows={3}
                  placeholder="Notes visibles uniquement dans le dash…"
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginTop: '0.4rem', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                  onClick={() => handleRdvNotesSave(r.id)}
                  disabled={!canEdit}
                >
                  Enregistrer
                </button>
              </details>
              <div className="admin-rdv__foot">
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem', color: '#b91c1c', borderColor: 'rgba(220,38,38,0.35)' }}
                  onClick={() => setPendingDelete(r)}
                  disabled={!canEdit}
                >
                  Supprimer
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {rdvList.length === 0 && <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Aucun rendez-vous pour ces filtres.</p>}
      <AdminConfirmDialog
        open={Boolean(pendingDelete)}
        title="Supprimer ce rendez-vous ?"
        message={
          pendingDelete
            ? `${pendingDelete.prenom} ${pendingDelete.nom}. Cette action est irréversible.`
            : ''
        }
        confirmLabel="Supprimer"
        onConfirm={handleRdvDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  );
}
