import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../api';
import PasswordInput from '../../components/PasswordInput';
import ProfilePhotoPicker from '../../components/ProfilePhotoPicker';
import AdminAccountSummaryCard from '../../components/AdminAccountSummaryCard';
import AdminAccountsList from '../../components/AdminAccountsList';
import AdminCreateCompteModal from '../../components/AdminCreateCompteModal';
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_DESCRIPTIONS,
  ADMIN_ROLES,
  canManageAccounts,
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

function RoleLegend() {
  return (
    <div className="card admin-comptes-roles" style={{ marginBottom: '1.25rem', padding: '1rem 1.15rem' }}>
      <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>Rôles disponibles</h2>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.65rem' }}>
        {ADMIN_ROLES.map((r) => (
          <li key={r} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <span className={`badge ${roleBadgeClass(r)}`} style={{ border: '1px solid var(--border)' }}>
              {ADMIN_ROLE_LABELS[r]}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.45 }}>
              {ADMIN_ROLE_DESCRIPTIONS[r]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminComptesPage() {
  const [comptes, setComptes] = useState([]);
  const [profile, setProfile] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    nom: '',
    prenom: '',
    role: 'conseiller',
    actif: true,
    password: '',
    password_confirm: '',
    photo_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editPhotoLoading, setEditPhotoLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [me, list] = await Promise.all([api.admin.me(), api.admin.comptes.list()]);
      setProfile(me.admin);
      setComptes(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
      setComptes([]);
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

  const handleCreateSuccess = async () => {
    setSuccess('Compte créé avec succès.');
    setCreateOpen(false);
    await load();
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setEditForm({
      nom: c.nom,
      prenom: c.prenom || '',
      role: c.role,
      actif: c.actif,
      password: '',
      password_confirm: '',
      photo_url: c.photo_url || '',
    });
    setError('');
    setSuccess('');
  };

  const closeEdit = () => {
    setEditId(null);
    setEditForm({
      nom: '',
      prenom: '',
      role: 'conseiller',
      actif: true,
      password: '',
      password_confirm: '',
      photo_url: '',
    });
  };

  const handleEditPhotoSelect = async (file) => {
    if (!editId) return;
    setEditPhotoLoading(true);
    setError('');
    try {
      const res = await api.admin.comptes.photoUpload(editId, file);
      setEditForm((f) => ({ ...f, photo_url: res.photoUrl || res.admin?.photo_url || f.photo_url }));
      setSuccess('Photo mise à jour.');
    } catch (err) {
      setError(err.message);
    } finally {
      setEditPhotoLoading(false);
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editId) return;
    if (editForm.password && editForm.password !== editForm.password_confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (editForm.password && editForm.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = { nom: editForm.nom, prenom: editForm.prenom, role: editForm.role, actif: editForm.actif };
      if (editForm.password.trim()) {
        payload.password = editForm.password;
        payload.password_confirm = editForm.password_confirm;
      }
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
      <div className="admin-comptes-page__head">
        <div>
          <h1 className="admin-shell__page-title" style={{ marginBottom: '0.35rem' }}>Comptes & rôles</h1>
          <p className="admin-shell__page-desc" style={{ marginBottom: 0 }}>
            Gérez les accès de l&apos;équipe. Les utilisateurs peuvent modifier leur mot de passe dans{' '}
            <strong>Mon profil</strong>.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary admin-comptes-page__create-btn"
          onClick={() => {
            setCreateOpen(true);
            setError('');
          }}
        >
          Créer un compte
        </button>
      </div>

      <RoleLegend />

      {error ? (
        <div className="ins-error" role="alert" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="admin-comptes-page__success">{success}</div>
      ) : null}

      <div className="admin-comptes-page__grid">
        <AdminAccountSummaryCard admin={profile} title="Super administrateur" />
        <div className="card admin-comptes-page__list-card">
          <h2 className="admin-comptes-page__list-title">Comptes existants ({comptes.length})</h2>
          <AdminAccountsList
            comptes={comptes}
            loading={loading}
            onEdit={openEdit}
          />
        </div>
      </div>

      <AdminCreateCompteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        creatorRole={profile?.role}
        onSuccess={handleCreateSuccess}
      />

      {editId ? (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onClick={closeEdit}
        >
          <form
            className="admin-modal-panel card"
            style={{ width: '100%', maxWidth: 420, margin: 0 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleEditSave}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-edit-compte-title"
          >
            <div className="admin-modal-panel__head">
              <h2 id="admin-edit-compte-title" className="admin-modal-panel__title">Modifier le compte</h2>
              <button type="button" className="btn btn-secondary admin-modal-panel__close" onClick={closeEdit}>
                Fermer
              </button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
                Photo de profil
              </label>
              <ProfilePhotoPicker
                photoUrl={editForm.photo_url}
                name={editForm.prenom || editForm.nom}
                onFileSelect={handleEditPhotoSelect}
                loading={editPhotoLoading}
              />
            </div>
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
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Prénom</label>
              <input
                value={editForm.prenom}
                onChange={(e) => setEditForm((f) => ({ ...f, prenom: e.target.value }))}
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
            <PasswordInput
              label="Nouveau mot de passe"
              name="password"
              value={editForm.password}
              onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Laisser vide pour ne pas changer"
            />
            <PasswordInput
              label="Confirmer le mot de passe"
              name="password_confirm"
              value={editForm.password_confirm}
              onChange={(e) => setEditForm((f) => ({ ...f, password_confirm: e.target.value }))}
            />
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
