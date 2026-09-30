import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { leads } from '@cf-admin/db';
import { authMiddleware } from '../lib/auth';
import { audit } from '../lib/audit';
import { fireWebhooks } from '../lib/outbound-webhook';
import { THEME_PRESETS } from '../pages/theme';
import type { Env, Variables } from '../env';

export const miscRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
miscRoutes.use('*', authMiddleware);

/** 导出线索为 CSV */
miscRoutes.get('/leads/export', async (c) => {
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  const header = ['id', 'name', 'email', 'phone', 'company_name', 'source', 'status', 'deal_value', 'created_at'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([
      r.id, r.name, r.email, r.phone ?? '', r.company_name ?? '',
      r.source, r.status, r.dealValue, r.createdAt,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
  }
  await audit(c.env, c.get('user')!.username, 'export', 'leads', undefined, { count: rows.length });
  return c.text(lines.join('\n'), 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="leads.csv"',
  });
});

/** 审计日志列表 */
miscRoutes.get('/audit-logs', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200`,
  ).all();
  return c.json(rows.results ?? []);
});

/** 出站 webhook 配置 CRUD */
miscRoutes.get('/webhooks', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT * FROM webhooks ORDER BY created_at DESC`).all();
  return c.json(rows.results ?? []);
});

miscRoutes.post('/webhooks', async (c) => {
  const body = await c.req.json<{ url: string; event: string }>();
  await c.env.DB.prepare(
    `INSERT INTO webhooks (id, url, event, is_active, created_at) VALUES (?, ?, ?, 1, ?)`,
  )
    .bind(crypto.randomUUID(), body.url, body.event, Math.floor(Date.now() / 1000))
    .run();
  return c.json({ success: true });
});

miscRoutes.delete('/webhooks/:id', async (c) => {
  await c.env.DB.prepare(`DELETE FROM webhooks WHERE id = ?`).bind(c.req.param('id')).run();
  return c.json({ success: true });
});

/** 在线索状态变更时调用，触发 webhook */
export async function notifyLeadChanged(env: Env, leadId: string): Promise<void> {
  const row = await env.DB.prepare(`SELECT * FROM leads WHERE id = ?`).bind(leadId).first();
  if (row) await fireWebhooks(env, 'lead.updated', row);
}

/* ------------------------------ 主题 (KV) ------------------------------ */

miscRoutes.get('/theme', async (c) => {
  const raw = await c.env.KV.get('theme:current');
  let theme: Record<string, string> = {};
  if (raw) { try { theme = JSON.parse(raw); } catch { /* ignore */ } }
  return c.json({
    theme,
    presets: Object.entries(THEME_PRESETS).map(([key, { name, vars }]) => ({ key, name, vars })),
  });
});

miscRoutes.put('/theme', async (c) => {
  const body = await c.req.json<{ theme: Record<string, string> }>();
  await c.env.KV.put('theme:current', JSON.stringify(body.theme ?? {}));
  return c.json({ success: true });
});
