import { useEffect, useRef } from 'react';

export default function AdminConfirmDialog({
  open,
  title,
  message,
  extra = null,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'danger',
  onConfirm,
  onClose,
}) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const el = ref.current;
    if (!el || !open) return undefined;
    if (!el.open) el.showModal();
    const onCancel = (event) => {
      event.preventDefault();
      closeRef.current();
    };
    el.addEventListener('cancel', onCancel);
    return () => el.removeEventListener('cancel', onCancel);
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      className={`admin-confirm admin-confirm--${tone}`}
      aria-labelledby="admin-confirm-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="admin-confirm__icon" aria-hidden="true">
        {tone === 'success' ? '✓' : '!'}
      </div>
      <h2 id="admin-confirm-title" className="admin-confirm__title">
        {title}
      </h2>
      {message ? <p className="admin-confirm__text">{message}</p> : null}
      {extra}
      <div className="admin-confirm__actions">
        {cancelLabel ? (
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {cancelLabel}
          </button>
        ) : null}
        <button
          type="button"
          className={tone === 'danger' ? 'btn admin-confirm__danger' : 'btn btn-primary'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
