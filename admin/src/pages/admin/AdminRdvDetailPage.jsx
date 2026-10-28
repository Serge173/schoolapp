import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api } from '../../api';
import AdminConfirmDialog from '../../components/AdminConfirmDialog';
import { RDV_CRENEAU_LABELS, RDV_STATUT_LABELS, RDV_TYPE_LABELS, rdvStatutBadgeClass } from './adminConstants';
import { canWriteDossiers } from '../../data/adminRoles';

function formatWhen(value, withTime) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return withTime
    ? date.toLocaleString('fr-FR')
    : date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AdminRdvDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reloadStats, admin } = useOutletContext();
  const canEdit = canWriteDossiers(admin?.role);
  const [rdv, setRdv] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api.admin
      .rendezVousOne(id)
      .then((row) => {
        setRdv(row);
        setNotes(row.notes_internes || '');
      })
      .catch((err) => {
        setRdv(null);
        setError(err.message || 'Rendez-vous introuvable.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatut = async (statut) => {
    try {
      const updated = await api.admin.rendezVousUpdate(id, { statut });
      setRdv(updated);
      await reloadStats();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleNotesSave = async () => {
    try {
      const updated = await api.admin.rendezVousUpdate(id, { notes_internes: notes });
      setRdv(updated);
      setNotes(updated.notes_internes || '');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    setPendingDelete(false);
    try {
      await api.admin.rendezVousDelete(id);
      await reloadStats();
      navigate('/admin/rendez-vous');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>;
  }

  if (!rdv) {
    return (
      <>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/rendez-vous')}>
          ← Retour
        </button>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>{error || 'Rendez-vous introuvable.'}</p>
      </>
    );
  }

  const telDigits = String(rdv.telephone || '').replace(/\D/g, '');
  const waHref = telDigits ? `https://wa.me/${telDigits.replace(/^0+/, '')}` : null;
  const message = String(rdv.message || '').trim();

  return (
    <>
      <div className="admin-rdv-detail__top">
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/rendez-vous')}>
          ← Retour
        </button>
        <div className="admin-rdv-detail__title">
          <h1 className="admin-shell__page-title">
            {rdv.prenom} {rdv.nom}
          </h1>
          <p className="admin-shell__page-desc">Reçu le {formatWhen(rdv.created_at, true)}</p>
        </div>
        <span className={rdvStatutBadgeClass(rdv.statut)}>{RDV_STATUT_LABELS[rdv.statut] || rdv.statut}</span>
      </div>

      <div className="admin-rdv-detail__grid">
        <section className="admin-rdv-detail__block">
          <h2>Contact</h2>
          <p className="admin-rdv-detail__label">E-mail</p>
          <a className="admin-rdv__mail" href={`mailto:${encodeURIComponent(rdv.email)}`}>
            {rdv.email}
          </a>
          <p className="admin-rdv-detail__label">Téléphone</p>
          <p className="admin-rdv__phone">
            {rdv.telephone || '—'}
            {waHref ? (
              <>
                {' · '}
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </>
            ) : null}
          </p>
          <p className="admin-rdv-detail__label">Bureau</p>
          <p>{rdv.pays_bureau === 'BF' ? 'Burkina Faso' : 'Côte d’Ivoire'}</p>
        </section>

        <section className="admin-rdv-detail__block">
          <h2>Demande</h2>
          <p className="admin-rdv-detail__label">Motif</p>
          <p>{RDV_TYPE_LABELS[rdv.type_rdv] || rdv.type_rdv}</p>
          <p className="admin-rdv-detail__label">Date souhaitée</p>
          <p>{formatWhen(rdv.date_souhaitee, false)}</p>
          <p className="admin-rdv-detail__label">Créneau</p>
          <p>{RDV_CRENEAU_LABELS[rdv.creneau] || rdv.creneau}</p>
          <label className="admin-rdv__statut">
            Statut
            <select value={rdv.statut} onChange={(e) => handleStatut(e.target.value)} disabled={!canEdit}>
              {Object.entries(RDV_STATUT_LABELS).map(([v, lab]) => (
                <option key={v} value={v}>
                  {lab}
                </option>
              ))}
            </select>
          </label>
        </section>
      </div>

      <section className="admin-rdv-detail__block">
        <h2>Message</h2>
        <div className="admin-rdv__scroll">{message || 'Aucun message.'}</div>
      </section>

      <section className="admin-rdv-detail__block">
        <h2>Notes internes</h2>
        <textarea
          className="admin-rdv__notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!canEdit}
          rows={4}
          placeholder="Notes visibles uniquement dans le dash…"
        />
        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginTop: '0.55rem' }}
          onClick={handleNotesSave}
          disabled={!canEdit}
        >
          Enregistrer
        </button>
      </section>

      <div className="admin-rdv__foot">
        <button
          type="button"
          className="btn btn-secondary"
          style={{ color: '#b91c1c', borderColor: 'rgba(220,38,38,0.35)' }}
          onClick={() => setPendingDelete(true)}
          disabled={!canEdit}
        >
          Supprimer
        </button>
      </div>

      <AdminConfirmDialog
        open={pendingDelete}
        title="Supprimer ce rendez-vous ?"
        message={`${rdv.prenom} ${rdv.nom}. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(false)}
      />
    </>
  );
}
