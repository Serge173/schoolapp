import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ArrowIcon from '../components/ArrowIcon';
import { FIGS_ABIDJAN, FIGS_BURKINA, figsRegionalWhatsAppUrl } from '../data/figsBureaus';

const WHATSAPP_PREFILL =
  'Bonjour, je contacte les bureaux FIGS Abidjan / Burkina Faso pour mon projet d’études en France.';

function WhatsAppButton() {
  return (
    <a
      href={figsRegionalWhatsAppUrl(WHATSAPP_PREFILL)}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-primary btn-arrow"
    >
      <span>Contacter les bureaux par WhatsApp</span>
      <ArrowIcon />
    </a>
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
      <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--success)' }}>Message envoyé</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Merci pour votre message. Nous vous répondrons dans les meilleurs délais.
        </p>
        <Link to="/" className="btn btn-primary">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', display: 'inline-block', marginBottom: '0.5rem' }}>
          ← Accueil
        </Link>
        <h1 style={{ marginTop: '0.5rem' }}>Contact</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          SchoolApp gère et représente les <strong>deux bureaux FIGS</strong> — <strong>Abidjan</strong> (Côte d’Ivoire){' '}
          et <strong>Burkina Faso</strong>. Retrouvez les coordonnées officielles ci-dessous ou utilisez le formulaire
          SchoolApp.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '2rem', maxWidth: 560 }}>
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1.05rem' }}>Bureau FIGS — Abidjan ({FIGS_ABIDJAN.pays})</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            Données publiées sur{' '}
            <a href={FIGS_ABIDJAN.pageBureaux} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              figs-education.com — nos bureaux
            </a>
            .
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            <strong>{FIGS_ABIDJAN.responsable}</strong>
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Email :{' '}
            <a href={`mailto:${FIGS_ABIDJAN.email}`} style={{ color: 'var(--accent)' }}>
              {FIGS_ABIDJAN.email}
            </a>
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Tél. :{' '}
            <a href={`tel:+${FIGS_ABIDJAN.phoneDigitsInternational}`} style={{ color: 'var(--accent)' }}>
              {FIGS_ABIDJAN.phoneDisplay}
            </a>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
            <WhatsAppButton />
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1.05rem' }}>Bureau FIGS — {FIGS_BURKINA.pays}</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
            Le bureau Burkina Faso est pleinement couvert par cette application : orientation et inscription selon les
            mêmes programmes FIGS, avec une adresse e-mail dédiée sur le site officiel.
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Email :{' '}
            <a href={`mailto:${FIGS_BURKINA.email}`} style={{ color: 'var(--accent)' }}>
              {FIGS_BURKINA.email}
            </a>
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.85rem', fontSize: '0.92rem' }}>
            Selon FIGS, la coordination passe par le réseau (notamment le bureau Côte d’Ivoire). La ligne WhatsApp
            ci-dessous correspond au numéro public du bureau d’Abidjan et sert aussi de contact rapide pour les dossiers
            Burkina Faso.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
            <WhatsAppButton />
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1.05rem' }}>SchoolApp — message en ligne</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Email :{' '}
            <a href={`mailto:${FIGS_ABIDJAN.email}`} style={{ color: 'var(--accent)' }}>
              {FIGS_ABIDJAN.email}
            </a>
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Horaires : du lundi au vendredi, 9h–18h (heure locale des bureaux d’Abidjan et du Burkina Faso).
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>}
          <div className="form-group">
            <label htmlFor="contact-nom">Nom *</label>
            <input id="contact-nom" name="nom" value={form.nom} onChange={handleChange} required autoComplete="name" />
          </div>
          <div className="form-group">
            <label htmlFor="contact-email">Email *</label>
            <input id="contact-email" type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" />
          </div>
          <div className="form-group">
            <label htmlFor="contact-message">Message *</label>
            <textarea
              id="contact-message"
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows={6}
              style={{ width: '100%', resize: 'vertical', minHeight: 140 }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Envoi…' : 'Envoyer le message'}
          </button>
        </form>
      </div>
    </>
  );
}
