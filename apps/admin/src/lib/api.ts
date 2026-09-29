/** fetch 封装：JWT 走 Authorization: Bearer 头 */
const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/admin`;

const TOKEN_KEY = 'cf_admin_token';
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> | undefined) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(init?.body instanceof FormData)) headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';

  const resp = await fetch(BASE + path, { ...init, headers });
  if (resp.status === 401) {
    clearToken();
    if (!location.pathname.startsWith('/login')) location.href = '/login';
    throw new Error('unauthorized');
  }
  if (!resp.ok) throw new Error(`API ${resp.status}: ${await resp.text()}`);
  return resp.status === 204 ? (undefined as T) : ((await resp.json()) as T);
}

export const api = {
  login: async (username: string, password: string) => {
    const r = await request<{ success: boolean; username: string; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(r.token);
    return r;
  },
  logout: () => {
    clearToken();
    return request('/auth/logout', { method: 'POST' }).catch(() => undefined);
  },
  me: () => request<{ user: { username: string } }>('/auth/me'),

  listPages: () => request<PageItem[]>('/pages'),
  createPage: (body: { slug: string; title: string; meta_description?: string }) =>
    request<{ id: string }>('/pages', { method: 'POST', body: JSON.stringify(body) }),
  publishPage: (id: string) =>
    request<{ success: boolean; purged: string }>(`/pages/${id}/publish`, { method: 'PATCH' }),
  listBlocks: (pageId: string) => request<BlockItem[]>(`/pages/${pageId}/blocks`),
  saveBlocks: (pageId: string, blocks: BlockDraft[]) =>
    request(`/pages/${pageId}/blocks`, { method: 'PUT', body: JSON.stringify(blocks) }),

  listLeads: (status?: string) =>
    request<LeadItem[]>(`/leads${status ? `?status=${status}` : ''}`),
  getLead: (id: string) => request<LeadItem>(`/leads/${id}`),
  updateLead: (id: string, body: Record<string, unknown>) =>
    request(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  listActivities: (leadId: string) => request<ActivityItem[]>(`/leads/${leadId}/activities`),
  addActivity: (leadId: string, body: { activity_type: string; note: string; next_follow_up?: number }) =>
    request(`/leads/${leadId}/activities`, { method: 'POST', body: JSON.stringify(body) }),

  uploadMedia: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const token = getToken();
    return fetch(`${BASE}/media/upload`, {
      method: 'POST',
      body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((r) => r.json()) as Promise<{ key: string; url: string; size: number }>;
  },
  listMedia: () => request<{ key: string; url: string; size: number; uploaded: string }[]>('/media/list'),

  stats: () => request<{ total: number; new_last_30d: number; by_status: { status: string; c: number }[] }>('/stats/overview'),
};

export interface PageItem {
  id: string; slug: string; title: string;
  meta_description?: string | null; is_published: number;
  created_at: number; updated_at: number;
}
export interface BlockItem {
  id: string; page_id: string; block_type: string;
  sort_order: number; content_json: string; updated_at: number;
}
export type BlockDraft = { block_type: string; sort_order: number; content_json: unknown };
export interface LeadItem {
  id: string; name: string; email: string;
  phone?: string | null; company_name?: string | null;
  source: string; status: 'new' | 'contacting' | 'qualified' | 'lost' | 'won';
  deal_value: number; assigned_to?: string | null;
  created_at: number; updated_at: number;
}
export interface ActivityItem {
  id: string; lead_id: string; created_by: string;
  activity_type: 'call' | 'email' | 'meeting' | 'note';
  note: string; next_follow_up?: number | null; created_at: number;
}
