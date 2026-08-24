import { useState } from 'react';
import { api } from '../api';
import PasswordInput from './PasswordInput';
import ProfilePhotoPicker from './ProfilePhotoPicker';
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_DESCRIPTIONS,
  ADMIN_ROLES,
  normalizeRole,
} from '../data/adminRoles';

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  boxSizing: 'border-box',
};

const labelStyle = { display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 };

export default function AdminCreateCompteForm({ creatorRole = 'conseiller', onSuccess, compact = false }) {
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    poste: '',
    pays_bureau: '',
    password: '',
    password_confirm: '',
    role: 'conseiller',
  });
  const [pendingCreatePhoto, setPendingCreatePhoto] = useState(null);
  const [createPhotoPreview, setCreatePhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const creator = normalizeRole(creatorRole);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleCreatePhotoSelect = (file) => {
    setPendingCreatePhoto(file);
    setCreatePhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await api.admin.comptes.create(form);
      if (pendingCreatePhoto && created?.id) {
        await api.admin.comptes.photoUpload(created.id, pendingCreatePhoto);
      }
      setForm({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        poste: '',
        pays_bureau: '',
        password: '',
        password_confirm: '',
        role: 'conseiller',
      });
      setPendingCreatePhoto(null);
      setCreatePhotoPreview('');
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? 'admin-create-compte-form admin-create-compte-form--compact' : 'card admin-create-compte-form'}>
      <h2 className="admin-create-compte-form__title">Nouveau compte</h2>
      {error ? (
        <div className="ins-error" role="alert" style={{ marginBottom: '0.75rem' }}>{error}</div>
      ) : null}
      <div style={{ marginBottom: compact ? '0.65rem' : '1rem' }}>
        <label style={labelStyle}>Photo de profil</label>
        <ProfilePhotoPicker
          photoUrl={createPhotoPreview}
          name={form.prenom || form.nom}
          onFileSelect={handleCreatePhotoSelect}
          size={compact ? 64 : 88}
        />
      </div>
      <div style={{ marginBottom: '0.85rem' }}>
        <label style={labelStyle}>Nom *</label>
        <input name="nom" value={form.nom} onChange={handleChange} required style={inputStyle} />
      </div>
      <div style={{ marginBottom: '0.85rem' }}>
        <label style={labelStyle}>Prénom</label>
        <input name="prenom" value={form.prenom} onChange={handleChange} style={inputStyle} />
      </div>
      <div style={{ marginBottom: '0.85rem' }}>
        <label style={labelStyle}>Email *</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required style={inputStyle} />
      </div>
      <div style={{ marginBottom: '0.85rem' }}>
        <label style={labelStyle}>Téléphone</label>
        <input name="telephone" value={form.telephone} onChange={handleChange} style={inputStyle} />
      </div>
      <div style={{ marginBottom: '0.85rem' }}>
        <label style={labelStyle}>Fonction</label>
        <input name="poste" value={form.poste} onChange={handleChange} style={inputStyle} />
      </div>
      <div style={{ marginBottom: '0.85rem' }}>
        <label style={labelStyle}>Bureau</label>
        <select name="pays_bureau" value={form.pays_bureau} onChange={handleChange} style={inputStyle}>
          <option value="">—</option>
          <option value="CI">Côte d&apos;Ivoire</option>
          <option value="BF">Burkina Faso</option>
        </select>
      </div>
      <div style={{ marginBottom: '0.85rem' }}>
        <label style={labelStyle}>Rôle *</label>
        <select name="role" value={form.role} onChange={handleChange} required style={inputStyle}>
          {ADMIN_ROLES.filter((r) => r !== 'super_admin' || creator === 'super_admin').map((r) => (
            <option key={r} value={r}>
              {ADMIN_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {ADMIN_ROLE_DESCRIPTIONS[form.role]}
        </p>
      </div>
      <PasswordInput
        label="Mot de passe *"
        name="password"
        value={form.password}
        onChange={handleChange}
        required
        hint="8 caractères minimum."
      />
      <PasswordInput
        label="Confirmer le mot de passe *"
        name="password_confirm"
        value={form.password_confirm}
        onChange={handleChange}
        required
      />
      <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '0.35rem' }}>
        {saving ? 'Création…' : 'Créer le compte'}
      </button>
    </form>
  );
}
