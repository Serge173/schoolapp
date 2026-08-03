import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { api } from '../../api';

export default function AdminLayout() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const reloadStats = useCallback(() => api.admin.stats().then(setStats), []);

  useEffect(() => {
    api.admin
      .me()
      .then(() => reloadStats())
      .catch(() => {
        sessionStorage.removeItem('adminSession');
        window.location.href = '/admin';
      })
      .finally(() => setLoading(false));
  }, [reloadStats]);

  const handleLogout = () => {
    api.admin.logout().finally(() => {
      sessionStorage.removeItem('adminSession');
      window.location.href = '/admin';
    });
  };

  const navBtn = ({ isActive }) =>
    `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`;

  if (loading) {
    return <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Chargement…</p>;
  }

  return (
    <div className="admin-page" style={{ minHeight: '100vh' }}>
      <header
        className="admin-header"
        style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <Link to="/" style={{ color: 'var(--text-muted)', marginRight: '1rem' }}>
            Site
          </Link>
          <span style={{ fontWeight: 600 }}>Administration</span>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleLogout}>
          Déconnexion
        </button>
      </header>
      <div
        style={{
          width: '100%',
          maxWidth: 'min(1760px, 100%)',
          margin: '0 auto',
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 260px) minmax(0, 1fr)',
          gap: '1.25rem',
          alignItems: 'start',
          boxSizing: 'border-box',
        }}
      >
        <aside className="card" style={{ position: 'sticky', top: '1rem', padding: '1rem' }}>
          <h2 style={{ marginBottom: '0.85rem', fontSize: '1rem' }}>Menu</h2>
          <nav style={{ display: 'grid', gap: '0.5rem' }}>
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
            <NavLink to="/admin/universites" className={navBtn} style={{ justifyContent: 'flex-start' }}>
              Universités
            </NavLink>
            <NavLink to="/admin/filieres" className={navBtn} style={{ justifyContent: 'flex-start' }}>
              Filières
            </NavLink>
          </nav>
        </aside>
        <main style={{ minWidth: 0, width: '100%' }}>
          <Outlet context={{ stats, reloadStats }} />
        </main>
      </div>
    </div>
  );
}
