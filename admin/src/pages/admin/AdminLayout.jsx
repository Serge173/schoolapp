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

  const handleLogout = () => {
    api.admin.logout().finally(() => {
      sessionStorage.removeItem('adminSession');
      sessionStorage.removeItem('adminRole');
      window.location.href = '/admin';
    });
  };

  const navBtn = ({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`;
  const role = normalizeRole(admin?.role);

  if (loading) {
    return <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Chargement…</p>;
  }

  return (
    <div className="admin-page admin-shell" style={{ minHeight: '100vh' }}>
      <header className="admin-header admin-shell__header">
        <div className="admin-shell__header-brand">
          <Link to="/" style={{ color: 'var(--text-muted)' }} aria-label="Retour au site">
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
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
                />
              ) : null}
              <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
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
      <div className="admin-shell__body">
        <aside className={`card admin-shell__aside${menuOpen ? ' is-open' : ''}`}>
          <h2 style={{ marginBottom: '0.85rem', fontSize: '1rem' }}>Menu</h2>
          <nav className="admin-shell__nav">
            <NavLink to="/admin/dashboard" className={navBtn} style={{ justifyContent: 'flex-start' }} end>
              Tableau de bord
            </NavLink>
            <NavLink to="/admin/inscriptions" className={navBtn} style={{ justifyContent: 'flex-start' }}>
              Inscriptions
            </NavLink>
            <NavLink to="/admin/rendez-vous" className={navBtn} style={{ justifyContent: 'flex-start', position: 'relative' }}>
              Les RDV
              {Number(stats?.rendezVous?.nouveau) > 0 && (
                <span
                  style={{
                    marginLeft: '0.45rem',
                    background: '#dc2626',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.12rem 0.45rem',
                    borderRadius: 999,
                  }}
                >
                  {stats.rendezVous.nouveau}
                </span>
              )}
            </NavLink>
            <NavLink to="/admin/profil" className={navBtn} style={{ justifyContent: 'flex-start' }}>
              Mon profil
            </NavLink>
            {canManageContent(role) ? (
              <>
                <NavLink to="/admin/universites" className={navBtn} style={{ justifyContent: 'flex-start' }}>
                  Universités
                </NavLink>
                <NavLink to="/admin/filieres" className={navBtn} style={{ justifyContent: 'flex-start' }}>
                  Filières
                </NavLink>
              </>
            ) : null}
            {canManageAccounts(role) ? (
              <NavLink to="/admin/comptes" className={navBtn} style={{ justifyContent: 'flex-start' }}>
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
