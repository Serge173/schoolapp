import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ArrowIcon from '../components/ArrowIcon';
import { FIGS_ABIDJAN, figsRegionalWhatsAppUrl } from '../data/figsBureaus';
import { api } from '../api';
import './RendezVous.css';

const WHATSAPP_PREFILL =
  'Bonjour, je souhaite confirmer ou modifier un rendez-vous avec le bureau FIGS (Abidjan / Burkina Faso).';

const TYPE_OPTIONS = [
  { value: 'orientation', label: 'Orientation scolaire & parcours' },
  { value: 'inscription', label: 'Inscription / constitution de dossier' },
  { value: 'suivi', label: 'Suivi de candidature' },
  { value: 'renseignements', label: 'Renseignements généraux' },
  { value: 'autre', label: 'Autre (précisez dans le message)' },
];

const CRENEAU_OPTIONS = [
  { value: 'matin', label: 'Matin — 9h à 12h (heure locale)' },
  { value: 'apres_midi', label: 'Après-midi — 14h à 17h' },
  { value: 'flexible', label: 'Flexible — nous vous rappelons pour convenir d’un créneau' },
];

function minDateStr() {
  const t = new Date();
  return t.toISOString().slice(0, 10);
}

function maxDateStr() {
  const t = new Date();
  t.setMonth(t.getMonth() + 6);
  return t.toISOString().slice(0, 10);
}

export default function RendezVous() {
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    pays_bureau: 'CI',
    type_rdv: 'orientation',
    date_souhaitee: '',
    creneau: 'matin',
    message: '',
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dateBounds = useMemo(() => ({ min: minDateStr(), max: maxDateStr() }), []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.date_souhaitee) {
      setError('Veuillez choisir une date souhaitée.');
      return;
    }
    setLoading(true);
    try {
      await api.rendezVous.create(form);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Erreur lors de l’envoi.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="rdv-page">
        <Link to="/" style={{ color: 'var(--text-muted)', display: 'inline-block', marginBottom: '1rem' }}>
          ← Accueil
        </Link>
        <div className="rdv-success card">
          <h2>Demande enregistrée</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto' }}>
            Notre équipe FIGS a bien reçu votre demande de rendez-vous. Vous serez recontacté par téléphone ou e-mail
            pour confirmer le créneau définitif.
          </p>
          <div className="rdv-cta-row" style={{ justifyContent: 'center' }}>
            <Link to="/" className="btn btn-primary">
              Retour à l’accueil
            </Link>
            <Link to="/contact" className="btn btn-secondary">
              Contacter le bureau
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rdv-page">
      <Link to="/" style={{ color: 'var(--text-muted)', display: 'inline-block', marginBottom: '1rem' }}>
        ← Accueil
      </Link>

      <header className="rdv-hero">
        <h1>Prendre rendez-vous avec le bureau FIGS</h1>
        <p>
          Réservez un créneau d’échange avec un conseiller du bureau d’Abidjan (Côte d’Ivoire &amp; Burkina Faso) pour
          votre projet d’études en France : orientation, dossier, suivi ou questions.
        </p>
      </header>

      <div className="rdv-layout">
        <div className="rdv-form-card card">
          <h2>Formulaire de demande</h2>
          <div className="rdv-steps" aria-hidden>
            <span className="rdv-step rdv-step--active">1. Coordonnées</span>
            <span className="rdv-step">2. Motif &amp; date</span>
            <span className="rdv-step">3. Envoi</span>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <p style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '0.95rem' }}>{error}</p>
            )}

            <div className="rdv-grid2">
              <div className="form-group">
                <label htmlFor="rdv-nom">Nom *</label>
                <input id="rdv-nom" name="nom" value={form.nom} onChange={handleChange} required autoComplete="family-name" />
              </div>
              <div className="form-group">
                <label htmlFor="rdv-prenom">Prénom *</label>
                <input id="rdv-prenom" name="prenom" value={form.prenom} onChange={handleChange} required autoComplete="given-name" />
              </div>
            </div>

            <div className="rdv-grid2">
              <div className="form-group">
                <label htmlFor="rdv-email">E-mail *</label>
                <input id="rdv-email" type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" />
              </div>
              <div className="form-group">
                <label htmlFor="rdv-tel">Téléphone (WhatsApp possible) *</label>
                <input id="rdv-tel" type="tel" name="telephone" value={form.telephone} onChange={handleChange} required autoComplete="tel" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="rdv-bureau">Vous contactez le bureau depuis *</label>
              <select id="rdv-bureau" name="pays_bureau" value={form.pays_bureau} onChange={handleChange} required>
                <option value="CI">Côte d’Ivoire (Abidjan)</option>
                <option value="BF">Burkina Faso</option>
              </select>
              <p className="rdv-hint">Le contact téléphonique et l’e-mail sont les mêmes pour les deux zones (bureau Abidjan).</p>
            </div>

            <div className="form-group">
              <label htmlFor="rdv-type">Motif du rendez-vous *</label>
              <select id="rdv-type" name="type_rdv" value={form.type_rdv} onChange={handleChange} required>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rdv-grid2">
              <div className="form-group">
                <label htmlFor="rdv-date">Date souhaitée *</label>
                <input
                  id="rdv-date"
                  type="date"
                  name="date_souhaitee"
                  value={form.date_souhaitee}
                  onChange={handleChange}
                  min={dateBounds.min}
                  max={dateBounds.max}
                  required
                />
                <p className="rdv-hint">Au plus tôt aujourd’hui, dans les 6 mois. La date sera confirmée par l’équipe.</p>
              </div>
              <div className="form-group">
                <label htmlFor="rdv-creneau">Créneau préféré *</label>
                <select id="rdv-creneau" name="creneau" value={form.creneau} onChange={handleChange} required>
                  {CRENEAU_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="rdv-msg">Précisions (optionnel)</label>
              <textarea
                id="rdv-msg"
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={5}
                placeholder="Ex. disponibilités, niveau d’études, école visée, questions précises…"
                style={{ width: '100%', resize: 'vertical', minHeight: 120 }}
                maxLength={4000}
              />
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              En envoyant ce formulaire, vous acceptez d’être recontacté par FIGS / FigsApp-Côte d'Ivoire aux coordonnées fournies,
              dans le cadre de votre demande d’orientation.
            </p>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Envoi en cours…' : 'Envoyer ma demande de rendez-vous'}
            </button>
          </form>
        </div>

        <aside className="rdv-sidebar">
          <div className="rdv-side-block">
            <h3>Contact direct</h3>
            <p>
              <strong>{FIGS_ABIDJAN.responsable}</strong>
            </p>
            <p>
              <a href={`mailto:${FIGS_ABIDJAN.email}`}>{FIGS_ABIDJAN.email}</a>
            </p>
            <p>
              <a href={`tel:+${FIGS_ABIDJAN.phoneDigitsInternational}`}>{FIGS_ABIDJAN.phoneDisplay}</a>
            </p>
          </div>
          <div className="rdv-side-block rdv-side-block--light">
            <h3>Rappel</h3>
            <p>
              Les créneaux indiqués sont indicatifs. Un conseiller validera l’horaire définitif avec vous (appel, WhatsApp
              ou e-mail).
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              <a
                href={figsRegionalWhatsAppUrl(WHATSAPP_PREFILL)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-arrow"
                style={{ fontSize: '0.88rem' }}
              >
                <span>WhatsApp</span>
                <ArrowIcon />
              </a>
              <a
                href={FIGS_ABIDJAN.pageBureaux}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-arrow"
                style={{ fontSize: '0.88rem' }}
              >
                <span>Site FIGS</span>
                <ArrowIcon />
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
