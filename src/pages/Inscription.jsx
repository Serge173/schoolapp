import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';

const SEXES = [{ value: 'M', label: 'Homme' }, { value: 'F', label: 'Femme' }];
const FILIERE_AUTRE_VALUE = '__autre__';

export default function Inscription() {
  const [searchParams] = useSearchParams();
  const [filieres, setFilieres] = useState([]);
  const [universites, setUniversites] = useState([]);
  const [villesCampus, setVillesCampus] = useState([]);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAutreFiliere, setIsAutreFiliere] = useState(false);

  const universiteId = searchParams.get('universite_id');
  const filiereId = searchParams.get('filiere_id');
  const type = searchParams.get('type') || 'privee';
  const niveau = searchParams.get('niveau') || '';

  const [form, setForm] = useState({
    nom: '', prenom: '', date_naissance: '', sexe: 'M',
    telephone: '', email: '', ville: '',
    niveau_etude: niveau, serie_bac: '', annee_bac: '',
    filiere_id: filiereId || '', filiere_autre: '', universite_id: universiteId || '', type_universite: type,
  });

  useEffect(() => {
    api.filieres.list('privee').then(setFilieres);
    api.universites.list({ type: 'privee' }).then(setUniversites);
  }, []);

  useEffect(() => {
    if (filiereId) setForm((f) => ({ ...f, filiere_id: filiereId }));
    if (universiteId) setForm((f) => ({ ...f, universite_id: universiteId }));
    if (type) setForm((f) => ({ ...f, type_universite: type }));
    if (niveau) setForm((f) => ({ ...f, niveau_etude: niveau }));
  }, [filiereId, universiteId, type, niveau]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'filiere_id') {
      setIsAutreFiliere(value === FILIERE_AUTRE_VALUE);
      setForm((f) => ({
        ...f,
        filiere_id: value === FILIERE_AUTRE_VALUE ? '' : value,
        filiere_autre: value === FILIERE_AUTRE_VALUE ? f.filiere_autre : '',
      }));
    } else if (name === 'universite_id') {
      setForm((f) => ({ ...f, universite_id: value, ville: '' }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
    setError('');
  };

  useEffect(() => {
    const id = Number(form.universite_id);
    if (!id) {
      setVillesCampus([]);
      return;
    }
    api.universites.get(id).then((u) => {
      const villes = Array.from(
        new Set((u.campuses || []).map((c) => (c.ville || '').trim()).filter(Boolean))
      );
      if (!villes.length && u.ville) villes.push(u.ville);
      setVillesCampus(villes);
    }).catch(() => setVillesCampus([]));
  }, [form.universite_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const hasFiliere = Boolean(form.filiere_id) || Boolean(form.filiere_autre.trim());
    if (!form.nom || !form.prenom || !form.date_naissance || !form.telephone || !form.email || !form.ville || !hasFiliere || !form.universite_id) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setLoading(true);
    try {
      await api.inscriptions.create({
        ...form,
        filiere_id: form.filiere_id || null,
      });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--success)' }}>Demande enregistrée</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Votre demande d'inscription a bien été reçue.</p>
        <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <Link to={universiteId ? `/universite/${universiteId}` : '/filieres'} style={{ color: 'var(--text-muted)', display: 'inline-block', marginBottom: '0.5rem' }}>← Retour</Link>
        <h1 style={{ marginTop: '0.5rem' }}>Demande d'inscription</h1>
        <p style={{ color: 'var(--text-muted)' }}>Remplissez le formulaire pour soumettre votre candidature.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
        {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Nom *</label>
            <input name="nom" value={form.nom} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Prénom *</label>
            <input name="prenom" value={form.prenom} onChange={handleChange} required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Date de naissance *</label>
            <input type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Sexe *</label>
            <select name="sexe" value={form.sexe} onChange={handleChange}>
              {SEXES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Téléphone *</label>
          <input type="tel" name="telephone" value={form.telephone} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Niveau d'étude</label>
          <input name="niveau_etude" value={form.niveau_etude} onChange={handleChange} placeholder="ex. Bac+2" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Série du bac</label>
            <input name="serie_bac" value={form.serie_bac} onChange={handleChange} placeholder="ex. D, C" />
          </div>
          <div className="form-group">
            <label>Année du bac</label>
            <input name="annee_bac" value={form.annee_bac} onChange={handleChange} placeholder="ex. 2023" />
          </div>
        </div>
        <div className="form-group">
          <label>Filière choisie *</label>
          <select
            name="filiere_id"
            value={isAutreFiliere ? FILIERE_AUTRE_VALUE : form.filiere_id}
            onChange={handleChange}
            required={!form.filiere_autre}
          >
            <option value="">— Choisir —</option>
            {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
            <option value={FILIERE_AUTRE_VALUE}>Autre (à préciser)</option>
          </select>
        </div>
        {isAutreFiliere && (
          <div className="form-group">
            <label>Autre filière *</label>
            <input
              name="filiere_autre"
              value={form.filiere_autre}
              onChange={handleChange}
              placeholder="Précisez la filière souhaitée"
              required={!form.filiere_id}
            />
          </div>
        )}
        <div className="form-group">
          <label>Université choisie *</label>
          <select name="universite_id" value={form.universite_id} onChange={handleChange} required>
            <option value="">— Choisir —</option>
            {universites.map((u) => <option key={u.id} value={u.id}>{u.nom} ({u.ville})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Ville choisie *</label>
          <select name="ville" value={form.ville} onChange={handleChange} required disabled={!form.universite_id || villesCampus.length === 0}>
            <option value="">
              {!form.universite_id ? '— Choisir une université d’abord —' : (villesCampus.length ? '— Choisir —' : 'Aucune ville disponible')}
            </option>
            {villesCampus.map((villeCampus) => (
              <option key={villeCampus} value={villeCampus}>
                {villeCampus}
              </option>
            ))}
          </select>
        </div>
        <input type="hidden" name="type_universite" value={form.type_universite} />
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Envoi…' : 'Envoyer la demande'}
        </button>
      </form>
    </>
  );
}
