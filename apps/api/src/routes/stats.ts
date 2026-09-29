import { Hono } from 'hono';
import type { Env, Variables } from '../env';
import { authMiddleware } from '../lib/auth';

export const statsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
statsRoutes.use('*', authMiddleware);

/** 看板首页聚合数据 */
statsRoutes.get('/overview', async (c) => {
  const totalRow = await c.env.DB.prepare('SELECT COUNT(*) AS c FROM leads').first<{ c: number }>();
  const byStatus = await c.env.DB.prepare(
    `SELECT status, COUNT(*) AS c FROM leads GROUP BY status`,
  ).all<{ status: string; c: number }>();
  const new30 = await c.env.DB.prepare(
    `SELECT COUNT(*) AS c FROM leads WHERE created_at >= ?`,
  ).bind(Math.floor(Date.now() / 1000) - 30 * 86400).first<{ c: number }>();

  return c.json({
    total: totalRow?.c ?? 0,
    new_last_30d: new30?.c ?? 0,
    by_status: byStatus.results ?? [],
  });
});
