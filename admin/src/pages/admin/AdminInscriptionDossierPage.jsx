import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { INSCRIPTION_STATUT_LABELS } from './adminConstants';

const FILIERE_AUTRE_VALUE = '__autre__';

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  boxSizing: 'border-box',
};

const labelStyle = { display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' };

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function formatDateTimeFr(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
}

export default function AdminInscriptionDossierPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filieres, setFilieres] = useState([]);
  const [universites, setUniversites] = useState([]);
  const [form, setForm] = useState(null);
  const [isAutreFiliere, setIsAutreFiliere] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [row, fils, unis] = await Promise.all([
        api.admin.inscriptionGet(id),
        api.admin.filieres(),
        api.admin.universites(),
      ]);
      setFilieres(fils);
      setUniversites(unis);
      const autre = !row.filiere_id && row.filiere_autre;
      setIsAutreFiliere(!!autre);
      setForm({
        nom: row.nom || '',
        prenom: row.prenom || '',
        date_naissance: String(row.date_naissance || '').slice(0, 10),
        sexe: row.sexe || 'M',
        telephone: row.telephone || '',
        email: row.email || '',
        ville: row.ville || '',
        contact: row.contact || '',
        contact_telephone: row.contact_telephone || '',
        niveau_etude: row.niveau_etude || '',
        serie_bac: row.serie_bac || '',
        annee_bac: row.annee_bac || '',
        filiere_id: row.filiere_id || '',
        filiere_autre: row.filiere_autre || '',
        universite_id: row.universite_id || '',
        type_universite: row.type_universite || 'privee',
        pays_bureau: row.pays_bureau || 'CI',
        statut: row.statut || 'nouveau',
        notes_internes: row.notes_internes || '',
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    } catch (err) {
      setError(err.message || 'Impossible de charger le dossier.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredUniversites = useMemo(
    () => universites.filter((u) => u.type === form?.type_universite),
    [universites, form?.type_universite]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'filiere_id') {
      setIsAutreFiliere(value === FILIERE_AUTRE_VALUE);
      setForm((f) => ({
        ...f,
        filiere_id: value === FILIERE_AUTRE_VALUE ? '' : value,
        filiere_autre: value === FILIERE_AUTRE_VALUE ? f.filiere_autre : '',
      }));
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...form,
        filiere_id: form.filiere_id === '' ? null : Number(form.filiere_id),
        universite_id: Number(form.universite_id),
      };
      delete payload.created_at;
      delete payload.updated_at;
      await api.admin.inscriptionUpdate(id, payload);
      setSuccess('Dossier enregistré.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--text-muted)' }}>Chargement du dossier…</p>;
  }

  if (!form) {
    return (
      <>
        <p style={{ color: 'var(--text-muted)' }}>{error || 'Dossier introuvable.'}</p>
        <Link to="/admin/inscriptions" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Retour aux inscriptions
        </Link>
      </>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/inscriptions')}>
          ← Retour
        </button>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ margin: 0, fontSize: '1.35rem' }}>Dossier d&apos;inscription n°{id}</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {form.prenom} {form.nom} · demande du {formatDateTimeFr(form.created_at)}
            {form.updated_at ? ` · modifié le ${formatDateTimeFr(form.updated_at)}` : ''}
          </p>
        </div>
      </div>

      {error ? (
        <div className="ins-error" role="alert" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      ) : null}
      {success ? (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(34,197,94,0.12)', borderRadius: 8, color: 'var(--text)' }}>
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSave} className="card" style={{ maxWidth: 900 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 1rem' }}>
          <Field label="Statut du dossier">
            <select name="statut" value={form.statut} onChange={handleChange} style={inputStyle}>
              {Object.entries(INSCRIPTION_STATUT_LABELS).map(([v, lab]) => (
                <option key={v} value={v}>
                  {lab}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Bureau FIGS">
            <select name="pays_bureau" value={form.pays_bureau} onChange={handleChange} style={inputStyle}>
              <option value="CI">Côte d&apos;Ivoire (Abidjan)</option>
              <option value="BF">Burkina Faso</option>
            </select>
          </Field>
        </div>

        <h2 style={{ fontSize: '1rem', margin: '1.25rem 0 0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          Identité
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1rem' }}>
          <Field label="Nom *">
            <input name="nom" value={form.nom} onChange={handleChange} required style={inputStyle} />
          </Field>
          <Field label="Prénom *">
            <input name="prenom" value={form.prenom} onChange={handleChange} required style={inputStyle} />
          </Field>
          <Field label="Date de naissance *">
            <input type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} required style={inputStyle} />
          </Field>
          <Field label="Sexe *">
            <select name="sexe" value={form.sexe} onChange={handleChange} style={inputStyle}>
              <option value="M">Homme</option>
              <option value="F">Femme</option>
            </select>
          </Field>
        </div>

        <h2 style={{ fontSize: '1rem', margin: '1.25rem 0 0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          Coordonnées candidat
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1rem' }}>
          <Field label="Téléphone *">
            <input name="telephone" value={form.telephone} onChange={handleChange} required style={inputStyle} />
          </Field>
          <Field label="Email *">
            <input type="email" name="email" value={form.email} onChange={handleChange} required style={inputStyle} />
          </Field>
          <Field label="Ville *">
            <input name="ville" value={form.ville} onChange={handleChange} required style={inputStyle} />
          </Field>
        </div>

        <h2 style={{ fontSize: '1rem', margin: '1.25rem 0 0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          Personne de contact
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1rem' }}>
          <Field label="Nom du contact (parent, tuteur…)">
            <input name="contact" value={form.contact} onChange={handleChange} placeholder="Optionnel" style={inputStyle} />
          </Field>
          <Field label="Téléphone du contact">
            <input name="contact_telephone" value={form.contact_telephone} onChange={handleChange} placeholder="Optionnel" style={inputStyle} />
          </Field>
        </div>

        <h2 style={{ fontSize: '1rem', margin: '1.25rem 0 0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          Parcours scolaire
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 1rem' }}>
          <Field label="Niveau d'étude">
            <input name="niveau_etude" value={form.niveau_etude} onChange={handleChange} style={inputStyle} />
          </Field>
          <Field label="Série du bac">
            <input name="serie_bac" value={form.serie_bac} onChange={handleChange} style={inputStyle} />
          </Field>
          <Field label="Année du bac">
            <input name="annee_bac" value={form.annee_bac} onChange={handleChange} style={inputStyle} />
          </Field>
        </div>

        <h2 style={{ fontSize: '1rem', margin: '1.25rem 0 0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          Projet d&apos;études
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1rem' }}>
          <Field label="Type d'établissement">
            <select name="type_universite" value={form.type_universite} onChange={handleChange} style={inputStyle}>
              <option value="privee">École privée</option>
              <option value="publique">Université publique</option>
            </select>
          </Field>
          <Field label="Université / école *">
            <select name="universite_id" value={form.universite_id} onChange={handleChange} required style={inputStyle}>
              <option value="">— Choisir —</option>
              {filteredUniversites.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Filière">
            <select
              name="filiere_id"
              value={isAutreFiliere ? FILIERE_AUTRE_VALUE : form.filiere_id}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">— Choisir —</option>
              {filieres.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
              <option value={FILIERE_AUTRE_VALUE}>Autre (à préciser)</option>
            </select>
          </Field>
          {isAutreFiliere ? (
            <Field label="Préciser la filière">
              <input name="filiere_autre" value={form.filiere_autre} onChange={handleChange} style={inputStyle} />
            </Field>
          ) : null}
        </div>

        <Field label="Notes internes (équipe FIGS)">
          <textarea
            name="notes_internes"
            value={form.notes_internes}
            onChange={handleChange}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            placeholder="Suivi, rappels, remarques…"
          />
        </Field>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/inscriptions')}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer le dossier'}
          </button>
        </div>
      </form>
    </>
  );
}
