import { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { FIGS_ABIDJAN } from './data/figsBureaus';
import { FIGSAPP_LOGO, FIGSAPP_LOGO_ALT } from './data/brand';
import { getFooterSocialLinks } from './data/socialLinks';
import SocialIcon from './components/SocialIcon';

const NAV_LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/filieres', label: 'Filières' },
  { to: '/catalogue-figs', label: 'Catalogue FIGS' },
  { to: '/rendez-vous', label: 'Rendez-vous' },
  { to: '/contact', label: 'Contact' },
];

export default function Layout() {
  const [navOpen, setNavOpen] = useState(false);

  const closeNav = () => setNavOpen(false);

  useEffect(() => {
    document.body.classList.toggle('nav-locked', navOpen);
    return () => document.body.classList.remove('nav-locked');
  }, [navOpen]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 769px)');
    const onChange = () => {
      if (mq.matches) setNavOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="layout-root">
      <header className="layout-header">
        <div className="container layout-header__inner">
          <Link to="/" className="logo" aria-label="FigsApp-Côte d'Ivoire — accueil" onClick={closeNav}>
            <img
              src={FIGSAPP_LOGO}
              alt={FIGSAPP_LOGO_ALT}
              className="layout-logo-img"
              width={220}
              height={56}
              decoding="async"
            />
          </Link>

          <button
            type="button"
            className={`layout-nav-toggle${navOpen ? ' is-open' : ''}`}
            aria-expanded={navOpen}
            aria-controls="layout-nav-drawer"
            aria-label={navOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setNavOpen((open) => !open)}
          >
            <span className="layout-nav-toggle__icon" aria-hidden="true">
              <span className="layout-nav-toggle__bar" />
              <span className="layout-nav-toggle__bar" />
              <span className="layout-nav-toggle__bar" />
            </span>
          </button>

          <nav className="layout-header-nav layout-header-nav--desktop" aria-label="Navigation principale">
            {NAV_LINKS.map((item) => (
              <Link key={item.to} to={item.to}>{item.label}</Link>
            ))}
          </nav>
        </div>
      </header>

      <div
        className={`layout-nav-backdrop${navOpen ? ' is-visible' : ''}`}
        onClick={closeNav}
        aria-hidden={!navOpen}
      />

      <nav
        id="layout-nav-drawer"
        className={`layout-nav-drawer${navOpen ? ' is-open' : ''}`}
        aria-label="Menu mobile"
        aria-hidden={!navOpen}
      >
        <div className="layout-nav-drawer__head">
          <span className="layout-nav-drawer__label">Navigation</span>
          <button
            type="button"
            className={`layout-nav-toggle is-open`}
            aria-label="Fermer le menu"
            onClick={closeNav}
          >
            <span className="layout-nav-toggle__icon" aria-hidden="true">
              <span className="layout-nav-toggle__bar" />
              <span className="layout-nav-toggle__bar" />
              <span className="layout-nav-toggle__bar" />
            </span>
          </button>
        </div>
        <div className="layout-nav-drawer__links">
          {NAV_LINKS.map((item) => (
            <Link key={item.to} to={item.to} onClick={closeNav}>{item.label}</Link>
          ))}
        </div>
        <div className="layout-nav-drawer__cta">
          <Link to="/filieres" className="btn btn-primary btn-block" onClick={closeNav}>
            Commencer ma candidature
          </Link>
        </div>
      </nav>

      <main className="layout-main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="layout-footer">
        <div className="layout-footer-strip" aria-hidden />
        <div className="container layout-footer-inner">
          <div className="layout-footer-brand">
            <Link to="/" className="layout-footer-logo" aria-label="FigsApp-Côte d'Ivoire — accueil">
              <img
                src={FIGSAPP_LOGO}
                alt={FIGSAPP_LOGO_ALT}
                className="layout-footer-logo-img"
                width={220}
                height={56}
                decoding="async"
              />
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
            {NAV_LINKS.map((item) => (
              <Link key={item.to} to={item.to}>{item.label}</Link>
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
