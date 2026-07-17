import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { NIVEAUX_PARCOURS } from '../data/niveauxParcours';
import './Universites.css';

export default function Universites() {
  const { filiereId, type: typeParam } = useParams();
  const [searchParams] = useSearchParams();
  const [universites, setUniversites] = useState([]);
  const [filiere, setFiliere] = useState(null);
  const [loading, setLoading] = useState(true);
  const niveau = searchParams.get('niveau') || '';
  const niveauLabel =
    NIVEAUX_PARCOURS.find((n) => n.value === niveau)?.label || niveau.replace(/_/g, ' ') || 'Niveau non précisé';
  const niveauxPath = typeParam
    ? `/filieres/${typeParam}/filiere/${filiereId}`
    : `/filieres/filiere/${filiereId}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const uniParams = {
      filiere_id: filiereId,
      type: 'privee',
      ...(niveau ? { niveau } : {}),
    };
    Promise.all([api.filieres.get(filiereId), api.universites.list(uniParams)])
      .then(([f, list]) => {
        if (!cancelled) {
          setFiliere(f);
          setUniversites(list);
        }
      })
      .catch(() => {
        if (!cancelled) setUniversites([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filiereId, niveau]);

  if (loading) {
    return (
      <div className="ecoles-page">
        <p className="ecoles-loading">Chargement des établissements…</p>
      </div>
    );
  }

  return (
    <div className="ecoles-page">
      <Link to={niveauxPath} className="ecoles-back">
        ← Niveaux
      </Link>

      <header className="ecoles-hero">
        <h1>{filiere?.nom ?? 'Filière'} — écoles du réseau</h1>
        <p className="ecoles-hero-lead">
          {niveau
            ? 'Établissements correspondant à votre filière et à ce niveau (alignement catalogue FIGS). Choisissez une école pour la fiche détaillée.'
            : 'Écoles privées du réseau pour cette filière. Sélectionnez un établissement pour poursuivre.'}
        </p>
        <div className="ecoles-meta-row">
          {filiere?.nom && <span className="ecoles-chip">{filiere.nom}</span>}
          <span className="ecoles-chip ecoles-chip--niveau">{niveauLabel}</span>
          {universites.length > 0 && (
            <span className="ecoles-chip">
              {universites.length} établissement{universites.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      <div className="ecoles-grid">
        {universites.map((u) => {
          const campusLabel =
            Number(u.nb_campus) > 1
              ? `${u.nb_campus} campus`
              : Number(u.nb_campus) === 1
                ? '1 campus'
                : null;
          const detailUrl = `/universite/${u.id}?filiere_id=${filiereId}&type=privee&niveau=${encodeURIComponent(niveau)}`;

          return (
            <article key={u.id} className="ecole-card">
              <div className="ecole-card__logo" aria-hidden>
                {u.logoUrl ? (
                  <img src={u.logoUrl} alt="" referrerPolicy="no-referrer" width={40} height={40} />
                ) : (
                  <span className="ecole-card__fallback">{String(u.nom || '?').trim().charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="ecole-card__body">
                <h2 className="ecole-card__title">{u.nom}</h2>
                <p className="ecole-card__meta">
                  {u.ville}
                  {campusLabel ? ` · ${campusLabel}` : ''}
                </p>
                <Link to={detailUrl} className="ecole-card__cta">
                  Voir l’établissement
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {universites.length === 0 && (
        <p className="ecoles-empty" role="status">
          {niveau
            ? 'Aucun établissement ne correspond à ce niveau pour cette filière dans le catalogue FIGS. Essayez un autre niveau ou parcourez le catalogue FIGS.'
            : 'Aucun établissement pour cette filière.'}
        </p>
      )}
    </div>
  );
}
