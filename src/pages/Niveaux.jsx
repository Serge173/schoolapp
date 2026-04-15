import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { NIVEAUX_PARCOURS } from '../data/niveauxParcours';

export default function Niveaux() {
  const { filiereId, type: typeParam } = useParams();
  const [filiere, setFiliere] = useState(null);
  const [niveauxDisponibles, setNiveauxDisponibles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const filieresListPath = typeParam ? `/filieres/${typeParam}` : '/filieres';
  const ecolesPath = (niveauValue) => {
    const q = new URLSearchParams({ niveau: niveauValue }).toString();
    const base = typeParam
      ? `/filieres/${typeParam}/filiere/${filiereId}/ecoles`
      : `/filieres/filiere/${filiereId}/ecoles`;
    return `${base}?${q}`;
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr('');
    Promise.all([api.filieres.get(filiereId), api.filieres.niveauxDisponibles(filiereId)])
      .then(([f, data]) => {
        if (!cancelled) {
          setFiliere(f);
          setNiveauxDisponibles(Array.isArray(data.niveaux) ? data.niveaux : []);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setErr(e.message || 'Erreur de chargement');
          setNiveauxDisponibles([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filiereId]);

  const cartesNiveaux = useMemo(() => {
    if (!niveauxDisponibles || niveauxDisponibles.length === 0) return [];
    const set = new Set(niveauxDisponibles);
    return NIVEAUX_PARCOURS.filter((n) => set.has(n.value));
  }, [niveauxDisponibles]);

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <Link to={filieresListPath} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'inline-block' }}>
          ← Filières
        </Link>
        <h1 style={{ marginTop: '0.5rem' }}>Choisissez votre niveau</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {filiere
            ? `Filière : ${filiere.nom} — seuls les niveaux présents dans le catalogue FIGS pour cette filière et le réseau d’écoles sont proposés.`
            : 'Sélectionnez un niveau pour continuer vers les écoles du réseau.'}
        </p>
      </div>

      {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des niveaux…</p>}
      {err && <p style={{ textAlign: 'center', color: '#b91c1c' }}>{err}</p>}

      {!loading && !err && cartesNiveaux.length > 0 && (
        <div className="grid-cards niveaux-grid">
          {cartesNiveaux.map(({ value, label, hint }) => (
            <Link key={value} to={ecolesPath(value)} style={{ textDecoration: 'none' }}>
              <div className="card niveau-card">
                <h3 className="niveau-card-title">{label}</h3>
                {hint ? (
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>{hint}</p>
                ) : (
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>Voir les écoles pour ce niveau</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && !err && cartesNiveaux.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', maxWidth: '36rem', margin: '0 auto' }}>
          Aucun niveau ne figure dans le catalogue FIGS pour cette filière avec les écoles privées liées. Vérifiez les
          liaisons filière / école en administration ou le fichier <code>figs-programmes.json</code>.
        </p>
      )}
    </>
  );
}
