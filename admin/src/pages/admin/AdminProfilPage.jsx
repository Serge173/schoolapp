import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../api';
import PasswordInput from '../../components/PasswordInput';
import ProfilePhotoPicker from '../../components/ProfilePhotoPicker';
import { ADMIN_ROLE_LABELS, normalizeRole, roleBadgeClass } from '../../data/adminRoles';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  const photoSrc = form.photo_url || ctxAdmin?.photo_url;

  if (loading) {
    return <p style={{ color: 'var(--text-muted)' }}>Chargement du profil…</p>;
  }

  return (
    <>
      <h1 className="admin-shell__page-title">Mon profil</h1>
      <p className="admin-shell__page-desc">
        Complétez votre identité pour l&apos;équipe FIGS. Vous pouvez modifier le mot de passe défini par l&apos;administrateur.
      </p>

      {error ? (
        <div className="ins-error" role="alert" style={{ marginBottom: '1rem' }}>{error}</div>
      ) : null}
      {success ? (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(34,197,94,0.12)', borderRadius: 8 }}>
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="card admin-shell__panel admin-shell__form-card">
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
          <span className={`badge ${roleBadgeClass(normalizeRole(role))}`}>{ADMIN_ROLE_LABELS[normalizeRole(role)]}</span>
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
    </>
  );
}
