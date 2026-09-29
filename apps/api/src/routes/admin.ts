import { Hono } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { leads, pages, pageBlocks } from '@cf-admin/db';
import { purgeUrl } from '../lib/cache';
import type { Env } from '../env';

export const adminRoutes = new Hono<{ Bindings: Env }>();

// TODO: 接入 Cloudflare Access 后，这里再做 JWT + RBAC 细粒度校验
// adminRoutes.use('*', async (c, next) => { ... });

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

  // 主动失效边缘缓存
  const url = new URL(page.slug, c.env.APP_URL).toString();
  await purgeUrl(url);

  return c.json({ success: true, purged: url });
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
  // 整页覆盖保存 blocks（后台拖拽排序后整体提交）
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

  // 保存后清缓存
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

adminRoutes.patch('/leads/:id', async (c) => {
  const body = await c.req.json<{ status?: string; assigned_to?: string }>();
  const db = drizzle(c.env.DB);
  await db
    .update(leads)
    .set({ ...body, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(leads.id, c.req.param('id')));
  return c.json({ success: true });
});
