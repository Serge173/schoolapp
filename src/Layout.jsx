import { useEffect, useState, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FIGS_ABIDJAN } from './data/figsBureaus';
import { getFooterSocialLinks } from './data/socialLinks';
import SocialIcon from './components/SocialIcon';
import './Layout.css';

const NAV_LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/filieres', label: 'Filières' },
  { to: '/catalogue-figs', label: 'Catalogue FIGS' },
  { to: '/rendez-vous', label: 'Rendez-vous' },
  { to: '/contact', label: 'Contact' },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openMenu = useCallback(() => setMenuOpen(true), []);

  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const mq = window.matchMedia('(max-width: 1023px)');
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="layout-root">
      <header className="layout-header">
        <div className="container">
          <div className={`layout-header-row${menuOpen ? ' layout-header-row--nav-open' : ''}`}>
            <Link to="/" className="logo" onClick={closeMenu}>
              FigsApp-Côte d'Ivoire
            </Link>

            <button
              type="button"
              className="layout-menu-btn layout-menu-btn--open"
              aria-expanded={menuOpen}
              aria-controls="main-navigation"
              aria-label="Ouvrir le menu"
              onClick={openMenu}
            >
              <span className="layout-menu-btn-bar" aria-hidden />
              <span className="layout-menu-btn-bar" aria-hidden />
              <span className="layout-menu-btn-bar" aria-hidden />
            </button>

            <div
              className={`layout-nav-backdrop ${menuOpen ? 'is-open' : ''}`}
              aria-hidden
              onClick={closeMenu}
            />

            <nav
              id="main-navigation"
              className={`layout-header-nav ${menuOpen ? 'is-open' : ''}`}
              aria-label="Navigation principale"
            >
              <div className="layout-nav-mobile-head">
                <span className="layout-nav-mobile-title">Menu</span>
                <button
                  type="button"
                  className="layout-menu-btn--close"
                  aria-label="Fermer le menu"
                  onClick={closeMenu}
                >
                  ×
                </button>
              </div>
              {NAV_LINKS.map(({ to, label }) => (
                <Link key={to} to={to} onClick={closeMenu}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
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
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
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
