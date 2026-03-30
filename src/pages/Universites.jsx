import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';

export default function Universites() {
  const { filiereId } = useParams();
  const [searchParams] = useSearchParams();
  const [universites, setUniversites] = useState([]);
  const [filiere, setFiliere] = useState(null);
  const [loading, setLoading] = useState(true);
  const niveau = searchParams.get('niveau') || '';

  useEffect(() => {
    Promise.all([
      api.filieres.get(filiereId),
      api.universites.list({ filiere_id: filiereId, type: 'privee' }),
    ]).then(([f, list]) => {
      setFiliere(f);
      setUniversites(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filiereId]);

  if (loading) return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chargement…</p>;

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <Link to={`/filieres/filiere/${filiereId}`} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'inline-block' }}>← Niveaux</Link>
        <h1 style={{ marginTop: '0.5rem' }}>{filiere?.nom} — {niveau || 'Niveau non precise'}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Choisissez une ecole de notre reseau pour plus de details.</p>
      </div>
      <div className="grid-cards">
        {universites.map((u) => (
          <div key={u.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: 18,
                background: 'radial-gradient(120px 120px at 20% 20%, rgba(28,117,183,0.12), transparent), var(--surface-hover)',
                border: '1px solid var(--border)',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '1rem',
              }}
            >
              {u.logoUrl ? (
                <img
                  src={u.logoUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{ width: 74, height: 74, objectFit: 'contain' }}
                />
              ) : (
                <div style={{ width: 74, height: 74, background: 'rgba(255,255,255,0.06)', borderRadius: 14 }} />
              )}
            </div>
            <h3 style={{ textAlign: 'center', marginBottom: '0.25rem' }}>{u.nom}</h3>
            <p style={{ marginBottom: '0.35rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>{u.ville}</p>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent)' }}>
              {Number(u.nb_campus) > 1 ? `${u.nb_campus} campus` : Number(u.nb_campus) === 1 ? '1 campus' : '—'}
            </p>
            <Link to={`/universite/${u.id}?filiere_id=${filiereId}&type=privee&niveau=${niveau}`} className="btn btn-primary">Voir l'etablissement</Link>
          </div>
        ))}
      </div>
      {universites.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucun établissement pour cette filière.</p>
      )}
    </>
  );
}
