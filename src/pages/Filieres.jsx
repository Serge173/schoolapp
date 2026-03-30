import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import './Filieres.css';

const GROUPS = [
  'Agri agro management',
  'Assurance',
  'Communication',
  'Comptabilite - gestion',
  'Design',
  'Digital',
  'Droit',
  'Environnement',
  'Finance',
  'Grandes ecoles',
  'Informatique',
  'Management',
  'Marketing',
  'Relations internationales',
  'Tourisme',
];

const GROUP_KEYWORDS = {
  'Agri agro management': ['agri', 'agro', 'gestion'],
  Assurance: ['assurance', 'finance', 'gestion'],
  Communication: ['communication', 'journal', 'media'],
  'Comptabilite - gestion': ['compta', 'comptabilite', 'gestion'],
  Design: ['design', 'architecture'],
  Digital: ['digital', 'numerique', 'informatique'],
  Droit: ['droit', 'jurid'],
  Environnement: ['environnement', 'ecologie', 'genie civil'],
  Finance: ['finance', 'banque', 'economie', 'gestion'],
  'Grandes ecoles': ['ingenieur', 'commerce', 'management', 'informatique'],
  Informatique: ['informatique', 'data', 'cyber', 'developpement'],
  Management: ['management', 'gestion', 'business'],
  Marketing: ['marketing', 'communication', 'commerce'],
  'Relations internationales': ['relations internationales', 'international', 'droit'],
  Tourisme: ['tourisme', 'hospitalite', 'management'],
};

const GROUP_SUBFILIERES = {
  'Agri agro management': ['Agro management'],
};

const GROUP_ICON_SRC = {
  'Agri agro management': '/icons/filieres/default.svg',
  Assurance: '/icons/filieres/finance.svg',
  Communication: '/icons/filieres/communication.svg',
  'Comptabilite - gestion': '/icons/filieres/gestion.svg',
  Design: '/icons/filieres/architecture.svg',
  Digital: '/icons/filieres/informatique.svg',
  Droit: '/icons/filieres/droit.svg',
  Environnement: '/icons/filieres/genie-civil.svg',
  Finance: '/icons/filieres/finance.svg',
  'Grandes ecoles': '/icons/filieres/default.svg',
  Informatique: '/icons/filieres/informatique.svg',
  Management: '/icons/filieres/gestion.svg',
  Marketing: '/icons/filieres/marketing.svg',
  'Relations internationales': '/icons/filieres/communication.svg',
  Tourisme: '/icons/filieres/default.svg',
};

function normalize(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function Filieres() {
  const navigate = useNavigate();
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chargement…</p>;

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'inline-block' }}>
          ← Accueil
        </Link>
        <h1 style={{ marginTop: '0.5rem' }}>Selectionnez une filiere ...</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Universites privees: icones par groupe + liste deroulante pour choisir la filiere.
        </p>
      </div>
      <div className="grid-cards">
        {GROUPS.map((group) => {
          const keywords = GROUP_KEYWORDS[group] || [];
          const matches = filieres.filter((f) => {
            const text = normalize(`${f.nom} ${f.slug}`);
            return keywords.some((k) => text.includes(normalize(k)));
          });
          const subfilieres = GROUP_SUBFILIERES[group] || matches.map((f) => f.nom);

          const resolveFiliere = (label) => {
            const n = normalize(label);
            return filieres.find((f) => {
              const nom = normalize(f.nom);
              const slug = normalize(f.slug);
              return nom === n || slug === n || nom.includes(n) || n.includes(nom) || slug.includes(n);
            });
          };

          const groupIcon = GROUP_ICON_SRC[group] || '/icons/filieres/default.svg';

          return (
            <div key={group} className="card filieres-group-card">
              <div className="filieres-group-head">
                <img
                  className="filieres-group-favicon"
                  src={groupIcon}
                  alt=""
                  width={44}
                  height={44}
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <h3>{group}</h3>
                  <p className="filieres-group-meta">{subfilieres.length} filiere(s)</p>
                </div>
              </div>
              <div className="filieres-group-select-row">
                <img
                  className="filieres-group-select-favicon"
                  src={groupIcon}
                  alt=""
                  width={24}
                  height={24}
                  loading="lazy"
                  decoding="async"
                />
                <select
                  className="filieres-group-select"
                  defaultValue=""
                  onChange={(e) => {
                    const filiereId = e.target.value;
                    if (filiereId) navigate(`/filieres/filiere/${filiereId}`);
                  }}
                >
                  <option value="">Selectionnez une filiere</option>
                  {subfilieres.map((label) => {
                    const mapped = resolveFiliere(label);
                    return (
                      <option key={`${group}-${label}`} value={mapped?.id || ''} disabled={!mapped}>
                        {mapped ? label : `${label} (bientot disponible)`}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          );
        })}
      </div>
      {filieres.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucune filiere disponible pour le moment.</p>
      )}
    </>
  );
}
