/**
 * 邮件服务（v3 · MoeMail 能力对齐，Cloudflare 原生实现）
 * - 邮箱账号：永久 / 临时（1h / 24h / 3d）
 * - 收件：Email Routing Catch-all → POST /api/mail/incoming（MAIL_INCOMING_SECRET 校验）
 * - 发件：Resend API（需 RESEND_API_KEY + RESEND_FROM + 域名 SPF/DKIM）
 * - 分享：单封邮件公开链接 /api/mail/shared/:token
 * - 管理接口走 admin JWT；incoming / shared 公开
 */
import { Hono } from 'hono';
import type { Env } from '../env';
import { authMiddleware } from '../lib/auth';

export const mailRoutes = new Hono<{ Bindings: Env }>();

const now = () => Math.floor(Date.now() / 1000);
const uid = () => crypto.randomUUID();

/** D1 原始行 → camelCase（对齐前端类型） */
function mapAccount(row: Record<string, unknown>) {
  return {
    id: row.id, address: row.address, domain: row.domain,
    expiresAt: row.expires_at ?? null, role: row.role,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}
function mapMessage(row: Record<string, unknown>) {
  return {
    id: row.id, accountId: row.account_id, mailbox: row.mailbox,
    subject: row.subject, fromAddr: row.from_addr, toAddr: row.to_addr,
    bodyText: row.body_text, bodyHtml: row.body_html, readAt: row.read_at, createdAt: row.created_at,
  };
}

function ttlToExpires(ttl?: string): number | null {
  if (!ttl || ttl === 'forever') return null;
  const s = { '1h': 3600, '24h': 86400, '3d': 259200 } as Record<string, number>;
  return now() + (s[ttl] ?? 3600);
}

function validAddress(addr: string, domains: string[]): boolean {
  const [local, domain] = addr.split('@');
  if (!local || !domain || !domains.includes(domain)) return false;
  return /^[a-z0-9][a-z0-9._-]{0,63}$/.test(local);
}

/** 惰性清理过期邮箱 */
async function sweepExpired(db: D1Database) {
  await db.prepare('DELETE FROM email_accounts WHERE expires_at IS NOT NULL AND expires_at < ?').bind(now()).run();
}

async function findAccountByAddress(db: D1Database, address: string) {
  const r = await db.prepare('SELECT * FROM email_accounts WHERE address = ?').bind(address).first();
  return r ?? null;
}

/** 简单解析 Email Routing 转发的 rfc822 消息 */
function parseRfc822(raw: string): { from: string; to: string; subject: string; body: string } {
  const idx = raw.indexOf('\r\n\r\n');
  const sep = idx >= 0 ? idx : raw.indexOf('\n\n');
  const header = (sep >= 0 ? raw.slice(0, sep) : raw).replace(/\r/g, '');
  const bodyRaw = sep >= 0 ? raw.slice(sep + (idx >= 0 ? 4 : 2)) : '';
  const get = (name: string) => {
    const re = new RegExp(`^${name}:\\s*(.+)$`, 'im');
    const m = header.match(re);
    return m ? m[1].trim() : '';
  };
  // body：去掉可能的 quoted-printable/base64 简单处理（截断到 8KB）
  return { from: get('From'), to: get('To'), subject: get('Subject'), body: bodyRaw.slice(0, 8000) };
}

/* ================= 管理接口（admin JWT） ================= */

mailRoutes.use('/domains', authMiddleware);
mailRoutes.use('/accounts*', authMiddleware);
mailRoutes.use('/messages*', authMiddleware);
mailRoutes.use('/send', authMiddleware);

// 允许域名
mailRoutes.get('/domains', (c) => {
  const domains = (c.env.MAIL_DOMAINS ?? 'mail.example.com').split(',').map((d) => d.trim()).filter(Boolean);
  return c.json({ domains });
});

// 邮箱列表
mailRoutes.get('/accounts', async (c) => {
  const db = c.env.MAIL_DB;
  if (!db) return c.json({ error: 'mail service not enabled' }, 503);
  await sweepExpired(db);
  const { results } = await db.prepare('SELECT * FROM email_accounts ORDER BY created_at DESC').all();
  return c.json({ accounts: (results as Record<string, unknown>[]).map(mapAccount) });
});

// 创建邮箱
mailRoutes.post('/accounts', async (c) => {
  const db = c.env.MAIL_DB;
  if (!db) return c.json({ error: 'mail service not enabled' }, 503);
  const body = await c.req.json().catch(() => ({}));
  const { address, ttl = '24h', role = 'knight' } = body as { address?: string; ttl?: string; role?: string };
  if (!address) return c.json({ error: 'address required' }, 400);
  const domains = (c.env.MAIL_DOMAINS ?? 'mail.example.com').split(',').map((d) => d.trim());
  if (!validAddress(address, domains)) return c.json({ error: `invalid address, allowed domains: ${domains.join(', ')}` }, 400);
  const exists = await findAccountByAddress(db, address.toLowerCase());
  if (exists) return c.json({ error: 'address already exists' }, 409);

  const expires = ttlToExpires(ttl);
  const id = uid();
  const [, domain] = address.split('@');
  await db.prepare(
    'INSERT INTO email_accounts (id, address, domain, expires_at, role, created_at, updated_at) VALUES (?,?,?,?,?,?,?)'
  ).bind(id, address.toLowerCase(), domain, expires, role, now(), now()).run();
  const row = await db.prepare('SELECT * FROM email_accounts WHERE id = ?').bind(id).first();
  return c.json({ account: row ? mapAccount(row as Record<string, unknown>) : row }, 201);
});

// 删除邮箱
mailRoutes.delete('/accounts/:id', async (c) => {
  const db = c.env.MAIL_DB;
  if (!db) return c.json({ error: 'mail service not enabled' }, 503);
  await db.prepare('DELETE FROM email_accounts WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// 邮箱收件箱
mailRoutes.get('/accounts/:address/messages', async (c) => {
  const db = c.env.MAIL_DB;
  if (!db) return c.json({ error: 'mail service not enabled' }, 503);
  const acc = await findAccountByAddress(db, c.req.param('address'));
  if (!acc) return c.json({ error: 'account not found' }, 404);
  const mailbox = c.req.query('mailbox') ?? 'inbox';
  const { results } = await db.prepare(
    'SELECT * FROM email_messages WHERE account_id = ? AND mailbox = ? ORDER BY created_at DESC LIMIT 200'
  ).bind(acc.id, mailbox).all();
  return c.json({ messages: (results as Record<string, unknown>[]).map(mapMessage) });
});

// 单封邮件详情
mailRoutes.get('/messages/:id', async (c) => {
  const db = c.env.MAIL_DB;
  if (!db) return c.json({ error: 'mail service not enabled' }, 503);
  const row = await db.prepare('SELECT * FROM email_messages WHERE id = ?').bind(c.req.param('id')).first();
  if (!row) return c.json({ error: 'message not found' }, 404);
  return c.json({ message: mapMessage(row as Record<string, unknown>) });
});

// 标记已读
mailRoutes.patch('/messages/:id/read', async (c) => {
  const db = c.env.MAIL_DB;
  if (!db) return c.json({ error: 'mail service not enabled' }, 503);
  await db.prepare('UPDATE email_messages SET read_at = COALESCE(read_at, ?) WHERE id = ?').bind(now(), c.req.param('id')).run();
  return c.json({ success: true });
});

// 删除邮件
mailRoutes.delete('/messages/:id', async (c) => {
  const db = c.env.MAIL_DB;
  if (!db) return c.json({ error: 'mail service not enabled' }, 503);
  await db.prepare('DELETE FROM email_messages WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// 生成分享链接
mailRoutes.post('/messages/:id/share', async (c) => {
  const db = c.env.MAIL_DB;
  if (!db) return c.json({ error: 'mail service not enabled' }, 503);
  const msg = await db.prepare('SELECT * FROM email_messages WHERE id = ?').bind(c.req.param('id')).first();
  if (!msg) return c.json({ error: 'message not found' }, 404);
  const token = uid().replace(/-/g, '').slice(0, 24);
  await db.prepare('INSERT INTO email_shares (id, message_id, token, created_at) VALUES (?,?,?,?)')
    .bind(uid(), msg.id, token, now()).run();
  return c.json({ token, url: `/api/mail/shared/${token}` });
});

// 删除分享
mailRoutes.delete('/messages/:id/share', async (c) => {
  const db = c.env.MAIL_DB;
  if (!db) return c.json({ error: 'mail service not enabled' }, 503);
  const msg = await db.prepare('SELECT * FROM email_messages WHERE id = ?').bind(c.req.param('id')).first();
  if (!msg) return c.json({ error: 'message not found' }, 404);
  await db.prepare('DELETE FROM email_shares WHERE message_id = ?').bind(msg.id).run();
  return c.json({ success: true });
});

// 发件（Resend）
mailRoutes.post('/send', async (c) => {
  const db = c.env.MAIL_DB;
  const key = c.env.RESEND_API_KEY;
  if (!key) return c.json({ error: 'RESEND_API_KEY not configured, sending disabled' }, 501);
  const body = await c.req.json().catch(() => ({}));
  const { to, subject, text, html } = body as { to?: string; subject?: string; text?: string; html?: string };
  if (!to || !subject || (!text && !html)) return c.json({ error: 'to, subject, and text/html required' }, 400);

  const from = c.env.RESEND_FROM ?? 'onboarding@resend.dev';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, text, html }),
  });
  const j = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) return c.json({ error: `resend: ${j.message ?? res.status}` }, 502);

  // 记录到发件人自己的邮箱（若存在发件账号）
  if (db) {
    const acc = await findAccountByAddress(db, from.split('<').pop()?.replace('>', '') ?? from);
    if (acc) {
      await db.prepare(
        'INSERT INTO email_messages (id, account_id, mailbox, subject, from_addr, to_addr, body_text, body_html, created_at) VALUES (?,?,?,?,?,?,?,?,?)'
      ).bind(uid(), acc.id, 'sent', subject, from, to, text ?? '', html ?? '', now()).run();
    }
  }
  return c.json({ success: true, resendId: j.id });
});

/* ================= 公开接口 ================= */

// Email Routing 回调（收件）
mailRoutes.post('/incoming', async (c) => {
  const secret = c.env.MAIL_INCOMING_SECRET;
  const got = c.req.header('x-mail-secret') ?? c.req.query('secret');
  if (secret && got !== secret) return c.json({ error: 'forbidden' }, 403);
  const db = c.env.MAIL_DB;
  if (!db) return c.json({ error: 'mail service not enabled' }, 503);

  let raw = '';
  let toAddr = '';
  const ct = c.req.header('content-type') ?? '';
  if (ct.includes('multipart/form-data')) {
    const form = await c.req.formData();
    raw = String(form.get('message') ?? '');
    toAddr = String(form.get('to') ?? '');
  } else {
    raw = await c.req.text();
  }
  const msg = parseRfc822(raw);
  const to = toAddr || msg.to || '';
  // 规范化：可能带显示名 "Name <addr>" 或逗号分隔
  const m = to.match(/<([^>]+)>/) ?? to.split(',')[0].match(/[^\s]+@[^\s]+/);
  const target = m ? (m[1] ?? m[0]) : to.trim();
  if (!target) return c.json({ error: 'no recipient' }, 400);

  const acc = await findAccountByAddress(db, target.toLowerCase());
  if (!acc) return c.json({ error: 'no mailbox for ' + target }, 404);
  if (acc.expires_at && acc.expires_at < now()) return c.json({ error: 'mailbox expired' }, 410);

  await db.prepare(
    'INSERT INTO email_messages (id, account_id, mailbox, subject, from_addr, to_addr, body_text, created_at) VALUES (?,?,?,?,?,?,?,?)'
  ).bind(uid(), acc.id, 'inbox', msg.subject.slice(0, 500), msg.from, target, msg.body, now()).run();
  return c.json({ success: true, deliveredTo: target });
});

// 公开分享查看（无需登录）
mailRoutes.get('/shared/:token', async (c) => {
  const db = c.env.MAIL_DB;
  if (!db) return c.json({ error: 'mail service not enabled' }, 503);
  const share = await db.prepare('SELECT * FROM email_shares WHERE token = ?').bind(c.req.param('token')).first();
  if (!share) return c.json({ error: 'share not found or expired' }, 404);
  const row = await db.prepare('SELECT * FROM email_messages WHERE id = ?').bind(share.message_id).first();
  if (!row) return c.json({ error: 'message not found' }, 404);
  return c.json({
    subject: row.subject, from: row.from_addr, to: row.to_addr,
    bodyText: row.body_text, bodyHtml: row.body_html, createdAt: row.created_at,
  });
});
