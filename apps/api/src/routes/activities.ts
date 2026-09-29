import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { leadActivities, leads } from '@cf-admin/db';
import type { Env, Variables } from '../env';
import { authMiddleware } from '../lib/auth';

export const activityRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
activityRoutes.use('*', authMiddleware);

/** 某条线索的跟进时间线 */
activityRoutes.get('/:leadId/activities', async (c) => {
  const db = drizzle(c.env.DB);
  const rows = await db
    .select()
    .from(leadActivities)
    .where(eq(leadActivities.leadId, c.req.param('leadId')))
    .orderBy(desc(leadActivities.createdAt));
  return c.json(rows);
});

/** 新增跟进记录 */
activityRoutes.post('/:leadId/activities', async (c) => {
  const body = await c.req.json<{
    activity_type: 'call' | 'email' | 'meeting' | 'note';
    note: string;
    next_follow_up?: number;
  }>();
  const db = drizzle(c.env.DB);
  const now = Math.floor(Date.now() / 1000);
  const user = c.get('user')!;

  await db.insert(leadActivities).values({
    id: crypto.randomUUID(),
    leadId: c.req.param('leadId'),
    createdBy: user.username,
    activityType: body.activity_type,
    note: body.note,
    nextFollowUp: body.next_follow_up ?? null,
    createdAt: now,
  });

  // 同时把线索状态推进到 contacting
  await db.update(leads).set({ status: 'contacting', updatedAt: now }).where(eq(leads.id, c.req.param('leadId')));

  return c.json({ success: true });
});
