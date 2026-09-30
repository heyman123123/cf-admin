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

  // 以 /api/ 开头的完整路径直接使用（如邮件服务 /api/mail/*），其余拼接 admin BASE
  const url = path.startsWith('/api/') ? path : BASE + path;
  const resp = await fetch(url, { ...init, headers });
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
    request<{ success: boolean; purged: string; version: number }>(`/pages/${id}/publish`, { method: 'PATCH' }),
  listBlocks: (pageId: string) => request<BlockItem[]>(`/pages/${pageId}/blocks`),
  saveBlocks: (pageId: string, blocks: BlockDraft[]) =>
    request(`/pages/${pageId}/blocks`, { method: 'PUT', body: JSON.stringify(blocks) }),
  listPageVersions: (pageId: string) =>
    request<PageVersion[]>(`/pages/${pageId}/versions`),
  restoreVersion: (pageId: string, vid: string) =>
    request<{ success: boolean; version: number }>(`/pages/${pageId}/versions/${vid}/restore`, { method: 'POST' }),
  getLayout: (part: 'header' | 'footer') =>
    request<{ part: string; blocks: BlockDraft[] }>(`/layout/${part}`),
  saveLayout: (part: 'header' | 'footer', blocks: BlockDraft[]) =>
    request(`/layout/${part}`, { method: 'PUT', body: JSON.stringify({ blocks }) }),

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

  updatePage: (id: string, body: { slug?: string; title?: string; meta_description?: string; is_published?: number; show_header?: number; show_footer?: number }) =>
    request(`/pages/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getTheme: () => request<{ theme: Record<string, string>; presets: { key: string; name: string; vars: Record<string, string> }[] }>('/theme'),
  saveTheme: (theme: Record<string, string>) =>
    request('/theme', { method: 'PUT', body: JSON.stringify({ theme }) }),

  // 邮件服务（v3 · MoeMail 对齐）
  mailDomains: () => request<{ domains: string[] }>('/api/mail/domains'),
  mailAccounts: () => request<{ accounts: MailAccount[] }>('/api/mail/accounts'),
  mailCreateAccount: (body: { address: string; ttl?: string; role?: string }) =>
    request<{ account: MailAccount }>('/api/mail/accounts', { method: 'POST', body: JSON.stringify(body) }),
  mailDeleteAccount: (id: string) =>
    request(`/api/mail/accounts/${id}`, { method: 'DELETE' }),
  mailMessages: (address: string, mailbox?: string) =>
    request<{ messages: MailMessage[] }>(`/api/mail/accounts/${encodeURIComponent(address)}/messages${mailbox ? `?mailbox=${mailbox}` : ''}`),
  mailMessage: (id: string) =>
    request<{ message: MailMessage }>(`/api/mail/messages/${id}`),
  mailMarkRead: (id: string) =>
    request(`/api/mail/messages/${id}/read`, { method: 'PATCH' }),
  mailDeleteMessage: (id: string) =>
    request(`/api/mail/messages/${id}`, { method: 'DELETE' }),
  mailShare: (id: string) =>
    request<{ token: string; url: string }>(`/api/mail/messages/${id}/share`, { method: 'POST' }),
  mailSend: (body: { to: string; subject: string; text?: string; html?: string }) =>
    request(`/api/mail/send`, { method: 'POST', body: JSON.stringify(body) }),
};

export interface PageItem {
  id: string; slug: string; title: string;
  metaDescription?: string | null; isPublished: number;
  createdAt: number; updatedAt: number;
  showHeader?: number; showFooter?: number;
  versionCount?: number; publishedCount?: number;
  publishedAt?: number | null; draftAt?: number | null;
}
export interface PageVersion {
  id: string; version: number; status: 'draft' | 'published';
  created_by?: string | null; created_at: number;
}
export interface BlockItem {
  id: string; pageId: string; blockType: string;
  sortOrder: number; contentJson: string; updatedAt: number;
}
export type BlockDraft = { block_type: string; sort_order: number; content_json: unknown };
export interface MailAccount {
  id: string; address: string; domain: string;
  expiresAt?: number | null; role: string;
  createdAt: number; updatedAt: number;
}
export interface MailMessage {
  id: string; accountId: string; mailbox: 'inbox' | 'sent';
  subject?: string | null; fromAddr?: string | null; toAddr?: string | null;
  bodyText?: string | null; bodyHtml?: string | null; readAt?: number | null; createdAt: number;
}
