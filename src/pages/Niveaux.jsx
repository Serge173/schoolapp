import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';

const NIVEAUX = ['B1', 'B2', 'B3', 'M1', 'M2'];

export default function Niveaux() {
  const { filiereId } = useParams();
  const [filiere, setFiliere] = useState(null);

  useEffect(() => {
    api.filieres.get(filiereId).then(setFiliere).catch(() => setFiliere(null));
  }, [filiereId]);

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/filieres" style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'inline-block' }}>← Filieres</Link>
        <h1 style={{ marginTop: '0.5rem' }}>Choisissez votre niveau</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {filiere ? `Filiere: ${filiere.nom}` : 'Selectionnez un niveau pour continuer vers les ecoles du reseau.'}
        </p>
      </div>

      <div className="grid-cards">
        {NIVEAUX.map((niveau) => (
          <Link key={niveau} to={`/filieres/filiere/${filiereId}/ecoles?niveau=${niveau}`} style={{ textDecoration: 'none' }}>
            <div className="card niveau-card">
              <h3 className="niveau-card-title">{niveau}</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Voir les ecoles qui proposent cette filiere</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
