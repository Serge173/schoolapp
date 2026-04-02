import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MLA_LOGO_URLS } from '../data/mlaLogoUrls';
import ArrowIcon from '../components/ArrowIcon';
import { FIGS_ABIDJAN, FIGS_BURKINA, figsRegionalWhatsAppUrl } from '../data/figsBureaus';
import { faviconUrl } from '../utils/favicon';
import './Home.css';

const WHATSAPP_PREFILL =
  'Bonjour, je contacte les bureaux FIGS Abidjan / Burkina Faso pour mon projet d’études en France.';

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
const CHIFFRES_CLES = [{ label: 'Programmes (Bac à Bac+5)', value: '50+' }];

const FAQ_HOME = [
  {
    q: 'Quels services proposez-vous ?',
    a: 'Un accompagnement personnalisé et gratuit : conseil d’orientation, préparation aux entretiens, préparation du visa, aide au logement et accompagnement administratif — comme décrit sur figs-education.com.',
  },
  {
    q: 'L’accompagnement est-il payant ?',
    a: 'Les services apportés par FIGS Education sont totalement gratuits pour l’accompagnement (hors frais propres à l’école ou à la candidature, indiqués sur le site officiel).',
  },
  {
    q: 'Qui est FIGS Education ?',
    a: 'FIGS Education, l’expérience académique française, est le service international du réseau Compétences & Développement. SchoolApp représente à part égale les bureaux FIGS d’Abidjan (Côte d’Ivoire) et du Burkina Faso : la même logique d’orientation et d’accompagnement, avec les coordonnées publiées sur figs-education.com pour chaque territoire.',
  },
  {
    q: 'Comment candidater ?',
    a: 'La procédure en ligne repose sur un dossier (pièces d’identité, CV, derniers diplômes et bulletins, niveau de français pour les non-francophones, etc.). Le détail des pièces et frais éventuels figure sur le site FIGS — voir la FAQ et la procédure d’admission.',
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
            Application du{' '}
            <a href={FIGS_ABIDJAN.siteFigs} target="_blank" rel="noopener noreferrer">
              FIGS Education
            </a>{' '}
            pour les <strong>bureaux régionaux d’Abidjan</strong> ({FIGS_ABIDJAN.pays}) et du <strong>Burkina Faso</strong> :
            filières, niveaux et écoles partenaires pour étudier en France (orientation, admission, l’expérience académique
            française).
          </p>
        </div>

        <section className="home-showcase" aria-labelledby="home-atouts-title">
          <h2 id="home-atouts-title" className="home-showcase-title">
            FIGS Education vous accompagne dans votre projet d’études en France
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

        <section className="home-info-grid" aria-label="Bureaux FIGS Abidjan et Burkina Faso">
          <article className="card home-info-card">
            <h3>Bureau Abidjan — {FIGS_ABIDJAN.pays}</h3>
            <p>
              Contenus FIGS pour les candidats du <strong>bureau d’Abidjan</strong> : filières (Agri, Assurance,
              Communication, Droit, Digital, Management, etc.), du Bac au Bac+5, écoles privées partenaires.
            </p>
            <p>
              <strong>Contact (figs-education.com — nos bureaux) :</strong> {FIGS_ABIDJAN.responsable} —{' '}
              <a href={`mailto:${FIGS_ABIDJAN.email}`}>{FIGS_ABIDJAN.email}</a> —{' '}
              <a href={`tel:+${FIGS_ABIDJAN.phoneDigitsInternational}`}>{FIGS_ABIDJAN.phoneDisplay}</a>
            </p>
            <p style={{ marginBottom: 0 }}>
              <a href={FIGS_ABIDJAN.pageBureaux} target="_blank" rel="noopener noreferrer">
                Voir tous les bureaux FIGS
              </a>
            </p>
          </article>

          <article className="card home-info-card">
            <h3>Bureau Burkina Faso</h3>
            <p>
              Le <strong>bureau FIGS Burkina Faso</strong> est représenté au même titre qu’Abidjan dans cette
              application : même accompagnement vers les formations en France, avec une boîte mail dédiée sur le site
              officiel FIGS.
            </p>
            <p>
              <strong>Contact :</strong>{' '}
              <a href={`mailto:${FIGS_BURKINA.email}`}>{FIGS_BURKINA.email}</a>
            </p>
            <p style={{ marginBottom: 0 }}>
              Selon FIGS, l’organisation du réseau met en lien le Burkina Faso et le bureau Côte d’Ivoire ; la ligne
              téléphone/WhatsApp publiée pour Abidjan sert aussi de contact rapide pour les dossiers régionaux (
              <a href={FIGS_ABIDJAN.pageBureaux} target="_blank" rel="noopener noreferrer">
                détail sur figs-education.com
              </a>
              ).
            </p>
          </article>

          <article className="card home-info-card">
            <h3>Rentrées et calendrier (FIGS)</h3>
            <ul className="home-list">
              <li>Rentrée principale : septembre 2026</li>
              <li>Rentrée décalée : janvier à mars</li>
              <li>Candidature en ligne — candidatez dès maintenant</li>
            </ul>
            <Link to="/inscription" className="btn btn-primary btn-arrow home-inline-cta">
              <span>Commencer ma candidature</span>
              <ArrowIcon />
            </Link>
          </article>
        </section>

        <section className="home-kpis home-kpis--single" aria-label="Chiffres clés">
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
            <a href={FIGS_ABIDJAN.siteFigs} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-arrow">
              <span>Site officiel FIGS</span>
              <ArrowIcon />
            </a>
            <Link to="/contact" className="btn btn-primary btn-arrow">
              <span>Contacter un conseiller</span>
              <ArrowIcon />
            </Link>
            <a
              href={figsRegionalWhatsAppUrl(WHATSAPP_PREFILL)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-arrow"
            >
              <span>Contacter les bureaux par WhatsApp</span>
              <ArrowIcon />
            </a>
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
