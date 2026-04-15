import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import './RendezVous.css';
import './DemandeOrientationFiliere.css';

export default function DemandeOrientationFiliere() {
  const [searchParams] = useSearchParams();
  const grandeFiliere = useMemo(() => (searchParams.get('grande_filiere') || '').trim(), [searchParams]);
  const specialite = useMemo(() => (searchParams.get('specialite') || '').trim(), [searchParams]);
  const retour = useMemo(() => {
    const r = (searchParams.get('retour') || '').trim();
    return r === 'publique' || r === 'privee' ? r : '';
  }, [searchParams]);

  const filieresLink = retour ? `/filieres/${retour}` : '/filieres';

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    pays_bureau: 'CI',
    besoin_orientation: true,
    message: '',
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError('');
  }, [grandeFiliere, specialite]);

  if (!grandeFiliere || !specialite) {
    return <Navigate to="/filieres" replace />;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.demandesOrientation.create({
        ...form,
        grande_filiere: grandeFiliere,
        specialite,
      });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Erreur lors de l’envoi.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="rdv-page demande-orientation-filiere-page">
        <Link to={filieresLink} style={{ color: 'var(--text-muted)', display: 'inline-block', marginBottom: '1rem' }}>
          ← Filières
        </Link>
        <div className="rdv-success card demande-orientation-success">
          <h2>Demande enregistrée</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 1rem' }}>
            FIGS a bien reçu votre demande pour le domaine <strong>{grandeFiliere}</strong> —{' '}
            <strong>{specialite}</strong>. Une alerte a été envoyée à l’équipe (e-mail et WhatsApp si le serveur est
            configuré). Nous vous recontacterons rapidement.
          </p>
          <p style={{ color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 1.25rem', fontSize: '0.95rem' }}>
            Pour poursuivre votre parcours, vous pouvez prendre rendez-vous avec un conseiller ou explorer le catalogue.
          </p>
          <div className="rdv-cta-row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/rendez-vous" className="btn btn-primary">
              Prendre rendez-vous
            </Link>
            <Link to="/catalogue-figs" className="btn btn-secondary">
              Catalogue programmes
            </Link>
            <Link to="/" className="btn btn-secondary">
              Accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rdv-page demande-orientation-filiere-page">
      <Link to={filieresLink} style={{ color: 'var(--text-muted)', display: 'inline-block', marginBottom: '1rem' }}>
        ← Retour aux filières
      </Link>
      <div className="card demande-orientation-card">
        <h1 style={{ marginTop: 0 }}>Demande d’inscription / orientation</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Ce domaine n’est pas encore relié à une filière du réseau sur le site. Indiquez vos coordonnées et validez : nous
          étudierons votre demande et vous guiderons vers les bonnes options.
        </p>
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface-hover)',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filière demandée</div>
          <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{grandeFiliere}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>Spécialité</div>
          <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{specialite}</div>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <p style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '0.95rem' }}>{error}</p>}
          <div className="rdv-grid2">
            <div className="form-group">
              <label htmlFor="do-nom">Nom *</label>
              <input id="do-nom" name="nom" value={form.nom} onChange={handleChange} required maxLength={100} autoComplete="family-name" />
            </div>
            <div className="form-group">
              <label htmlFor="do-prenom">Prénom *</label>
              <input id="do-prenom" name="prenom" value={form.prenom} onChange={handleChange} required maxLength={100} autoComplete="given-name" />
            </div>
          </div>
          <div className="rdv-grid2">
            <div className="form-group">
              <label htmlFor="do-email">E-mail *</label>
              <input id="do-email" type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label htmlFor="do-tel">Téléphone (WhatsApp possible) *</label>
              <input id="do-tel" type="tel" name="telephone" value={form.telephone} onChange={handleChange} required maxLength={40} autoComplete="tel" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="do-bureau">Bureau FIGS *</label>
            <select id="do-bureau" name="pays_bureau" value={form.pays_bureau} onChange={handleChange} required>
              <option value="CI">Côte d’Ivoire — Abidjan</option>
              <option value="BF">Burkina Faso</option>
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
            <input
              id="do-orientation"
              type="checkbox"
              name="besoin_orientation"
              checked={form.besoin_orientation}
              onChange={handleChange}
              style={{ marginTop: '0.25rem' }}
            />
            <label htmlFor="do-orientation" style={{ fontWeight: 400, cursor: 'pointer' }}>
              J’ai besoin d’un accompagnement orientation pour ce projet d’études
            </label>
          </div>
          <div className="form-group">
            <label htmlFor="do-msg">Message (optionnel)</label>
            <textarea
              id="do-msg"
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={4}
              maxLength={4000}
              placeholder="Niveau visé, ville, contraintes…"
              style={{ width: '100%', resize: 'vertical', minHeight: 100 }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Envoi…' : 'Valider ma demande'}
          </button>
        </form>
      </div>
    </div>
  );
}
