import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import './UniversiteDetail.css';

export default function UniversiteDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [u, setU] = useState(null);
  const [loading, setLoading] = useState(true);
  const [figsProgs, setFigsProgs] = useState(null);

  const filiereId = searchParams.get('filiere_id');
  const niveau = searchParams.get('niveau') || '';
  const typeFromQuery = searchParams.get('type') || '';
  const niveauEnc = encodeURIComponent(niveau);
  const ecolesRetourPath =
    filiereId &&
    (typeFromQuery
      ? `/filieres/${typeFromQuery}/filiere/${filiereId}/ecoles?niveau=${niveauEnc}`
      : `/filieres/filiere/${filiereId}/ecoles?niveau=${niveauEnc}`);

  useEffect(() => {
    api.universites.get(id).then(setU).catch(() => setLoading(false)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!u?.nom) return;
    let cancelled = false;
    api.programmesFigs
      .list({ ecole: u.nom })
      .then((d) => {
        if (!cancelled) setFigsProgs(d.programs || []);
      })
      .catch(() => {
        if (!cancelled) setFigsProgs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [u?.nom]);

  if (loading) {
    return (
      <div className="uni-detail uni-detail--loading" aria-busy="true">
        <div className="uni-detail__skeleton uni-detail__skeleton--hero" />
        <div className="uni-detail__skeleton uni-detail__skeleton--line" />
        <div className="uni-detail__skeleton uni-detail__skeleton--line short" />
        <div className="uni-detail__skeleton uni-detail__skeleton--card" />
      </div>
    );
  }

  if (!u) {
    return (
      <div className="uni-detail uni-detail--empty">
        <p className="uni-detail__empty-msg">Établissement introuvable.</p>
        <Link to="/filieres" className="btn btn-secondary">
          Retour aux filières
        </Link>
      </div>
    );
  }

  const inscriptionUrl = `/inscription?universite_id=${u.id}&filiere_id=${filiereId || (u.filieres?.[0]?.id) || ''}&type=${u.type}&niveau=${niveauEnc}`;
  const isPublic = u.type === 'publique';
  const hasMedia = (u.photos?.length ?? 0) > 0;

  return (
    <div className="uni-detail">
      <header className="uni-detail__hero">
        <div className="uni-detail__hero-bg" aria-hidden />
        <div className="uni-detail__hero-content">
          <Link to={ecolesRetourPath || '/filieres'} className="uni-detail__back">
            <span className="uni-detail__back-icon" aria-hidden>
              ←
            </span>
            Retour aux écoles
          </Link>

          <div className="uni-detail__hero-row">
            {u.logoUrl ? (
              <div className="uni-detail__logo-frame">
                <img
                  src={u.logoUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="uni-detail__logo-img"
                />
              </div>
            ) : (
              <div className="uni-detail__logo-frame uni-detail__logo-frame--placeholder" aria-hidden>
                <span className="uni-detail__logo-initial">{u.nom?.charAt(0) || '?'}</span>
              </div>
            )}

            <div className="uni-detail__hero-main">
              <h1 className="uni-detail__title">{u.nom}</h1>
              <div className="uni-detail__meta">
                <span className="uni-detail__meta-loc">{u.ville}</span>
                <span className="uni-detail__meta-dot" aria-hidden />
                <span className={`badge ${isPublic ? 'badge-public' : 'badge-private'}`}>
                  {isPublic ? 'Publique' : 'Privée'}
                </span>
                {niveau ? (
                  <>
                    <span className="uni-detail__meta-dot" aria-hidden />
                    <span className="uni-detail__meta-niveau">Niveau visé · {niveau}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="uni-detail__grid">
        <div className="uni-detail__primary">
          {u.description ? (
            <section className="uni-card" aria-labelledby="uni-desc-heading">
              <div className="uni-card__head">
                <h2 id="uni-desc-heading" className="uni-card__title">
                  Présentation
                </h2>
              </div>
              <p className="uni-detail__description">{u.description}</p>
            </section>
          ) : null}

          {hasMedia ? (
            <section className="uni-card uni-card--media" aria-labelledby="uni-media-heading">
              <div className="uni-card__head">
                <h2 id="uni-media-heading" className="uni-card__title">
                  Galerie
                </h2>
                <p className="uni-card__subtitle">Photos de l’établissement</p>
              </div>
              <div className="uni-detail__gallery">
                {u.photos?.map((p) => (
                  <figure key={p.id} className="uni-detail__gallery-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          {u.filieres?.length > 0 ? (
            <section className="uni-card" aria-labelledby="uni-fil-heading">
              <div className="uni-card__head">
                <h2 id="uni-fil-heading" className="uni-card__title">
                  Filières proposées
                </h2>
              </div>
              <ul className="uni-detail__tags">
                {u.filieres.map((f) => (
                  <li key={f.id} className="uni-detail__tag">
                    {f.nom}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {u.campuses?.length > 0 ? (
            <section className="uni-card" aria-labelledby="uni-campus-heading">
              <h2 id="uni-campus-heading" className="uni-card__title uni-card__title--inline">
                Campus
              </h2>
              <p className="uni-card__subtitle uni-card__subtitle--tight">
                {u.campuses.length} site{u.campuses.length > 1 ? 's' : ''} dans le réseau
              </p>
              <div className="campus-grid">
                {u.campuses.map((c) => (
                  <article key={c.id} className="campus-card">
                    <h3 className="campus-card__name">{c.nom}</h3>
                    <p className="campus-card__ville">{c.ville}</p>
                    {c.adresse ? <p className="campus-card__addr">{c.adresse}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {figsProgs && figsProgs.length > 0 ? (
            <section className="uni-card uni-card--figs" aria-labelledby="uni-figs-heading">
              <div className="uni-card__head">
                <h2 id="uni-figs-heading" className="uni-card__title">
                  Formations FIGS
                </h2>
                <p className="uni-card__subtitle">
                  Rythme, RNCP et tarifs indicatifs —{' '}
                  <Link to="/catalogue-figs" className="uni-detail__inline-link">
                    catalogue complet
                  </Link>
                </p>
              </div>
              <ul className="uni-detail__figs-list">
                {figsProgs.slice(0, 8).map((p) => (
                  <li key={p.id} className="uni-detail__figs-item">
                    <span className="uni-detail__figs-accent" aria-hidden />
                    <div className="uni-detail__figs-body">
                      <span className="uni-detail__figs-title">{p.titreVisaGrade}</span>
                      <span className="uni-detail__figs-meta">
                        {p.rythme}
                        {p.codeRncp ? ` · RNCP ${p.codeRncp}` : ''}
                        {p.prixFigs ? ` · ${p.prixFigs}` : ''}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              {figsProgs.length > 8 ? (
                <p className="uni-detail__figs-more">
                  <Link to={`/catalogue-figs?ecole=${encodeURIComponent(u.nom)}`}>
                    Voir les {figsProgs.length} fiches liées
                  </Link>
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="uni-detail__aside">
          <div className="uni-aside-card uni-aside-card--cta-desktop">
            <h2 className="uni-aside-card__title">Candidature</h2>
            <p className="uni-aside-card__text">
              Poursuivez votre parcours : préremplissage avec cette école et votre filière.
            </p>
            <Link to={inscriptionUrl} className="btn btn-primary btn-block uni-detail__cta-main">
              S’inscrire
            </Link>
          </div>

          {u.brochureUrl ? (
            <div className="uni-aside-card uni-aside-card--soft">
              <h2 className="uni-aside-card__title">Documentation</h2>
              <a
                href={u.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-block uni-detail__brochure"
              >
                Télécharger la brochure (PDF)
              </a>
            </div>
          ) : null}
        </aside>
      </div>

      <div className="uni-detail__cta-mobile">
        <Link to={inscriptionUrl} className="btn btn-primary btn-block uni-detail__cta-main">
          S’inscrire
        </Link>
      </div>
    </div>
  );
}
