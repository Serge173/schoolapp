import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import {
  assignProgramToGroup,
  getDefaultFiliereIdForGroup,
} from '../data/filieresGroupsConfig';
import { resolveUniversiteIdForProgram } from '../utils/figsProgramToUniversite';
import './CatalogueProgrammes.css';

function Field({ label, children }) {
  if (children == null || children === '') return null;
  return (
    <div className="figs-prog-field">
      <span className="figs-prog-field__label">{label}</span>
      <span className="figs-prog-field__value">{children}</span>
    </div>
  );
}

const KNOWN_ORDER = [
  ['titreVisaGrade', 'Titre / visa de grade'],
  ['certificateur', 'Certificateur'],
  ['codeRncp', 'Code RNCP'],
  ['dateValiditeRncp', 'Validite titre RNCP'],
  ['rythme', 'Rythme'],
  ['onlineOffline', 'Presentiel / distanciel'],
  ['classeDedieeFigs', 'Classe dediee FIGS'],
  ['repartitionCoursEntreprise', 'Repartition cours / entreprise'],
  ['dureeStage', 'Duree de stage'],
  ['rentreeAdmin', 'Rentree administrative'],
  ['debutCours', 'Debut des cours'],
  ['retardJusqua', 'Retard autorise jusqu’au'],
  ['prixFigs', 'Prix FIGS'],
  ['priceAfterScholarship', 'Apres bourse'],
  ['prixNPlus1', 'Prix N+1 (indicatif)'],
  ['commentaires', 'Commentaires / profil'],
  ['prerequis', 'Prerequis'],
];

export default function CatalogueProgrammeFiche() {
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [universites, setUniversites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.programmesFigs.get(id),
      api.filieres.list('privee'),
      api.universites.list({ type: 'privee' }),
    ])
      .then(([figs, fils, univs]) => {
        if (cancelled) return;
        setProgram(figs.program);
        setFilieres(fils);
        setUniversites(univs);
        setErr('');
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message || 'Erreur de chargement');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const group = program ? assignProgramToGroup(program) : '';
  const filiereId = useMemo(() => {
    if (!program || !filieres.length) return null;
    return getDefaultFiliereIdForGroup(group, filieres);
  }, [program, filieres, group]);

  const universiteId = useMemo(() => {
    if (!program || !universites.length) return null;
    return resolveUniversiteIdForProgram(program, universites);
  }, [program, universites]);

  const inscriptionHref = useMemo(() => {
    const q = new URLSearchParams({ type: 'privee' });
    if (filiereId) q.set('filiere_id', String(filiereId));
    if (universiteId) q.set('universite_id', String(universiteId));
    return `/inscription?${q.toString()}`;
  }, [filiereId, universiteId]);

  const ecolesHref = filiereId ? `/filieres/privee/filiere/${filiereId}/ecoles` : null;

  const extraFields = useMemo(() => {
    if (!program) return [];
    const known = new Set(KNOWN_ORDER.map(([k]) => k).concat(['id']));
    return Object.keys(program)
      .filter((k) => !known.has(k))
      .map((k) => [k, k]);
  }, [program]);

  return (
    <div className="figs-catalogue figs-fiche">
      <Link to="/catalogue-figs" className="figs-catalogue__back">
        ← Catalogue FIGS
      </Link>

      {loading && <p className="figs-catalogue__loading">Chargement…</p>}
      {err && <p className="figs-catalogue__err">{err}</p>}

      {!loading && !err && program && (
        <>
          <header className="figs-fiche__hero card">
            <p className="figs-fiche__group">Grand groupe : {group}</p>
            <h1 className="figs-fiche__title">{program.titreVisaGrade}</h1>
            <p className="figs-prog__cert" style={{ marginBottom: '0.75rem' }}>
              {program.certificateur}
            </p>
            <div className="figs-prog__badges">
              {program.classeDedieeFigs === 'Oui' && (
                <span className="figs-badge figs-badge--figs">Classe dediee FIGS</span>
              )}
              {program.rythme && <span className="figs-badge">{program.rythme}</span>}
              {program.onlineOffline && <span className="figs-badge figs-badge--muted">{program.onlineOffline}</span>}
              {program.codeRncp && (
                <span className="figs-badge figs-badge--code">RNCP {program.codeRncp}</span>
              )}
            </div>
            <div className="figs-fiche__actions">
              <Link className="btn btn-primary" to={inscriptionHref}>
                Continuer l’inscription
              </Link>
              {ecolesHref && (
                <Link className="btn btn-secondary" to={ecolesHref}>
                  Voir les ecoles de la filiere
                </Link>
              )}
              {!filiereId && (
                <span className="figs-fiche__hint">
                  Filiere non associee automatiquement : choisissez votre domaine sur la page{' '}
                  <Link to="/filieres/privee">Filières</Link>.
                </span>
              )}
            </div>
          </header>

          <section className="figs-prog card figs-fiche__detail">
            <h2 className="figs-fiche__h2">Fiche complete</h2>
            <div className="figs-prog__grid">
              <Field label="ID (catalogue)">{program.id}</Field>
              {KNOWN_ORDER.map(([key, label]) => (
                <Field key={key} label={label}>
                  {program[key]}
                </Field>
              ))}
              {extraFields.map(([key, label]) => (
                <Field key={key} label={label}>
                  {typeof program[key] === 'object' ? JSON.stringify(program[key]) : String(program[key])}
                </Field>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
