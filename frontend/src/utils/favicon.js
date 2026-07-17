/**
 * Favicon haute résolution via le service Google (même principe que les logos d’écoles).
 * @param {string} domain - ex. "education.gouv.fr"
 * @param {number} [size=64] - taille demandée (px)
 */
export function faviconUrl(domain, size = 64) {
  if (!domain || typeof domain !== 'string') return '';
  const d = domain.trim().replace(/^https?:\/\//i, '').split('/')[0];
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=${size}`;
}
