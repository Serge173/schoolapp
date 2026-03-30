import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MLA_LOGO_URLS } from '../data/mlaLogoUrls';
import { faviconUrl } from '../utils/favicon';
import './Home.css';

function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16.106" height="13.455" viewBox="0 0 16.106 13.455" aria-hidden>
      <g transform="translate(1 1.412)">
        <path
          d="M228.715,283.664l5.987-5.316-5.987-5.316"
          transform="translate(-220.596 -273.032)"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <line
          x1="14.106"
          transform="translate(0 5.316)"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}

function logoPositions(count) {
  return Array.from({ length: count }, (_, i) => {
    const left = 3 + ((i * 41) % 86);
    const top = 4 + ((i * 29 + (i % 5) * 7) % 78);
    return { left: `${left}%`, top: `${top}%` };
  });
}

const BG_LOGO_COUNT = 34;
const positions = logoPositions(BG_LOGO_COUNT);
const FIGS_LOGO_URL = 'https://www.figs-education.com/_nuxt/img/FIGS_logo.aefcada.png';

const ACCUEIL_ATOUTS = [
  {
    titre: 'Admission',
    texte: 'Une procédure d’admission simplifiée.',
    faviconDomain: 'service-public.fr',
  },
  {
    titre: 'Large choix de formations',
    texte: '+ de 50 programmes de Bac à Bac+5.',
    faviconDomain: 'onisep.fr',
  },
  {
    titre: 'Diplômes reconnus',
    texte: 'Diplômes français reconnus.',
    faviconDomain: 'education.gouv.fr',
  },
  {
    titre: 'Accompagnement',
    texte: 'Accompagnement gratuit dans toutes les démarches.',
    faviconDomain: 'mesdemarches.gouv.fr',
  },
];

const ATOUTS_GAUCHE = ACCUEIL_ATOUTS.slice(0, 2);
const ATOUTS_DROITE = ACCUEIL_ATOUTS.slice(2, 4);
const CHIFFRES_CLES = [
  { label: 'Bureaux internationaux', value: '13' },
  { label: 'Bureau Outre-Mer', value: '1' },
  { label: 'Écoles privées partenaires', value: '17' },
  { label: 'Programmes (Bac à Bac+5)', value: '50+' },
];

const FAQ_HOME = [
  {
    q: 'Quels services proposez-vous ?',
    a: 'Accompagnement personnalisé et gratuit : orientation, préparation aux entretiens, visa, logement et démarches administratives.',
  },
  {
    q: 'L’accompagnement est-il payant ?',
    a: 'Non. Les services d’accompagnement sont gratuits pour les étudiants.',
  },
  {
    q: 'Qui est FIGS Education ?',
    a: 'Le service international du réseau Compétences & Développement, avec des bureaux proches des étudiants dans le monde.',
  },
  {
    q: 'Comment candidater ?',
    a: 'La procédure est simple : dossier académique, pièces d’identité, justificatifs et validation de la candidature.',
  },
];

function AtoutCard({ item }) {
  return (
    <li className="home-highlight-card">
      <img
        className="home-highlight-favicon"
        src={faviconUrl(item.faviconDomain, 48)}
        alt=""
        width={48}
        height={48}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
      />
      <div>
        <h3 className="home-highlight-heading">{item.titre}</h3>
        <p className="home-highlight-text">{item.texte}</p>
      </div>
    </li>
  );
}

export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 280);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const bgLogos = positions.map((pos, i) => ({
    src: MLA_LOGO_URLS[i % MLA_LOGO_URLS.length],
    style: {
      ...pos,
      '--zig-delay': `${(i * 0.42) % 10}s`,
      '--zig-dur': `${11 + (i % 9) + (i % 3) * 0.5}s`,
    },
  }));

  return (
    <div className="home-page">
      <div className="home-bg" aria-hidden>
        <div className="home-bg-mesh" />
        <div className="home-bg-grid" />
        <div className="home-bg-logos">
          {bgLogos.map((item, i) => (
            <img
              key={i}
              className="home-bg-logo"
              src={item.src}
              alt=""
              loading="lazy"
              decoding="async"
              style={item.style}
            />
          ))}
        </div>
      </div>

      <div className="home-content">
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Bienvenue sur SchoolApp</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Découvrez les filières et parcours des universités privées.
          </p>
        </div>

        <section className="home-showcase" aria-labelledby="home-atouts-title">
          <h2 id="home-atouts-title" className="home-showcase-title">
            Votre orientation, en toute confiance
          </h2>

          <div className="home-showcase-layout">
            <ul className="home-showcase-column home-showcase-column--left" aria-label="Atouts à gauche">
              {ATOUTS_GAUCHE.map((item, i) => (
                <AtoutCard key={item.titre} item={item} />
              ))}
            </ul>

            <div className="home-showcase-center">
              <Link to="/filieres" className="home-showcase-cta-link">
                <div className="card home-cta-card home-cta-card--featured">
                  <img
                    className="home-cta-favicon"
                    src={FIGS_LOGO_URL}
                    alt=""
                    width={72}
                    height={72}
                    referrerPolicy="no-referrer"
                  />
                  <h3 className="home-cta-title">Université Privée</h3>
                  <p className="home-cta-desc">Consulter les filières et établissements privés</p>
                </div>
              </Link>
            </div>

            <ul className="home-showcase-column home-showcase-column--right" aria-label="Atouts à droite">
              {ATOUTS_DROITE.map((item, i) => (
                <AtoutCard key={item.titre} item={item} />
              ))}
            </ul>
          </div>
        </section>

        <section className="home-info-grid" aria-label="Informations clés FIGS">
          <article className="card home-info-card">
            <h3>Étudiez en France avec FIGS</h3>
            <p>
              FIGS Education accompagne les étudiants internationaux et ultramarins dans leur projet d’études :
              orientation, admission et installation.
            </p>
            <p>
              Vous pouvez démarrer en France, ou commencer près de chez vous selon les affiliations, puis obtenir un
              diplôme reconnu par l’État français.
            </p>
          </article>

          <article className="card home-info-card">
            <h3>Rentrées et calendrier</h3>
            <ul className="home-list">
              <li>Rentrée principale : septembre 2026</li>
              <li>Rentrée décalée : janvier à mars</li>
              <li>Candidature en ligne disponible dès maintenant</li>
            </ul>
            <Link to="/inscription" className="btn btn-primary btn-arrow home-inline-cta">
              <span>Commencer ma candidature</span>
              <ArrowIcon />
            </Link>
          </article>
        </section>

        <section className="home-kpis" aria-label="Chiffres clés">
          {CHIFFRES_CLES.map((item) => (
            <div key={item.label} className="card home-kpi-card">
              <p className="home-kpi-value">{item.value}</p>
              <p className="home-kpi-label">{item.label}</p>
            </div>
          ))}
        </section>

        <section className="home-faq" aria-label="Questions fréquentes">
          <h2 className="home-showcase-title">FAQ rapide</h2>
          <div className="home-faq-grid">
            {FAQ_HOME.map((item) => (
              <details key={item.q} className="card home-faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <div className="home-links-row">
            <a href="https://www.figs-education.com/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-arrow">
              <span>Site officiel FIGS</span>
              <ArrowIcon />
            </a>
            <Link to="/contact" className="btn btn-primary btn-arrow">
              <span>Contacter un conseiller</span>
              <ArrowIcon />
            </Link>
          </div>
        </section>
      </div>

      <button
        type="button"
        className={`home-scroll-top ${showScrollTop ? 'is-visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Retour en haut"
      >
        <ArrowIcon />
      </button>
    </div>
  );
}
