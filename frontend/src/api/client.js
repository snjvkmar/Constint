const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getGraph: () => request('/graph'),
  getMeta: () => request('/meta/schema'),
  createNode: (label, properties) =>
    request('/nodes', { method: 'POST', body: JSON.stringify({ label, properties }) }),
  updateNode: (id, properties) =>
    request(`/nodes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ properties }) }),
  deleteNode: (id) => request(`/nodes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  createEdge: (payload) => request('/edges', { method: 'POST', body: JSON.stringify(payload) }),
  updateEdge: (id, properties) =>
    request(`/edges/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ properties }) }),
  deleteEdge: (id) => request(`/edges/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
