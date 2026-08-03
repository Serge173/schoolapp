import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import {
  GROUPS,
  GROUP_ICON_SRC,
  GROUP_SOUS_FILIERES,
  bucketCatalogueTitresByGroup,
  bucketFilieresByGroup,
  getDefaultFiliereIdForGroup,
  matchesFiliereSearch,
  mergeSpecialiteLists,
} from '../data/filieresGroupsConfig';
import './Filieres.css';

export default function Filieres() {
  const navigate = useNavigate();
  const { type: typeParam } = useParams();
  const typeSegment = typeParam || 'privee';
  const [filieres, setFilieres] = useState([]);
  const [figsPrograms, setFigsPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.filieres
      .list('privee')
      .then((data) => {
        const filtered = data.filter((f) => f.nb_privees > 0);
        setFilieres(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.programmesFigs
      .list({})
      .then((d) => setFigsPrograms(Array.isArray(d?.programs) ? d.programs : []))
      .catch(() => setFigsPrograms([]));
  }, []);

  const filieresByGroup = useMemo(() => bucketFilieresByGroup(filieres), [filieres]);

  const specialitesByGroup = useMemo(() => {
    const catalogueByG = bucketCatalogueTitresByGroup(figsPrograms);
    const out = {};
    for (const g of GROUPS) {
      out[g] = mergeSpecialiteLists(GROUP_SOUS_FILIERES[g] || [], catalogueByG[g] || []);
    }
    return out;
  }, [figsPrograms]);

  const visibleGroups = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return GROUPS;
    return GROUPS.filter((group) => {
      if (matchesFiliereSearch(group, q)) return true;
      const sous = specialitesByGroup[group] || [];
      if (sous.some((label) => matchesFiliereSearch(label, q))) return true;
      const apiList = filieresByGroup[group] || [];
      if (
        apiList.some(
          (f) => matchesFiliereSearch(f.nom, q) || (f.slug && matchesFiliereSearch(f.slug.replace(/-/g, ' '), q))
        )
      )
        return true;
      return false;
    });
  }, [searchQuery, filieresByGroup, specialitesByGroup]);

  const filierePath = (filiereId) =>
    typeParam ? `/filieres/${typeSegment}/filiere/${filiereId}` : `/filieres/filiere/${filiereId}`;

  const onSpecialiteChosen = (group, e) => {
    const value = e.target.value;
    e.target.value = '';
    if (!value) return;
    const filiereId = getDefaultFiliereIdForGroup(group, filieres);
    if (!filiereId) {
      const retour = typeSegment === 'publique' || typeSegment === 'privee' ? typeSegment : '';
      const q = new URLSearchParams({
        grande_filiere: group,
        specialite: value,
        ...(retour ? { retour } : {}),
      });
      navigate(`/demande-orientation?${q.toString()}`);
      return;
    }
    navigate(filierePath(filiereId));
  };

  if (loading) return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chargement…</p>;

  return (
    <div className="filieres-page">
      <header className="filieres-page-header">
        <Link to="/" className="filieres-back-link">
          ← Accueil
        </Link>
        <h1 className="filieres-page-title">Onze grands domaines de filières</h1>
        <p className="filieres-page-lead">
          Choisissez une <strong>spécialisation</strong> dans la liste déroulante du domaine : intitulés pédagogiques du
          site et <strong>formations du catalogue FIGS</strong>. Ensuite :{' '}
          <strong>choix du niveau</strong> (BTS, Bachelor, Master…), puis les écoles.
        </p>
        <div className="filieres-search-wrap">
          <label htmlFor="filieres-search" className="filieres-search-label">
            Rechercher une filière
          </label>
          <input
            id="filieres-search"
            type="search"
            className="filieres-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nom du domaine, spécialité, école… ou initiales (ex. info, ri, compta)"
            autoComplete="off"
            spellCheck="false"
            aria-describedby="filieres-search-hint"
          />
          <p id="filieres-search-hint" className="filieres-search-hint">
            Filtre les <strong>11 domaines</strong> : nom du domaine, une spécialité (y compris titres catalogue FIGS), une
            filière réseau (nom / slug). Les initiales des mots comptent (ex. <em>ri</em> pour Relations internationales).
          </p>
        </div>
      </header>
      {visibleGroups.length === 0 && (
        <p className="filieres-search-empty" role="status">
          Aucun domaine ne correspond à « {searchQuery.trim()} ».{' '}
          <button type="button" className="filieres-search-reset" onClick={() => setSearchQuery('')}>
            Effacer la recherche
          </button>
        </p>
      )}
      <div className="grid-cards filieres-eleven-grid">
        {visibleGroups.map((group, groupIndex) => {
          const refSous = specialitesByGroup[group] || [];
          const groupIcon = GROUP_ICON_SRC[group] || '/icons/filieres/default.svg';
          const refHeadingId = `sous-ref-h-${groupIndex}`;
          const refSelectId = `ref-sous-select-${groupIndex}`;

          return (
            <div key={group} className="card filieres-group-card">
              <div className="filieres-group-head">
                <img
                  className="filieres-group-favicon"
                  src={groupIcon}
                  alt=""
                  width={36}
                  height={36}
                  loading="lazy"
                  decoding="async"
                />
                <div className="filieres-group-head-text">
                  <h3>{group}</h3>
                  <p className="filieres-group-meta">{refSous.length} spécialisation(s)</p>
                </div>
              </div>

              <section className="filieres-sous-section" aria-labelledby={refHeadingId}>
                <h4 id={refHeadingId} className="filieres-sous-heading">
                  Spécialisations
                </h4>
                <label htmlFor={refSelectId} className="filieres-select-label">
                  Choisir une spécialité pour continuer
                </label>
                <select
                  id={refSelectId}
                  className="filieres-group-select filieres-ref-sous-select"
                  defaultValue=""
                  aria-labelledby={refHeadingId}
                  onChange={(e) => onSpecialiteChosen(group, e)}
                >
                  <option value="">
                    {refSous.length ? `— Liste (${refSous.length}) —` : 'Aucune spécialisation listée'}
                  </option>
                  {refSous.map((label) => (
                    <option key={`${group}:${label}`} value={label} title={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </section>
            </div>
          );
        })}
      </div>
      {filieres.length === 0 && (
        <p className="filieres-empty-db" role="status">
          Aucune filière avec école privée en base : le parcours après choix de spécialité ne pourra pas démarrer tant
          que des liaisons ne sont pas configurées.
        </p>
      )}
    </div>
  );
}
