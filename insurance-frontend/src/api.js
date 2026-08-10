// API base URL — change this if backend runs on a different port
const BASE_URL = 'http://localhost:8080/api';

// ── Generic fetch helper ──────────────────────────────────────────────────────
async function request(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  // 204 No Content has no body
  if (res.status === 204) return null;
  return res.json();
}

// ── Customer API ──────────────────────────────────────────────────────────────
export const customerApi = {
  getAll:    ()       => request('GET',    '/customers'),
  getById:   (id)     => request('GET',    `/customers/${id}`),
  create:    (data)   => request('POST',   '/customers', data),
  update:    (id, d)  => request('PUT',    `/customers/${id}`, d),
  delete:    (id)     => request('DELETE', `/customers/${id}`),
};

// ── Policy API ────────────────────────────────────────────────────────────────
export const policyApi = {
  getAll:           ()           => request('GET',  '/policies'),
  getById:          (id)         => request('GET',  `/policies/${id}`),
  getByCustomer:    (customerId) => request('GET',  `/policies/customer/${customerId}`),
  create:           (data)       => request('POST', '/policies', data),
};

// ── Claim API ─────────────────────────────────────────────────────────────────
export const claimApi = {
  getAll:       ()         => request('GET',  '/claims'),
  getById:      (id)       => request('GET',  `/claims/${id}`),
  getByPolicy:  (policyId) => request('GET',  `/claims/policy/${policyId}`),
  getByStatus:  (status)   => request('GET',  `/claims/status/${status}`),
  getByRisk:    (level)    => request('GET',  `/claims/risk/${level}`),
  submit:       (data)     => request('POST', '/claims', data),
  approve:      (id, notes) => request('PUT', `/claims/${id}/approve`, { reviewNotes: notes }),
  reject:       (id, notes) => request('PUT', `/claims/${id}/reject`,  { reviewNotes: notes }),
};
