import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { api } from '../../api';
import { FIGSAPP_LOGO, FIGSAPP_LOGO_ALT } from '../../data/brand';
import {
  ADMIN_ROLE_LABELS,
  canManageAccounts,
  canManageContent,
  normalizeRole,
  roleBadgeClass,
} from '../../data/adminRoles';
import './admin-shell.css';
import './admin-mobile.css';

export default function AdminLayout() {
  const [stats, setStats] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const reloadStats = useCallback(() => api.admin.stats().then(setStats), []);

  useEffect(() => {
    api.admin
      .me()
      .then((data) => {
        setAdmin(data.admin);
        sessionStorage.setItem('adminRole', data.admin.role || 'lecteur');
        return reloadStats().catch(() => setStats(null));
      })
      .catch(() => {
        sessionStorage.removeItem('adminSession');
        sessionStorage.removeItem('adminRole');
        window.location.href = '/admin';
      })
      .finally(() => setLoading(false));
  }, [reloadStats]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const mq = window.matchMedia('(max-width: 900px)');
    if (!mq.matches) return undefined;
    document.body.classList.add('nav-locked');
    return () => document.body.classList.remove('nav-locked');
  }, [menuOpen]);

  const handleLogout = () => {
    api.admin.logout().finally(() => {
      sessionStorage.removeItem('adminSession');
      sessionStorage.removeItem('adminRole');
      window.location.href = '/admin';
    });
  };

  const navClass = ({ isActive }) => `admin-shell__nav-link${isActive ? ' is-active' : ''}`;
  const closeMenu = () => setMenuOpen(false);
  const role = normalizeRole(admin?.role);

  if (loading) {
    return <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Chargement…</p>;
  }

  return (
    <div className="admin-page admin-shell" style={{ minHeight: '100vh' }}>
      <header className="admin-header admin-shell__header">
        <div className="admin-shell__header-brand">
          <Link to="/" className="admin-shell__header-site" style={{ color: 'var(--text-muted)' }} aria-label="Retour au site">
            Site
          </Link>
          <img
            src={FIGSAPP_LOGO}
            alt={FIGSAPP_LOGO_ALT}
            className="admin-header-logo"
            width={140}
            height={40}
            decoding="async"
          />
          <span className="admin-shell__title">Administration</span>
          <button
            type="button"
            className="admin-shell__menu-toggle"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? 'Fermer' : 'Menu'}
          </button>
        </div>
        <div className="admin-shell__user">
          {admin ? (
            <Link
              to="/admin/profil"
              onClick={closeMenu}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              {admin.photo_url ? (
                <img
                  src={admin.photo_url}
                  alt=""
                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
                />
              ) : null}
              <div className="admin-shell__user-meta" style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 600 }}>{admin.prenom ? `${admin.prenom} ${admin.nom}` : admin.nom}</div>
                <span className={`badge ${roleBadgeClass(role)}`} style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>
                  {ADMIN_ROLE_LABELS[role]}
                </span>
              </div>
            </Link>
          ) : null}
          <button type="button" className="btn btn-secondary" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>
      {menuOpen ? (
        <button
          type="button"
          className="admin-shell__backdrop"
          aria-label="Fermer le menu"
          onClick={closeMenu}
        />
      ) : null}
      <div className="admin-shell__body">
        <aside className={`card admin-shell__aside admin-shell__panel${menuOpen ? ' is-open' : ''}`}>
          <h2>Menu</h2>
          <nav className="admin-shell__nav">
            <NavLink to="/admin/dashboard" className={navClass} end onClick={closeMenu}>
              Tableau de bord
            </NavLink>
            <NavLink to="/admin/inscriptions" className={navClass} onClick={closeMenu}>
              Inscriptions
            </NavLink>
            <NavLink to="/admin/rendez-vous" className={navClass} onClick={closeMenu} style={{ position: 'relative' }}>
              Les RDV
              {Number(stats?.rendezVous?.nouveau) > 0 && (
                <span className="admin-shell__nav-badge">{stats.rendezVous.nouveau}</span>
              )}
            </NavLink>
            <NavLink to="/admin/profil" className={navClass} onClick={closeMenu}>
              Mon profil
            </NavLink>
            {canManageContent(role) ? (
              <>
                <NavLink to="/admin/universites" className={navClass} onClick={closeMenu}>
                  Universités
                </NavLink>
                <NavLink to="/admin/filieres" className={navClass} onClick={closeMenu}>
                  Filières
                </NavLink>
              </>
            ) : null}
            {canManageAccounts(role) ? (
              <NavLink to="/admin/comptes" className={navClass} onClick={closeMenu}>
                Comptes & rôles
              </NavLink>
            ) : null}
          </nav>
        </aside>
        <main className="admin-shell__main">
          <Outlet context={{ stats, reloadStats, admin }} />
        </main>
      </div>
    </div>
  );
}
