import { Hono } from 'hono';
import { verifyTurnstile } from '../lib/turnstile';
import { notifyNewLead } from '../lib/notify';
import type { Env } from '../env';

export const publicRoutes = new Hono<{ Bindings: Env }>();

/**
 * 官网表单提交
 * 流水线：Turnstile 校验 → form_submissions 留痕 → leads 入库 → 异步 webhook
 */
publicRoutes.post('/submit-form', async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const { token, form_id, ...payload } = body as {
    token?: string;
    form_id?: string;
    [k: string]: unknown;
  };

  // 1. Turnstile 防刷
  const ip = c.req.header('CF-Connecting-IP') ?? '';
  const valid = await verifyTurnstile(c.env.TURNSTILE_SECRET_KEY, token, ip);
  if (!valid) {
    return c.json({ error: '人机校验失败，请重试' }, 403);
  }

  const now = Math.floor(Date.now() / 1000);
  const submissionId = crypto.randomUUID();
  const leadId = crypto.randomUUID();
  const userAgent = c.req.header('User-Agent') ?? '';
  const formId = form_id ?? 'contact_form';

  // 2. 原始 payload 留痕（审计防漏）
  await c.env.DB.prepare(
    `INSERT INTO form_submissions (id, form_id, payload_json, ip_address, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(submissionId, formId, JSON.stringify(payload), ip, userAgent, now)
    .run();

  // 3. 写入 leads
  const name = String(payload.name ?? '');
  const email = String(payload.email ?? '');
  if (!name || !email) {
    return c.json({ error: 'name / email 必填' }, 400);
  }

  await c.env.DB.prepare(
    `INSERT INTO leads (id, name, email, phone, company_name, source, status, deal_value, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'new', 0, ?, ?)`,
  )
    .bind(
      leadId,
      name,
      email,
      (payload.phone as string) ?? null,
      (payload.company_name as string) ?? null,
      `website:${formId}`,
      now,
      now,
    )
    .run();

  // 4. 异步通知新线索（不阻塞响应）
  c.executionCtx.waitUntil(
    notifyNewLead(
      {
        id: leadId,
        name,
        email,
        phone: (payload.phone as string) ?? null,
        companyName: (payload.company_name as string) ?? null,
        source: `website:${formId}`,
        status: 'new',
        dealValue: 0,
        assignedTo: null,
        createdAt: now,
        updatedAt: now,
      },
      c.env,
    ),
  );

  return c.json({ success: true, lead_id: leadId });
});
