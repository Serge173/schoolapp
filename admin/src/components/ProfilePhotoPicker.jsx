import { useRef } from 'react';

const DEFAULT_SIZE = 88;

/**
 * Sélecteur de photo de profil (aperçu + bouton fichier).
 * @param {string} photoUrl - URL actuelle de la photo
 * @param {string} [name] - nom affiché dans l'avatar par défaut
 * @param {(file: File) => void | Promise<void>} onFileSelect
 * @param {boolean} [loading]
 * @param {number} [size]
 */
export default function ProfilePhotoPicker({ photoUrl, name = '', onFileSelect, loading = false, size = DEFAULT_SIZE }) {
  const inputRef = useRef(null);
  const letter = (name || '?').trim().charAt(0).toUpperCase();

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onFileSelect(file);
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'var(--surface)',
          border: '2px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.38,
          fontWeight: 700,
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          letter
        )}
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleChange}
          style={{ display: 'none' }}
          disabled={loading}
        />
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem' }}
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? 'Upload…' : photoUrl ? 'Changer la photo' : 'Ajouter une photo'}
        </button>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          JPG, PNG ou WebP — max 2 Mo
        </p>
      </div>
    </div>
  );
}
