import { useLayoutEffect, useRef, useState } from 'react';

/** Texte long : deux lignes, puis lecture dans le bloc (défilement interne). */
export default function AdminExpandText({ text, empty = '—' }) {
  const value = text == null ? '' : String(text).trim();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [canToggle, setCanToggle] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    setCanToggle(el.scrollHeight > el.clientHeight + 2);
  }, [value, open]);

  if (!value) {
    if (empty == null) return null;
    return <span className="admin-expand__empty">{empty}</span>;
  }

  return (
    <div className={`admin-expand${open ? ' is-open' : ''}`}>
      <p ref={ref} className="admin-expand__text">
        {value}
      </p>
      {canToggle || open ? (
        <button type="button" className="admin-expand__btn" onClick={() => setOpen((v) => !v)}>
          {open ? 'Réduire' : 'Lire la suite'}
        </button>
      ) : null}
    </div>
  );
}
