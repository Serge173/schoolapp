import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

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
      setError(err.message || 'Erreur lors de l\'envoi.');
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
        <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', display: 'inline-block', marginBottom: '0.5rem' }}>← Accueil</Link>
        <h1 style={{ marginTop: '0.5rem' }}>Contact</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Une question sur SchoolApp ou sur les parcours d’orientation ? Écrivez-nous.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '2rem', maxWidth: 560 }}>
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1.05rem' }}>Coordonnées</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Email : <a href="mailto:contact@shoolapp.com" style={{ color: 'var(--accent)' }}>contact@shoolapp.com</a>
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Horaires : du lundi au vendredi, 9h–18h (heure de Paris).
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
