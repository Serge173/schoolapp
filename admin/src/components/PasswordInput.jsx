import { useState } from 'react';

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  boxSizing: 'border-box',
};

export default function PasswordInput({
  label,
  name,
  value,
  onChange,
  required = false,
  minLength = 8,
  placeholder,
  hint,
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'stretch' }}>
        <input
          type={visible ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          minLength={required ? minLength : undefined}
          placeholder={placeholder}
          style={{ ...inputStyle, flex: 1 }}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.65rem', whiteSpace: 'nowrap' }}
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
        >
          {visible ? 'Masquer' : 'Afficher'}
        </button>
      </div>
      {hint ? (
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{hint}</p>
      ) : null}
    </div>
  );
}
