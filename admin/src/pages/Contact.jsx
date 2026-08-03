import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ArrowIcon from '../components/ArrowIcon';
import { FIGS_ABIDJAN } from '../data/figsBureaus';
import ParlerConseillerWhatsAppLink from '../components/ParlerConseillerWhatsAppLink';
import './Contact.css';

const WHATSAPP_PREFILL =
  'Bonjour, je contacte le bureau FIGS Abidjan / Burkina Faso pour mon projet d’études en France.';

const FIGS_LOGO_URL = 'https://www.figs-education.com/_nuxt/img/FIGS_logo.aefcada.png';

function WhatsAppButton() {
  return (
    <ParlerConseillerWhatsAppLink prefillMessage={WHATSAPP_PREFILL} className="btn btn-primary btn-arrow">
      <span>Parler à un conseiller</span>
      <ArrowIcon />
    </ParlerConseillerWhatsAppLink>
  );
}

export default function Contact() {
  const [form, setForm] = useState({ nom: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nom.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      await api.contact.send(form);
      setSent(true);
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="contact-page">
        <div className="contact-success">
          <div className="contact-success-icon" aria-hidden>
            ✓
          </div>
          <h2>Message envoyé</h2>
          <p>Merci pour votre message. Nous vous répondrons dans les meilleurs délais.</p>
          <Link to="/" className="btn btn-primary">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page">
      <Link to="/" className="contact-back">
        ← Accueil
      </Link>

      <header className="contact-hero">
        <h1>Contact</h1>
        <p>
          FigsApp-Côte d'Ivoire s’adresse aux candidats depuis <strong>Abidjan</strong> et le <strong>Burkina Faso</strong>. Le
          contact FIGS est <strong>le même pour les deux</strong> (bureau Abidjan) — coordonnées ci-contre, ou formulaire
          en ligne.
        </p>
      </header>

      <div className="contact-layout">
        <aside className="contact-aside">
          <div className="contact-info-card">
            <h3>FIGS — Abidjan &amp; Burkina Faso</h3>
            <p>
              Une seule adresse e-mail et un numéro de téléphone ; deux lignes WhatsApp conseillers (même message depuis
              « Parler à un conseiller »). Données publiées sur{' '}
              <a href={FIGS_ABIDJAN.pageBureaux} target="_blank" rel="noopener noreferrer">
                figs-education.com — nos bureaux
              </a>
              .
            </p>
            <p>
              <strong>{FIGS_ABIDJAN.responsable}</strong>
            </p>
            <p>
              Email :{' '}
              <a href={`mailto:${FIGS_ABIDJAN.email}`}>{FIGS_ABIDJAN.email}</a>
            </p>
            <p>
              Tél. :{' '}
              <a href={`tel:+${FIGS_ABIDJAN.phoneDigitsInternational}`}>{FIGS_ABIDJAN.phoneDisplay}</a>
            </p>
            <p>
              WhatsApp conseillers : {FIGS_ABIDJAN.phoneDisplay} · {FIGS_ABIDJAN.phoneWhatsAppSecondaryDisplay}
            </p>
            <div className="contact-info-actions">
              <WhatsAppButton />
            </div>
          </div>

          <div className="contact-info-card contact-info-card--soft">
            <h3>Horaires &amp; réponse</h3>
            <p>
              Email :{' '}
              <a href={`mailto:${FIGS_ABIDJAN.email}`}>{FIGS_ABIDJAN.email}</a>
            </p>
            <p>
              Du lundi au vendredi, <strong>9h–18h</strong> (heure locale du bureau d’Abidjan — même contact pour le Burkina
              Faso).
            </p>
          </div>
        </aside>

        <section className="contact-main">
          <div className="contact-form-panel">
            <div
              className="contact-form-panel__watermark"
              style={{ backgroundImage: `url(${FIGS_LOGO_URL})` }}
              aria-hidden
            />
            <div className="contact-form-panel__veil" aria-hidden />
            <div className="contact-form-panel__content">
              <div className="contact-form-head">
                <h2>Écrivez-nous</h2>
                <p>Remplissez le formulaire : vos champs s’alignent sur la largeur et passent automatiquement à la ligne sur petit écran.</p>
              </div>

              <form onSubmit={handleSubmit}>
                {error ? <div className="contact-form-error">{error}</div> : null}

                <div className="contact-form-grid">
                  <div className="form-group">
                    <label htmlFor="contact-nom">Nom *</label>
                    <input
                      id="contact-nom"
                      name="nom"
                      value={form.nom}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      placeholder="Votre nom"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact-email">Email *</label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      placeholder="vous@exemple.com"
                    />
                  </div>
                  <div className="form-group contact-field-full">
                    <label htmlFor="contact-message">Message *</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Votre message…"
                    />
                  </div>
                  <div className="contact-submit-wrap">
                    <button type="submit" className="contact-submit" disabled={loading}>
                      {loading ? 'Envoi…' : 'Envoyer le message'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
