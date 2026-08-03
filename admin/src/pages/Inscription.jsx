import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import './Inscription.css';

const SEXES = [{ value: 'M', label: 'Homme' }, { value: 'F', label: 'Femme' }];
const FILIERE_AUTRE_VALUE = '__autre__';

export default function Inscription() {
  const [searchParams] = useSearchParams();
  const [filieres, setFilieres] = useState([]);
  const [universites, setUniversites] = useState([]);
  const [villesCampus, setVillesCampus] = useState([]);
  const [uniPreview, setUniPreview] = useState(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAutreFiliere, setIsAutreFiliere] = useState(false);

  const universiteId = searchParams.get('universite_id');
  const filiereId = searchParams.get('filiere_id');
  const type = searchParams.get('type') || 'privee';
  const niveau = searchParams.get('niveau') || '';

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: 'M',
    telephone: '',
    email: '',
    ville: '',
    niveau_etude: niveau,
    serie_bac: '',
    annee_bac: '',
    filiere_id: filiereId || '',
    filiere_autre: '',
    universite_id: universiteId || '',
    type_universite: type,
    pays_bureau: 'CI',
  });

  const backToEcole = useMemo(() => {
    if (!universiteId) return null;
    const q = new URLSearchParams();
    if (filiereId) q.set('filiere_id', filiereId);
    if (type) q.set('type', type);
    if (niveau) q.set('niveau', niveau);
    const qs = q.toString();
    return qs ? `/universite/${universiteId}?${qs}` : `/universite/${universiteId}`;
  }, [universiteId, filiereId, type, niveau]);

  useEffect(() => {
    api.filieres.list('privee').then(setFilieres);
  }, []);

  useEffect(() => {
    const uniType = type === 'publique' ? 'publique' : 'privee';
    api.universites.list({ type: uniType }).then(setUniversites);
  }, [type]);

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
      setUniPreview(null);
      return;
    }
    api.universites
      .get(String(id))
      .then((u) => {
        setUniPreview(u);
        const villes = Array.from(
          new Set((u.campuses || []).map((c) => (c.ville || '').trim()).filter(Boolean))
        );
        if (!villes.length && u.ville) villes.push(u.ville);
        setVillesCampus(villes);
      })
      .catch(() => {
        setVillesCampus([]);
        setUniPreview(null);
      });
  }, [form.universite_id]);

  const filiereLabel = useMemo(() => {
    if (form.filiere_autre?.trim()) return form.filiere_autre.trim();
    const f = filieres.find((x) => String(x.id) === String(form.filiere_id));
    return f?.nom || null;
  }, [filieres, form.filiere_id, form.filiere_autre]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const hasFiliere = Boolean(form.filiere_id) || Boolean(form.filiere_autre.trim());
    if (
      !form.nom ||
      !form.prenom ||
      !form.date_naissance ||
      !form.telephone ||
      !form.email ||
      !form.ville ||
      !hasFiliere ||
      !form.universite_id
    ) {
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
      setError(err.message || "Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="ins-page">
        <div className="ins-success">
          <div className="ins-success__card">
            <div className="ins-success__icon" aria-hidden>
              ✓
            </div>
            <h1 className="ins-success__title">Demande enregistrée</h1>
            <p className="ins-success__text">
              Votre demande d&apos;inscription a bien été transmise. Notre équipe FIGS pourra revenir vers vous dans les
              meilleurs délais.
            </p>
            <div className="ins-success__actions">
              <Link to="/" className="btn btn-primary">
                Retour à l&apos;accueil
              </Link>
              {backToEcole ? (
                <Link to={backToEcole} className="btn btn-secondary">
                  Fiche de l&apos;école
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ins-page">
      <header className="ins-hero">
        <div className="ins-hero__bg" aria-hidden />
        <div className="ins-hero__inner">
          <Link to={backToEcole || '/filieres'} className="ins-back">
            ← {backToEcole ? "Retour à l'école" : 'Retour aux filières'}
          </Link>
          <span className="ins-hero__eyebrow">Candidature</span>
          <h1 className="ins-hero__title">Demande d&apos;inscription</h1>
          <p className="ins-hero__lead">
            Un formulaire unique pour transmettre votre dossier au bureau FIGS. Les champs marqués d&apos;un astérisque
            sont obligatoires.
          </p>
        </div>
      </header>

      <div className="ins-layout">
        <aside className="ins-aside ins-aside--strip" aria-label="Récapitulatif">
          {uniPreview ? (
            <div className="ins-recap ins-recap--strip">
              <h2 className="ins-recap__title">Votre sélection</h2>
              <div className="ins-recap__strip-inner">
                <div className="ins-recap__school">
                  {uniPreview.logoUrl ? (
                    <img
                      className="ins-recap__logo"
                      src={uniPreview.logoUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <div>
                    <p className="ins-recap__school-name">{uniPreview.nom}</p>
                    <p className="ins-recap__school-meta">{uniPreview.ville}</p>
                  </div>
                </div>
                <ul className="ins-recap__chips">
                  {type ? (
                    <li className="ins-recap__chip">
                      <span className="ins-recap__chip-k">Type</span>
                      <span className="ins-recap__chip-v">{type === 'publique' ? 'Publique' : 'Privée'}</span>
                    </li>
                  ) : null}
                  {niveau ? (
                    <li className="ins-recap__chip">
                      <span className="ins-recap__chip-k">Niveau</span>
                      <span className="ins-recap__chip-v">{niveau}</span>
                    </li>
                  ) : null}
                  {filiereLabel ? (
                    <li className="ins-recap__chip ins-recap__chip--wide">
                      <span className="ins-recap__chip-k">Filière</span>
                      <span className="ins-recap__chip-v">{filiereLabel}</span>
                    </li>
                  ) : null}
                </ul>
              </div>
              <p className="ins-note">Modifiable à tout moment dans le formulaire ci-dessous.</p>
            </div>
          ) : (
            <div className="ins-recap ins-recap--strip ins-recap--strip-simple">
              <h2 className="ins-recap__title">Accompagnement FIGS</h2>
              <p className="ins-recap__lead">
                Indiquez le bureau FIGS, votre identité et votre projet : votre demande est transmise à l&apos;équipe
                concernée.
              </p>
            </div>
          )}
        </aside>

        <div className="ins-form-wrap">
          <form className="ins-form-card" onSubmit={handleSubmit} noValidate>
            {error ? (
              <div className="ins-error" role="alert">
                {error}
              </div>
            ) : null}

            <div className="ins-form-body">
              <div className="ins-section ins-section--full ins-bureau-row">
                <div className="ins-bureau-row__intro">
                  <div className="ins-section__head">
                    <span className="ins-section__num">1</span>
                    <h2 className="ins-section__title">Votre bureau FIGS</h2>
                  </div>
                  <p className="ins-section__hint">
                    Permet d&apos;orienter votre dossier selon le bureau qui vous accompagne.
                  </p>
                </div>
                <div className="form-group ins-bureau-row__field">
                  <label htmlFor="ins-pays-bureau">Bureau FIGS d&apos;origine *</label>
                  <select
                    id="ins-pays-bureau"
                    name="pays_bureau"
                    value={form.pays_bureau}
                    onChange={handleChange}
                    required
                  >
                    <option value="CI">Côte d&apos;Ivoire (Abidjan)</option>
                    <option value="BF">Burkina Faso</option>
                  </select>
                </div>
              </div>

              <div className="ins-form-pair">
                <div className="ins-section">
                  <div className="ins-section__head">
                    <span className="ins-section__num">2</span>
                    <h2 className="ins-section__title">Identité</h2>
                  </div>
                  <div className="ins-grid-2">
                    <div className="form-group">
                      <label htmlFor="ins-nom">Nom *</label>
                      <input id="ins-nom" name="nom" value={form.nom} onChange={handleChange} required autoComplete="family-name" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="ins-prenom">Prénom *</label>
                      <input id="ins-prenom" name="prenom" value={form.prenom} onChange={handleChange} required autoComplete="given-name" />
                    </div>
                  </div>
                  <div className="ins-grid-2">
                    <div className="form-group">
                      <label htmlFor="ins-naissance">Date de naissance *</label>
                      <input
                        id="ins-naissance"
                        type="date"
                        name="date_naissance"
                        value={form.date_naissance}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="ins-sexe">Sexe *</label>
                      <select id="ins-sexe" name="sexe" value={form.sexe} onChange={handleChange}>
                        {SEXES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="ins-section">
                  <div className="ins-section__head">
                    <span className="ins-section__num">3</span>
                    <h2 className="ins-section__title">Coordonnées</h2>
                  </div>
                  <div className="ins-grid-2">
                    <div className="form-group">
                      <label htmlFor="ins-tel">Téléphone *</label>
                      <input
                        id="ins-tel"
                        type="tel"
                        name="telephone"
                        value={form.telephone}
                        onChange={handleChange}
                        required
                        autoComplete="tel"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="ins-email">Email *</label>
                      <input
                        id="ins-email"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="ins-section ins-section--full">
                <div className="ins-section__head">
                  <span className="ins-section__num">4</span>
                  <h2 className="ins-section__title">Parcours scolaire</h2>
                </div>
                <div className="ins-grid-3">
                  <div className="form-group">
                    <label htmlFor="ins-niveau">Niveau d&apos;étude</label>
                    <input
                      id="ins-niveau"
                      name="niveau_etude"
                      value={form.niveau_etude}
                      onChange={handleChange}
                      placeholder="ex. Bac+2, B2…"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ins-serie">Série du bac</label>
                    <input id="ins-serie" name="serie_bac" value={form.serie_bac} onChange={handleChange} placeholder="ex. D, C, G…" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ins-annee-bac">Année du bac</label>
                    <input id="ins-annee-bac" name="annee_bac" value={form.annee_bac} onChange={handleChange} placeholder="ex. 2023" />
                  </div>
                </div>
              </div>

              <div className="ins-section ins-section--full">
                <div className="ins-section__head">
                  <span className="ins-section__num">5</span>
                  <h2 className="ins-section__title">Projet d&apos;études</h2>
                </div>
                <div className="ins-grid-3">
                  <div className="form-group">
                    <label htmlFor="ins-filiere">Filière choisie *</label>
                    <select
                      id="ins-filiere"
                      name="filiere_id"
                      value={isAutreFiliere ? FILIERE_AUTRE_VALUE : form.filiere_id}
                      onChange={handleChange}
                      required={!form.filiere_autre}
                    >
                      <option value="">— Choisir une filière —</option>
                      {filieres.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nom}
                        </option>
                      ))}
                      <option value={FILIERE_AUTRE_VALUE}>Autre (à préciser)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="ins-uni">Université choisie *</label>
                    <select id="ins-uni" name="universite_id" value={form.universite_id} onChange={handleChange} required>
                      <option value="">— Choisir un établissement —</option>
                      {universites.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nom} ({u.ville})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="ins-ville">Ville souhaitée *</label>
                    <select
                      id="ins-ville"
                      name="ville"
                      value={form.ville}
                      onChange={handleChange}
                      required
                      disabled={!form.universite_id || villesCampus.length === 0}
                    >
                      <option value="">
                        {!form.universite_id
                          ? '— Choisir une université d’abord —'
                          : villesCampus.length
                            ? '— Choisir une ville —'
                            : 'Aucune ville disponible'}
                      </option>
                      {villesCampus.map((villeCampus) => (
                        <option key={villeCampus} value={villeCampus}>
                          {villeCampus}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {isAutreFiliere ? (
                  <div className="form-group ins-projet-autre">
                    <label htmlFor="ins-filiere-autre">Autre filière *</label>
                    <input
                      id="ins-filiere-autre"
                      name="filiere_autre"
                      value={form.filiere_autre}
                      onChange={handleChange}
                      placeholder="Précisez la filière souhaitée"
                      required={!form.filiere_id}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <input type="hidden" name="type_universite" value={form.type_universite} />
            <div className="ins-submit-wrap">
              <button type="submit" className="btn btn-primary ins-submit" disabled={loading}>
                {loading ? 'Envoi en cours…' : 'Envoyer la demande'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
