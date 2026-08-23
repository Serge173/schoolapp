import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../api';
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_DESCRIPTIONS,
  ADMIN_ROLES,
  canManageAccounts,
  normalizeRole,
  roleBadgeClass,
} from '../../data/adminRoles';

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  boxSizing: 'border-box',
};

function RoleBadge({ role, actif }) {
  const r = normalizeRole(role);
  return (
    <span style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <span className={`badge ${roleBadgeClass(r)}`} style={{ border: '1px solid var(--border)' }}>
        {ADMIN_ROLE_LABELS[r] || r}
      </span>
      {!actif ? (
        <span className="badge" style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.3)' }}>
          Désactivé
        </span>
      ) : null}
    </span>
  );
}

export default function AdminComptesPage() {
  const [comptes, setComptes] = useState([]);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ nom: '', email: '', password: '', role: 'conseiller' });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ nom: '', role: 'conseiller', actif: true, password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [me, list] = await Promise.all([api.admin.me(), api.admin.comptes.list()]);
      setProfile(me.admin);
      setComptes(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!loading && profile && !canManageAccounts(profile.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

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
      setSuccess('Compte créé avec succès.');
      setForm({ nom: '', email: '', password: '', role: 'conseiller' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setEditForm({ nom: c.nom, role: c.role, actif: c.actif, password: '' });
    setError('');
    setSuccess('');
  };

  const closeEdit = () => {
    setEditId(null);
    setEditForm({ nom: '', role: 'conseiller', actif: true, password: '' });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = { nom: editForm.nom, role: editForm.role, actif: editForm.actif };
      if (editForm.password.trim()) payload.password = editForm.password;
      await api.admin.comptes.update(editId, payload);
      setSuccess('Compte mis à jour.');
      closeEdit();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 style={{ marginBottom: '0.5rem' }}>Comptes & rôles</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', maxWidth: '720px' }}>
        Créez des comptes avec un rôle précis. Seul le <strong>super administrateur</strong> peut gérer les comptes.
      </p>

      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.15rem' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>Rôles disponibles</h2>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.65rem' }}>
          {ADMIN_ROLES.map((r) => (
            <li key={r} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <RoleBadge role={r} actif />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.45 }}>
                {ADMIN_ROLE_DESCRIPTIONS[r]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {error ? (
        <div className="ins-error" role="alert" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      ) : null}
      {success ? (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(34,197,94,0.12)', borderRadius: 8 }}>
          {success}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Nouveau compte</h2>
          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Nom *</label>
            <input name="nom" value={form.nom} onChange={handleChange} required style={inputStyle} />
          </div>
          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required style={inputStyle} />
          </div>
          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Rôle *</label>
            <select name="role" value={form.role} onChange={handleChange} required style={inputStyle}>
              {ADMIN_ROLES.filter((r) => r !== 'super_admin' || profile?.role === 'super_admin').map((r) => (
                <option key={r} value={r}>
                  {ADMIN_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {ADMIN_ROLE_DESCRIPTIONS[form.role]}
            </p>
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
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Comptes existants ({comptes.length})</h2>
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
                    padding: '0.75rem 0',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <strong>{c.nom}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>{c.email}</div>
                    <div style={{ marginTop: '0.45rem' }}>
                      <RoleBadge role={c.role} actif={c.actif} />
                    </div>
                    {c.created_at ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.35rem' }}>
                        Créé le {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    ) : null}
                  </div>
                  <button type="button" className="btn btn-secondary" style={{ fontSize: '0.82rem' }} onClick={() => openEdit(c)}>
                    Modifier
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {editId ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
          onClick={closeEdit}
        >
          <form
            className="card"
            style={{ width: '100%', maxWidth: 420, margin: 0 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleEditSave}
          >
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Modifier le compte</h2>
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Nom</label>
              <input
                name="nom"
                value={editForm.nom}
                onChange={(e) => setEditForm((f) => ({ ...f, nom: e.target.value }))}
                required
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Rôle</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                style={inputStyle}
              >
                {ADMIN_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ADMIN_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={editForm.actif}
                  onChange={(e) => setEditForm((f) => ({ ...f, actif: e.target.checked }))}
                />
                Compte actif
              </label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                minLength={8}
                style={inputStyle}
                placeholder="Laisser vide pour ne pas changer"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={closeEdit}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
