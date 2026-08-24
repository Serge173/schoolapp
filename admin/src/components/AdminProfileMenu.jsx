import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminCreateCompteForm from './AdminCreateCompteForm';
import {
  ADMIN_ROLE_LABELS,
  canManageAccounts,
  normalizeRole,
  roleBadgeClass,
} from '../data/adminRoles';

function AvatarCircle({ admin, size = 40 }) {
  const name = admin.prenom ? `${admin.prenom} ${admin.nom}` : admin.nom || '';
  const letter = (name || admin.email || '?').trim().charAt(0).toUpperCase();

  if (admin.photo_url) {
    return (
      <img
        src={admin.photo_url}
        alt=""
        className="admin-profile-menu__avatar-img"
        width={size}
        height={size}
      />
    );
  }

  return (
    <span className="admin-profile-menu__avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {letter}
    </span>
  );
}

export default function AdminProfileMenu({ admin }) {
  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const rootRef = useRef(null);

  const role = normalizeRole(admin?.role);
  const canCreate = canManageAccounts(role);
  const displayName = admin.prenom ? `${admin.prenom} ${admin.nom}` : admin.nom;

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setShowCreateForm(false);
        setCreateSuccess('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const toggleOpen = () => {
    setOpen((v) => {
      if (v) {
        setShowCreateForm(false);
        setCreateSuccess('');
      }
      return !v;
    });
  };

  const handleCreateSuccess = () => {
    setCreateSuccess('Compte créé avec succès.');
    setShowCreateForm(false);
  };

  if (!admin) return null;

  return (
    <div className="admin-profile-menu" ref={rootRef}>
      <button
        type="button"
        className="admin-profile-menu__trigger"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={toggleOpen}
        title={displayName || 'Mon profil'}
      >
        <AvatarCircle admin={admin} size={40} />
      </button>

      {open ? (
        <div className="admin-profile-menu__panel card admin-shell__panel">
          <div className="admin-profile-menu__head">
            <AvatarCircle admin={admin} size={52} />
            <div className="admin-profile-menu__info">
              <div className="admin-profile-menu__name">{displayName}</div>
              <div className="admin-profile-menu__email">{admin.email}</div>
              <span className={`badge ${roleBadgeClass(role)}`}>{ADMIN_ROLE_LABELS[role]}</span>
              {admin.poste ? (
                <div className="admin-profile-menu__meta">{admin.poste}</div>
              ) : null}
            </div>
            {canCreate ? (
              <button
                type="button"
                className="btn btn-primary admin-profile-menu__create-btn"
                onClick={() => {
                  setShowCreateForm((v) => !v);
                  setCreateSuccess('');
                }}
              >
                {showCreateForm ? 'Fermer' : 'Créer un compte'}
              </button>
            ) : null}
          </div>

          {createSuccess ? (
            <div className="admin-profile-menu__success">{createSuccess}</div>
          ) : null}

          {showCreateForm && canCreate ? (
            <div className="admin-profile-menu__form-wrap">
              <AdminCreateCompteForm
                creatorRole={role}
                compact
                onSuccess={handleCreateSuccess}
              />
            </div>
          ) : null}

          <div className="admin-profile-menu__foot">
            <Link to="/admin/profil" className="admin-profile-menu__link" onClick={() => setOpen(false)}>
              Modifier mon profil
            </Link>
            {canCreate ? (
              <Link to="/admin/comptes" className="admin-profile-menu__link" onClick={() => setOpen(false)}>
                Gérer tous les comptes
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
