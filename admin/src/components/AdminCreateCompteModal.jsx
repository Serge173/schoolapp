import { useEffect, useRef } from 'react';
import AdminCreateCompteForm from './AdminCreateCompteForm';

export default function AdminCreateCompteModal({
  open,
  onClose,
  creatorRole,
  onSuccess,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const handleSuccess = () => {
    onSuccess?.();
    onClose?.();
  };

  return (
    <div
      className="admin-modal-backdrop"
      role="presentation"
      onClick={handleBackdrop}
    >
      <div
        ref={panelRef}
        className="admin-modal-panel card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-create-compte-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-panel__head">
          <h2 id="admin-create-compte-title" className="admin-modal-panel__title">
            Créer un compte
          </h2>
          <button type="button" className="btn btn-secondary admin-modal-panel__close" onClick={onClose}>
            Fermer
          </button>
        </div>
        <AdminCreateCompteForm
          creatorRole={creatorRole}
          compact
          hideTitle
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
