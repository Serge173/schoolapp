import { ADMIN_ROLE_LABELS, normalizeRole, roleBadgeClass } from '../data/adminRoles';

export default function AdminAccountSummaryCard({ admin, title = 'Mon compte' }) {
  if (!admin) return null;

  const role = normalizeRole(admin.role);
  const displayName = admin.prenom ? `${admin.prenom} ${admin.nom}` : admin.nom;
  const letter = (displayName || admin.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="card admin-account-summary">
      <h2 className="admin-account-summary__title">{title}</h2>
      <div className="admin-account-summary__body">
        <div className="admin-account-summary__avatar" aria-hidden="true">
          {admin.photo_url ? (
            <img src={admin.photo_url} alt="" />
          ) : (
            <span>{letter}</span>
          )}
        </div>
        <div className="admin-account-summary__info">
          <div className="admin-account-summary__name">{displayName}</div>
          <div className="admin-account-summary__email">{admin.email}</div>
          {admin.poste ? <div className="admin-account-summary__meta">{admin.poste}</div> : null}
          {admin.telephone ? (
            <div className="admin-account-summary__meta">Tél. {admin.telephone}</div>
          ) : null}
          <div className="admin-account-summary__badges">
            <span className={`badge ${roleBadgeClass(role)}`}>{ADMIN_ROLE_LABELS[role]}</span>
            {admin.pays_bureau ? (
              <span className="badge" style={{ border: '1px solid var(--border)' }}>
                Bureau {admin.pays_bureau}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
