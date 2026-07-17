/** Base des appels API (dev : /api via proxy Vite). Si URL absolue sans /api, on l’ajoute (évite les 404). */
function normalizeApiBase(raw) {
  const s = String(raw || '/api').replace(/\/+$/, '') || '/api';
  if (s.startsWith('http') && !/\/api$/i.test(s) && !s.includes('/api/')) {
    return `${s}/api`;
  }
  return s;
}
const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE);
const API_ORIGIN = API_BASE.startsWith('http')
  ? API_BASE.replace(/\/api$/i, '')
  : '';

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(url, { ...options, headers, credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || 'Erreur');
  return data;
}

export const api = {
  filieres: {
    list: (type) => request(`/filieres?type=${type || ''}`),
    get: (id) => request(`/filieres/${id}`),
    niveauxDisponibles: (id) => request(`/filieres/${id}/niveaux-disponibles`),
  },
  universites: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/universites${q ? '?' + q : ''}`);
    },
    get: (id) => request(`/universites/${id}`),
  },
  inscriptions: {
    create: (body) => request('/inscriptions', { method: 'POST', body: JSON.stringify(body) }),
  },
  contact: {
    send: (body) => request('/contact', { method: 'POST', body: JSON.stringify(body) }),
  },
  rendezVous: {
    create: (body) => request('/rendez-vous', { method: 'POST', body: JSON.stringify(body) }),
  },
  demandesOrientation: {
    create: (body) => request('/demandes-orientation', { method: 'POST', body: JSON.stringify(body) }),
  },
  programmesFigs: {
    list: (params = {}) => {
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
      );
      const q = new URLSearchParams(clean).toString();
      return request(`/programmes-figs${q ? '?' + q : ''}`);
    },
    get: (id) => request(`/programmes-figs/${id}`),
  },
  admin: {
    login: (email, password) =>
      request('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => request('/admin/me'),
    logout: () => request('/admin/logout', { method: 'POST' }),
    stats: () => request('/admin/stats'),
    inscriptions: (params = {}) => {
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
      );
      const q = new URLSearchParams(clean).toString();
      return request(`/admin/inscriptions${q ? '?' + q : ''}`);
    },
    rendezVous: (params = {}) => {
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
      );
      const q = new URLSearchParams(clean).toString();
      return request(`/admin/rendez-vous${q ? '?' + q : ''}`);
    },
    rendezVousUpdate: (id, body) =>
      request(`/admin/rendez-vous/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    filieres: () => request('/admin/filieres'),
    filieresTree: () => request('/admin/filieres/tree'),
    filiereCreate: (body) => request('/admin/filieres', { method: 'POST', body: JSON.stringify(body) }),
    filiereUpdate: (id, body) => request(`/admin/filieres/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    filiereToggle: (id, actif) => request(`/admin/filieres/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ actif }) }),
    filiereSetGrandGroupe: (id, body) =>
      request(`/admin/filieres/${id}/grand-groupe`, { method: 'PATCH', body: JSON.stringify(body) }),
    filiereDelete: (id) => request(`/admin/filieres/${id}`, { method: 'DELETE' }),
    sousFiliereCreate: (filiereId, body) =>
      request(`/admin/filieres/${filiereId}/sous-filieres`, { method: 'POST', body: JSON.stringify(body) }),
    sousFiliereUpdate: (id, body) =>
      request(`/admin/sous-filieres/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    sousFiliereDelete: (id) => request(`/admin/sous-filieres/${id}`, { method: 'DELETE' }),
    filiereSyncReferentielSous: (id) =>
      request(`/admin/filieres/${id}/sync-referentiel-sous`, { method: 'POST' }),
    filieresSyncReferentielSousAll: () =>
      request('/admin/filieres/sync-referentiel-sous-all', { method: 'POST' }),
    universites: () => request('/admin/universites'),
    universiteCreate: (body) =>
      request('/admin/universites', { method: 'POST', body: JSON.stringify(body) }),
    universiteUpdate: (id, body) =>
      request(`/admin/universites/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    universiteDelete: (id) => request(`/admin/universites/${id}`, { method: 'DELETE' }),
    universiteFilieres: (id, body) =>
      request(`/admin/universites/${id}/filieres`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    uploadLogo: (id, file) => {
      const fd = new FormData();
      fd.append('logo', file);
      return fetch(`${API_BASE}/admin/universites/${id}/logo`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      }).then((r) => r.json());
    },
    uploadBrochure: (id, file) => {
      const fd = new FormData();
      fd.append('brochure', file);
      return fetch(`${API_BASE}/admin/universites/${id}/brochure`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      }).then((r) => r.json());
    },
    uploadPhotos: (id, files) => {
      const fd = new FormData();
      for (const f of files) fd.append('photos', f);
      return fetch(`${API_BASE}/admin/universites/${id}/photos`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      }).then((r) => r.json());
    },
  },
};

export function uploadsUrl(path) {
  if (!path) return null;
  const name = path.split(/[/\\]/).pop();
  const uploadPath = `/uploads/${path.includes('brochure') ? 'brochures' : path.includes('logo') ? 'logos' : 'photos'}/${name}`;
  return API_ORIGIN ? `${API_ORIGIN}${uploadPath}` : uploadPath;
}
