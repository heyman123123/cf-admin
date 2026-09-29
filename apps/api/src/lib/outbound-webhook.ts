import type { Env } from '../env';

/** 触发所有订阅了 event 的出站 webhook */
export async function fireWebhooks(env: Env, event: string, payload: unknown): Promise<void> {
  const rows = await env.DB.prepare(
    `SELECT url FROM webhooks WHERE event = ? AND is_active = 1`,
  ).bind(event).all<{ url: string }>();

  const tasks = (rows.results ?? []).map((r) =>
    fetch(r.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload, ts: Date.now() }),
    }).catch((e) => console.error('[webhook] failed', r.url, e)),
  );
  await Promise.allSettled(tasks);
}
