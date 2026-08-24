/** API sur le même domaine (/api). */
const API_BASE = '/api';

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(url, { ...options, headers, credentials: 'include' });
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
        throw new Error('API indisponible. Vérifiez le déploiement Vercel (/api).');
      }
      throw new Error('Réponse serveur invalide.');
    }
  }
  if (!res.ok) {
    if (res.status === 504 || res.status === 503) {
      throw new Error('Le serveur met trop de temps à répondre. Réessayez dans un instant.');
    }
    throw new Error(data.error || data.errors?.[0]?.msg || 'Erreur');
  }
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
    profileUpdate: (body) =>
      request('/admin/me', { method: 'PATCH', body: JSON.stringify(body) }),
    profilePhotoUpload: (file) => {
      const fd = new FormData();
      fd.append('logo', file);
      return fetch(`${API_BASE}/admin/me/photo`, { method: 'POST', credentials: 'include', body: fd }).then(async (res) => {
        const text = await res.text();
        let data = {};
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Réponse serveur invalide.');
        }
        if (!res.ok) throw new Error(data.error || 'Erreur upload');
        return data;
      });
    },
    logout: () => request('/admin/logout', { method: 'POST' }),
    stats: () => request('/admin/stats'),
    inscriptions: (params = {}) => {
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
      );
      const q = new URLSearchParams(clean).toString();
      return request(`/admin/inscriptions${q ? '?' + q : ''}`);
    },
    inscriptionGet: (id) => request(`/admin/inscriptions/${id}`),
    inscriptionUpdate: (id, body) =>
      request(`/admin/inscriptions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    comptes: {
      list: () => request('/admin/comptes'),
      meta: () => request('/admin/comptes/meta'),
      create: (body) => request('/admin/comptes', { method: 'POST', body: JSON.stringify(body) }),
      update: (id, body) =>
        request(`/admin/comptes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
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
    rendezVousDelete: (id) => request(`/admin/rendez-vous/${id}`, { method: 'DELETE' }),
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
  return uploadPath;
}
