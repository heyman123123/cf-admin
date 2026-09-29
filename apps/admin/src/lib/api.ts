/** 简单 fetch 封装；后续接入 JWT 时在这里加拦截器 */
const BASE = '/api/admin';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    credentials: 'include',
    ...init,
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${await resp.text()}`);
  return resp.json() as Promise<T>;
}

export const api = {
  listPages: () => request<PageItem[]>('/pages'),
  publishPage: (id: string) => request<{ success: boolean }>(`/pages/${id}/publish`, { method: 'PATCH' }),
  listLeads: (status?: string) =>
    request<LeadItem[]>(`/leads${status ? `?status=${status}` : ''}`),
  updateLead: (id: string, body: Partial<{ status: string; assigned_to: string }>) =>
    request(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

export interface PageItem {
  id: string;
  slug: string;
  title: string;
  meta_description?: string | null;
  is_published: number;
  created_at: number;
  updated_at: number;
}

export interface LeadItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company_name?: string | null;
  source: string;
  status: 'new' | 'contacting' | 'qualified' | 'lost' | 'won';
  deal_value: number;
  assigned_to?: string | null;
  created_at: number;
  updated_at: number;
}
