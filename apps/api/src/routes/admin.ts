import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { leads, pages, pageBlocks } from '@cf-admin/db';
import { purgeUrl } from '../lib/cache';
import { authMiddleware } from '../lib/auth';
import type { Env, Variables } from '../env';

export const adminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// 所有 /api/admin/* 业务路由都需要登录（auth 子路径除外，已在别处挂载）
adminRoutes.use('*', authMiddleware);

/* ------------------------------ Pages ------------------------------ */

adminRoutes.get('/pages', async (c) => {
  const db = drizzle(c.env.DB);
  const all = await db.select().from(pages).orderBy(desc(pages.updatedAt));
  return c.json(all);
});

adminRoutes.post('/pages', async (c) => {
  const body = await c.req.json<{
    slug: string;
    title: string;
    meta_description?: string;
    is_published?: number;
  }>();
  const now = Math.floor(Date.now() / 1000);
  const id = crypto.randomUUID();
  await drizzle(c.env.DB)
    .insert(pages)
    .values({
      id,
      slug: body.slug,
      title: body.title,
      metaDescription: body.meta_description ?? null,
      isPublished: body.is_published ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  return c.json({ id });
});

adminRoutes.patch('/pages/:id/publish', async (c) => {
  const id = c.req.param('id');
  const db = drizzle(c.env.DB);
  const now = Math.floor(Date.now() / 1000);

  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) return c.json({ error: 'not found' }, 404);

  await db.update(pages).set({ isPublished: 1, updatedAt: now }).where(eq(pages.id, id));

  const url = new URL(page.slug, c.env.APP_URL).toString();
  await purgeUrl(url);

  return c.json({ success: true, purged: url });
});

adminRoutes.delete('/pages/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const [page] = await db.select().from(pages).where(eq(pages.id, c.req.param('id'))).limit(1);
  await db.delete(pages).where(eq(pages.id, c.req.param('id')));
  if (page) await purgeUrl(new URL(page.slug, c.env.APP_URL).toString());
  return c.json({ success: true });
});

/* ------------------------------ Blocks ------------------------------ */

adminRoutes.get('/pages/:id/blocks', async (c) => {
  const db = drizzle(c.env.DB);
  const blocks = await db
    .select()
    .from(pageBlocks)
    .where(eq(pageBlocks.pageId, c.req.param('id')));
  return c.json(blocks);
});

adminRoutes.put('/pages/:id/blocks', async (c) => {
  const blocks = await c.req.json<
    { block_type: string; sort_order: number; content_json: unknown }[]
  >();
  const pageId = c.req.param('id');
  const db = drizzle(c.env.DB);
  const now = Math.floor(Date.now() / 1000);

  await db.delete(pageBlocks).where(eq(pageBlocks.pageId, pageId));
  for (const b of blocks) {
    await db.insert(pageBlocks).values({
      id: crypto.randomUUID(),
      pageId,
      blockType: b.block_type,
      sortOrder: b.sort_order,
      contentJson: JSON.stringify(b.content_json),
      updatedAt: now,
    });
  }

  const [page] = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
  if (page) await purgeUrl(new URL(page.slug, c.env.APP_URL).toString());

  return c.json({ success: true, count: blocks.length });
});

/* ------------------------------ Leads ------------------------------ */

adminRoutes.get('/leads', async (c) => {
  const status = c.req.query('status');
  const db = drizzle(c.env.DB);
  const rows = await db
    .select()
    .from(leads)
    .where(status ? eq(leads.status, status) : undefined)
    .orderBy(desc(leads.createdAt));
  return c.json(rows);
});

adminRoutes.get('/leads/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const [lead] = await db.select().from(leads).where(eq(leads.id, c.req.param('id'))).limit(1);
  if (!lead) return c.json({ error: 'not found' }, 404);
  return c.json(lead);
});

adminRoutes.patch('/leads/:id', async (c) => {
  const body = await c.req.json<{
    status?: string;
    assigned_to?: string;
    name?: string;
    email?: string;
    phone?: string;
    company_name?: string;
    deal_value?: number;
  }>();
  const db = drizzle(c.env.DB);
  await db
    .update(leads)
    .set({ ...body, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(leads.id, c.req.param('id')));
  return c.json({ success: true });
});

adminRoutes.delete('/leads/:id', async (c) => {
  const db = drizzle(c.env.DB);
  await db.delete(leads).where(eq(leads.id, c.req.param('id')));
  return c.json({ success: true });
});
