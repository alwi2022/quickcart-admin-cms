type ApiFetchOptions = RequestInit & {
  headers?: Record<string, string>;
};

type QueryParams = Record<string, string | number | boolean | undefined | null>;

async function apiFetch(path: string, opts: ApiFetchOptions = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string })?.error || 'Request error');
  return data;
}

export const AdminOrders = {
  list: (q: QueryParams = {}) => {
    const usp = new URLSearchParams();
    Object.entries(q).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      usp.set(key, String(value));
    });
    return apiFetch(`/api/admin/orders?${usp.toString()}`);
  },
  get: (id: string) => apiFetch(`/api/admin/orders/${id}`),
  update: (id: string, payload: Record<string, unknown>) =>
    apiFetch(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
};

