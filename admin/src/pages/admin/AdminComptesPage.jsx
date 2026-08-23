import { useEffect, useState } from 'react';
import { api } from '../../api';

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  boxSizing: 'border-box',
};

export default function AdminComptesPage() {
  const [comptes, setComptes] = useState([]);
  const [form, setForm] = useState({ nom: '', email: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    api.admin.comptes
      .list()
      .then(setComptes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.admin.comptes.create(form);
      setSuccess('Compte administrateur créé.');
      setForm({ nom: '', email: '', password: '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 style={{ marginBottom: '0.5rem' }}>Comptes administrateurs</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', maxWidth: '640px' }}>
        Créez des comptes pour permettre à d&apos;autres membres de l&apos;équipe d&apos;accéder à l&apos;espace admin.
      </p>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Nouveau compte</h2>
          {error ? (
            <div className="ins-error" role="alert" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          ) : null}
          {success ? (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(34,197,94,0.12)', borderRadius: 8 }}>
              {success}
            </div>
          ) : null}
          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Nom *</label>
            <input name="nom" value={form.nom} onChange={handleChange} required style={inputStyle} />
          </div>
          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required style={inputStyle} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Mot de passe *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              style={inputStyle}
              placeholder="8 caractères minimum"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Création…' : 'Créer le compte'}
          </button>
        </form>

        <div className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Comptes existants</h2>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>
          ) : comptes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Aucun compte.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {comptes.map((c) => (
                <li
                  key={c.id}
                  style={{
                    padding: '0.65rem 0',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>
                    <strong>{c.nom}</strong>
                    <br />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{c.email}</span>
                  </span>
                  {c.created_at ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', alignSelf: 'center' }}>
                      {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
