import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { GROUPS, assignProgramToGroup, GROUP_ICON_SRC } from '../data/filieresGroupsConfig';
import './CatalogueProgrammes.css';

export default function CatalogueProgrammes() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [rythme, setRythme] = useState('');
  const [ecole, setEcole] = useState(() => searchParams.get('ecole') || '');
  const [codeRncp, setCodeRncp] = useState('');

  useEffect(() => {
    setEcole(searchParams.get('ecole') || '');
  }, [searchParams]);

  const params = useMemo(
    () => ({ q, rythme, ecole, code_rncp: codeRncp }),
    [q, rythme, ecole, codeRncp]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.programmesFigs
      .list(params)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setErr('');
        }
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
  }, [params]);

  const programs = data?.programs || [];

  const byGroup = useMemo(() => {
    const map = Object.fromEntries(GROUPS.map((g) => [g, []]));
    for (const p of programs) {
      const g = assignProgramToGroup(p);
      if (map[g]) map[g].push(p);
      else map[g] = [p];
    }
    return GROUPS.map((group) => ({ group, items: map[group] || [] }));
  }, [programs]);

  return (
    <div className="figs-catalogue">
      <Link to="/" className="figs-catalogue__back">
        ← Accueil
      </Link>
      <header className="figs-catalogue__hero">
        <h1>Catalogue formations FIGS</h1>
        <p>
          Parcourez les formations par grand domaine. Cliquez sur une ligne pour ouvrir la fiche complete (RNCP,
          rythme, tarifs, prerequis) et poursuivre l’inscription. Source : tableau FIGS deduplique — pour regenerer,{' '}
          <code>node scripts/parse-figs-tsv.mjs</code>.
        </p>
      </header>

      <section className="figs-catalogue__filters card">
        <div className="figs-catalogue__grid">
          <div className="form-group">
            <label htmlFor="figs-q">Recherche libre</label>
            <input
              id="figs-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Titre, certificateur, prérequis…"
            />
          </div>
          <div className="form-group">
            <label htmlFor="figs-rythme">Rythme</label>
            <select id="figs-rythme" value={rythme} onChange={(e) => setRythme(e.target.value)}>
              <option value="">Tous</option>
              <option value="Initial">Initial</option>
              <option value="Alterné">Alterné</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="figs-ecole">École / certificateur</label>
            <input
              id="figs-ecole"
              value={ecole}
              onChange={(e) => setEcole(e.target.value)}
              placeholder="ex. IDRAC, APTIM, IEFT…"
            />
          </div>
          <div className="form-group">
            <label htmlFor="figs-code">Code RNCP</label>
            <input id="figs-code" value={codeRncp} onChange={(e) => setCodeRncp(e.target.value)} placeholder="37890" />
          </div>
        </div>
        {data?.meta && (
          <p className="figs-catalogue__meta">
            {data.meta.total} fiche(s) affichée(s) sur {data.meta.sourceTotal} au catalogue
            {data.meta.generatedAt ? ` — source du ${new Date(data.meta.generatedAt).toLocaleDateString('fr-FR')}` : ''}
          </p>
        )}
      </section>

      {err && <p className="figs-catalogue__err">{err}</p>}
      {loading && <p className="figs-catalogue__loading">Chargement…</p>}

      {!loading && !err && programs.length > 0 && (
        <div className="figs-catalogue__groups">
          {byGroup.map(({ group, items }) => {
            if (!items.length) return null;
            const icon = GROUP_ICON_SRC[group] || '/icons/filieres/default.svg';
            return (
              <section key={group} className="figs-catalogue__group card">
                <div className="figs-catalogue__group-head">
                  <img src={icon} alt="" width={40} height={40} loading="lazy" className="figs-catalogue__group-icon" />
                  <div>
                    <h2 className="figs-catalogue__group-title">{group}</h2>
                    <p className="figs-catalogue__group-meta">{items.length} formation(s)</p>
                  </div>
                </div>
                <ul className="figs-catalogue__group-list">
                  {items.map((p) => (
                    <li key={p.id}>
                      <Link to={`/catalogue-figs/fiche/${p.id}`} className="figs-prog-row">
                        <div className="figs-prog-row__main">
                          <span className="figs-prog-row__title">{p.titreVisaGrade}</span>
                          <span className="figs-prog-row__cert">{p.certificateur}</span>
                        </div>
                        <div className="figs-prog-row__badges">
                          {p.rythme && <span className="figs-badge">{p.rythme}</span>}
                          {p.codeRncp && <span className="figs-badge figs-badge--code">RNCP {p.codeRncp}</span>}
                        </div>
                        <span className="figs-prog-row__chev" aria-hidden>
                          ›
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {!loading && !programs.length && !err && (
        <p className="figs-catalogue__empty">Aucune formation ne correspond aux filtres.</p>
      )}
    </div>
  );
}
