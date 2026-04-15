import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FIGS_ABIDJAN } from './data/figsBureaus';
import { getFooterSocialLinks } from './data/socialLinks';
import SocialIcon from './components/SocialIcon';

export default function Layout() {
  return (
    <div className="layout-root">
      <header className="layout-header">
        <div className="container">
          <Link to="/" className="logo">
            FigsApp-Côte d'Ivoire
          </Link>
          <nav>
            <Link to="/">Accueil</Link>
            <Link to="/filieres">Filières</Link>
            <Link to="/catalogue-figs">Catalogue FIGS</Link>
            <Link to="/rendez-vous">Rendez-vous</Link>
            <Link to="/contact">Contact</Link>
          </nav>
        </div>
      </header>
      <main className="layout-main" style={{ padding: '2rem 0', overflowX: 'hidden' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer className="layout-footer">
        <div className="layout-footer-strip" aria-hidden />
        <div className="container layout-footer-inner">
          <div className="layout-footer-brand">
            <Link to="/" className="layout-footer-logo">
              FigsApp-Côte d'Ivoire
            </Link>
            <p>
              Données d’orientation alignées sur{' '}
              <a href="https://www.figs-education.com/" target="_blank" rel="noopener noreferrer">
                FIGS Education
              </a>{' '}
              — candidats <strong>Abidjan</strong> &amp; <strong>Burkina Faso</strong>, contact unique bureau Abidjan.
            </p>
          </div>
          <nav className="layout-footer-nav" aria-label="Liens du pied de page">
            <h4>Navigation</h4>
            <Link to="/">Accueil</Link>
            <Link to="/filieres">Filières</Link>
            <Link to="/catalogue-figs">Catalogue FIGS</Link>
            <Link to="/rendez-vous">Rendez-vous</Link>
            <Link to="/contact">Contact</Link>
          </nav>
          <div className="layout-footer-contact">
            <h4>Contact</h4>
            <Link to="/rendez-vous">Prendre un RDV</Link>
            <Link to="/contact">Formulaire de contact</Link>
            <a href={`mailto:${FIGS_ABIDJAN.email}`}>{FIGS_ABIDJAN.email}</a>
          </div>
          <nav className="layout-footer-social" aria-label="Réseaux sociaux FIGS">
            <h4>Nos réseaux</h4>
            <ul className="layout-footer-social-list">
              {getFooterSocialLinks().map((s) => (
                <li key={s.id}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="layout-footer-social-link"
                    aria-label={s.label}
                    title={s.label}
                  >
                    <span className="layout-footer-social-icon-wrap">
                      <SocialIcon id={s.id} />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="layout-footer-bottom">
          <div className="container">
            <p>© {new Date().getFullYear()} FigsApp-Côte d'Ivoire — Orientation & inscription universitaire</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
