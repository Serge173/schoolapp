import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FIGS_ABIDJAN } from './data/figsBureaus';

export default function Layout() {
  return (
    <div className="layout-root">
      <header className="layout-header">
        <div className="container">
          <Link to="/" className="logo">
            SchoolApp
          </Link>
          <nav>
            <Link to="/">Accueil</Link>
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
              SchoolApp
            </Link>
            <p>
              Données d’orientation alignées sur{' '}
              <a href="https://www.figs-education.com/" target="_blank" rel="noopener noreferrer">
                FIGS Education
              </a>{' '}
              — bureaux régionaux <strong>Abidjan</strong> (Côte d’Ivoire) et <strong>Burkina Faso</strong>.
            </p>
          </div>
          <nav className="layout-footer-nav" aria-label="Liens du pied de page">
            <h4>Navigation</h4>
            <Link to="/">Accueil</Link>
            <Link to="/filieres">Filières</Link>
            <Link to="/contact">Contact</Link>
          </nav>
          <div className="layout-footer-contact">
            <h4>Contact</h4>
            <Link to="/contact">Formulaire de contact</Link>
            <a href={`mailto:${FIGS_ABIDJAN.email}`}>{FIGS_ABIDJAN.email}</a>
          </div>
        </div>
        <div className="layout-footer-bottom">
          <div className="container">
            <p>© {new Date().getFullYear()} SchoolApp — Orientation & inscription universitaire</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
