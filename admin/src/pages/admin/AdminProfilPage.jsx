import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../api';
import PasswordInput from '../../components/PasswordInput';
import ProfilePhotoPicker from '../../components/ProfilePhotoPicker';
import AdminAccountsList from '../../components/AdminAccountsList';
import AdminCreateCompteModal from '../../components/AdminCreateCompteModal';
import {
  ADMIN_ROLE_LABELS,
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

const labelStyle = { display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 };

export default function AdminProfilPage() {
  const { admin: ctxAdmin } = useOutletContext() || {};
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    whatsapp: '',
    poste: '',
    pays_bureau: '',
    photo_url: '',
    password: '',
    password_confirm: '',
  });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [comptes, setComptes] = useState([]);
  const [comptesLoading, setComptesLoading] = useState(false);
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
  const [editSaving, setEditSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [editPhotoLoading, setEditPhotoLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const normalizedRole = normalizeRole(role);
  const canManage = canManageAccounts(normalizedRole);

  const loadComptes = async () => {
    if (!canManageAccounts(normalizeRole(role))) return;
    setComptesLoading(true);
    try {
      const list = await api.admin.comptes.list();
      setComptes(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
      setComptes([]);
    } finally {
      setComptesLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { admin } = await api.admin.me();
      setEmail(admin.email || '');
      setRole(admin.role || '');
      setForm({
        nom: admin.nom || '',
        prenom: admin.prenom || '',
        telephone: admin.telephone || '',
        whatsapp: admin.whatsapp || '',
        poste: admin.poste || '',
        pays_bureau: admin.pays_bureau || '',
        photo_url: admin.photo_url || '',
        password: '',
        password_confirm: '',
      });
      if (canManageAccounts(admin.role)) {
        const list = await api.admin.comptes.list();
        setComptes(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setComptesLoading(false);
    }
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
      if (form.password && form.password !== form.password_confirm) {
        throw new Error('Les mots de passe ne correspondent pas.');
      }
      const payload = {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        whatsapp: form.whatsapp,
        poste: form.poste,
        pays_bureau: form.pays_bureau || null,
        photo_url: form.photo_url || null,
      };
      if (form.password.trim()) {
        payload.password = form.password;
        payload.password_confirm = form.password_confirm;
      }
      const res = await api.admin.profileUpdate(payload);
      setSuccess('Profil enregistré.');
      if (res.admin) {
        setForm((f) => ({
          ...f,
          nom: res.admin.nom || f.nom,
          prenom: res.admin.prenom || '',
          telephone: res.admin.telephone || '',
          whatsapp: res.admin.whatsapp || '',
          poste: res.admin.poste || '',
          pays_bureau: res.admin.pays_bureau || '',
          photo_url: res.admin.photo_url || '',
          password: '',
          password_confirm: '',
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoFile = async (file) => {
    setPhotoLoading(true);
    setError('');
    try {
      const res = await api.admin.profilePhotoUpload(file);
      setForm((f) => ({ ...f, photo_url: res.photoUrl || res.admin?.photo_url || f.photo_url }));
      setSuccess('Photo mise à jour.');
    } catch (err) {
      setError(err.message);
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleCreateSuccess = async () => {
    setSuccess('Compte créé avec succès.');
    setCreateOpen(false);
    await loadComptes();
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
    setEditSaving(true);
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
      await loadComptes();
    } catch (err) {
      setError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const photoSrc = form.photo_url || ctxAdmin?.photo_url;

  if (loading) {
    return <p style={{ color: 'var(--text-muted)' }}>Chargement du profil…</p>;
  }

  const profileForm = (
    <form onSubmit={handleSubmit} className="card admin-shell__panel admin-shell__form-card admin-profil-page__form">
      <h2 className="admin-profil-page__form-title">Mes informations</h2>
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={labelStyle}>Photo de profil</label>
        <ProfilePhotoPicker
          photoUrl={photoSrc}
          name={form.prenom || form.nom}
          onFileSelect={handlePhotoFile}
          loading={photoLoading}
        />
      </div>

      <div style={{ marginBottom: '0.85rem' }}>
        <span className={`badge ${roleBadgeClass(normalizedRole)}`}>{ADMIN_ROLE_LABELS[normalizedRole]}</span>
        <div style={{ marginTop: '0.35rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>{email}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1rem' }}>
        <div style={{ marginBottom: '0.85rem' }}>
          <label style={labelStyle}>Nom *</label>
          <input name="nom" value={form.nom} onChange={handleChange} required style={inputStyle} />
        </div>
        <div style={{ marginBottom: '0.85rem' }}>
          <label style={labelStyle}>Prénom</label>
          <input name="prenom" value={form.prenom} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={{ marginBottom: '0.85rem' }}>
          <label style={labelStyle}>Fonction / poste</label>
          <input name="poste" value={form.poste} onChange={handleChange} placeholder="Conseiller, agent…" style={inputStyle} />
        </div>
        <div style={{ marginBottom: '0.85rem' }}>
          <label style={labelStyle}>Bureau FIGS</label>
          <select name="pays_bureau" value={form.pays_bureau} onChange={handleChange} style={inputStyle}>
            <option value="">—</option>
            <option value="CI">Côte d&apos;Ivoire</option>
            <option value="BF">Burkina Faso</option>
          </select>
        </div>
        <div style={{ marginBottom: '0.85rem' }}>
          <label style={labelStyle}>Téléphone</label>
          <input name="telephone" value={form.telephone} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={{ marginBottom: '0.85rem' }}>
          <label style={labelStyle}>WhatsApp</label>
          <input name="whatsapp" value={form.whatsapp} onChange={handleChange} style={inputStyle} />
        </div>
      </div>

      <h2 style={{ fontSize: '1rem', margin: '1rem 0 0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        Changer le mot de passe
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        Laissez vide pour ne pas modifier. Saisissez deux fois le nouveau mot de passe.
      </p>
      <PasswordInput
        label="Nouveau mot de passe"
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder="8 caractères minimum"
      />
      <PasswordInput
        label="Confirmer le mot de passe"
        name="password_confirm"
        value={form.password_confirm}
        onChange={handleChange}
        placeholder="Identique au mot de passe"
      />

      <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '0.5rem' }}>
        {saving ? 'Enregistrement…' : 'Enregistrer mon profil'}
      </button>
    </form>
  );

  return (
    <>
      <div className="admin-comptes-page__head">
        <div>
          <h1 className="admin-shell__page-title" style={{ marginBottom: '0.35rem' }}>Mon profil</h1>
          <p className="admin-shell__page-desc" style={{ marginBottom: 0 }}>
            Complétez votre identité pour l&apos;équipe FIGS.
            {canManage ? ' En tant que super administrateur, vous pouvez aussi gérer les comptes de l&apos;équipe.' : null}
          </p>
        </div>
        {canManage ? (
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
        ) : null}
      </div>

      {error ? (
        <div className="ins-error" role="alert" style={{ marginBottom: '1rem' }}>{error}</div>
      ) : null}
      {success ? (
        <div className="admin-comptes-page__success">{success}</div>
      ) : null}

      {canManage ? (
        <div className="admin-profil-page__grid">
          {profileForm}
          <div className="card admin-comptes-page__list-card">
            <h2 className="admin-comptes-page__list-title">Comptes de l&apos;équipe ({comptes.length})</h2>
            <AdminAccountsList
              comptes={comptes}
              loading={comptesLoading}
              onEdit={openEdit}
            />
          </div>
        </div>
      ) : (
        profileForm
      )}

      {canManage ? (
        <AdminCreateCompteModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          creatorRole={normalizedRole}
          onSuccess={handleCreateSuccess}
        />
      ) : null}

      {editId ? (
        <div className="admin-modal-backdrop" role="presentation" onClick={closeEdit}>
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
              <button type="submit" className="btn btn-primary" disabled={editSaving}>
                {editSaving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
