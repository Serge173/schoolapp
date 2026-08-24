import { ADMIN_ROLE_LABELS, normalizeRole, roleBadgeClass } from '../data/adminRoles';

function RoleBadge({ role, actif }) {
  const r = normalizeRole(role);
  return (
    <span className="admin-accounts-list__badges">
      <span className={`badge ${roleBadgeClass(r)}`} style={{ border: '1px solid var(--border)' }}>
        {ADMIN_ROLE_LABELS[r] || r}
      </span>
      {!actif ? (
        <span
          className="badge"
          style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.3)' }}
        >
          Désactivé
        </span>
      ) : null}
    </span>
  );
}

export default function AdminAccountsList({
  comptes = [],
  loading = false,
  emptyLabel = 'Aucun compte.',
  onEdit,
  compact = false,
}) {
  if (loading) {
    return <p className="admin-accounts-list__loading">Chargement des comptes…</p>;
  }

  if (!comptes.length) {
    return <p className="admin-accounts-list__empty">{emptyLabel}</p>;
  }

  return (
    <ul className={`admin-accounts-list${compact ? ' admin-accounts-list--compact' : ''}`}>
      {comptes.map((c) => (
        <li key={c.id} className="admin-accounts-list__item">
          <div className="admin-accounts-list__row">
            <div className="admin-accounts-list__thumb" aria-hidden="true">
              {c.photo_url ? (
                <img src={c.photo_url} alt="" />
              ) : (
                (c.prenom?.[0] || c.nom?.[0] || '?').toUpperCase()
              )}
            </div>
            <div className="admin-accounts-list__main">
              <strong>{c.prenom ? `${c.prenom} ${c.nom}` : c.nom}</strong>
              <div className="admin-accounts-list__email">{c.email}</div>
              {c.poste && !compact ? (
                <div className="admin-accounts-list__meta">{c.poste}</div>
              ) : null}
              <RoleBadge role={c.role} actif={c.actif} />
            </div>
            {onEdit ? (
              <button
                type="button"
                className="btn btn-secondary admin-accounts-list__edit"
                onClick={() => onEdit(c)}
              >
                Modifier
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
