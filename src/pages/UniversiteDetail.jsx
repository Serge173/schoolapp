import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';

export default function UniversiteDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [u, setU] = useState(null);
  const [loading, setLoading] = useState(true);

  const filiereId = searchParams.get('filiere_id');
  const niveau = searchParams.get('niveau') || '';

  useEffect(() => {
    api.universites.get(id).then(setU).catch(() => setLoading(false)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chargement…</p>;
  if (!u) return <p style={{ textAlign: 'center' }}>Établissement introuvable.</p>;

  const inscriptionUrl = `/inscription?universite_id=${u.id}&filiere_id=${filiereId || (u.filieres?.[0]?.id) || ''}&type=${u.type}&niveau=${niveau}`;

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <Link to={filiereId ? `/filieres/filiere/${filiereId}/ecoles?niveau=${niveau}` : '/filieres'} style={{ color: 'var(--text-muted)', display: 'inline-block', marginBottom: '0.5rem' }}>← Retour</Link>
        <h1 style={{ marginTop: '0.5rem' }}>{u.nom}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{u.ville} · <span className="badge badge-private">Privée</span></p>
      </div>

      <div style={{ display: 'grid', gap: '2rem', marginBottom: '2rem' }}>
        {(u.photos?.length > 0 || u.logoUrl) && (
          <section>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Photos</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {u.logoUrl && (
                <div
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: 18,
                    background: 'radial-gradient(180px 180px at 20% 20%, rgba(28,117,183,0.1), transparent), var(--surface)',
                    border: '1px solid var(--border)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <img src={u.logoUrl} alt="Logo" referrerPolicy="no-referrer" style={{ width: 110, height: 110, objectFit: 'contain' }} />
                </div>
              )}
              {u.photos?.map((p) => (
                <img key={p.id} src={p.url} alt="" style={{ maxWidth: 280, maxHeight: 180, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }} />
              ))}
            </div>
          </section>
        )}

        {u.brochureUrl && (
          <section>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Brochure</h3>
            <a href={u.brochureUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Télécharger la brochure (PDF)</a>
          </section>
        )}

        {u.description && (
          <section>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Description</h3>
            <p style={{ color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>{u.description}</p>
          </section>
        )}

        {u.campuses?.length > 0 && (
          <section>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Campus</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {u.campuses.map((c) => (
                <div
                  key={c.id}
                  className="card"
                  style={{ padding: '1rem 1.15rem', overflow: 'hidden' }}
                >
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>{c.nom}</h4>
                  <p style={{ margin: '0 0 0.25rem', color: 'var(--text)', fontWeight: 500 }}>{c.ville}</p>
                  {c.adresse && (
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{c.adresse}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {u.filieres?.length > 0 && (
          <section>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Filières proposées</h3>
            <p style={{ color: 'var(--text-muted)' }}>{u.filieres.map((f) => f.nom).join(', ')}</p>
          </section>
        )}
      </div>

      <Link to={inscriptionUrl} className="btn btn-primary btn-block" style={{ padding: '1rem 1.5rem', fontSize: '1.1rem' }}>
        S'INSCRIRE
      </Link>
    </>
  );
}
