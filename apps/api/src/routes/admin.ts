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
  const out = [];
  for (const p of all) {
    const v = await c.env.DB.prepare(
      `SELECT COALESCE(MAX(version),0) AS m,
              COALESCE(SUM(CASE WHEN status='published' THEN 1 ELSE 0 END),0) AS pc,
              MAX(CASE WHEN status='published' THEN created_at END) AS pa,
              COALESCE(MAX(CASE WHEN status='draft' THEN created_at END),0) AS da
       FROM page_versions WHERE page_id = ?`,
    ).bind(p.id).first<{ m: number; pc: number; pa: number | null; da: number }>();
    const sh = await c.env.DB.prepare(`SELECT show_header, show_footer FROM pages WHERE id = ?`).bind(p.id).first<{ show_header: number; show_footer: number }>();
    out.push({
      ...p,
      showHeader: sh?.show_header ?? 1,
      showFooter: sh?.show_footer ?? 1,
      versionCount: v?.m ?? 0,
      publishedCount: v?.pc ?? 0,
      publishedAt: v?.pa ?? null,
      draftAt: v?.da ?? null,
    });
  }
  return c.json(out);
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

adminRoutes.patch('/pages/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    slug?: string;
    title?: string;
    meta_description?: string;
    is_published?: number;
    show_header?: number;
    show_footer?: number;
  }>();
  const db = drizzle(c.env.DB);

  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) return c.json({ error: 'not found' }, 404);

  // slug 冲突检测
  if (body.slug && body.slug !== page.slug) {
    const [dup] = await db.select().from(pages).where(eq(pages.slug, body.slug)).limit(1);
    if (dup) return c.json({ error: `slug 已被页面 ${dup.title} 占用` }, 409);
  }

  const now = Math.floor(Date.now() / 1000);
  // 剔除开关字段，drizzle 只更新已知列
  const { show_header, show_footer, ...rest } = body;
  await db.update(pages).set({ ...rest, updatedAt: now }).where(eq(pages.id, id));
  if (show_header !== undefined || show_footer !== undefined) {
    await c.env.DB.prepare(
      `UPDATE pages SET show_header = COALESCE(?, show_header), show_footer = COALESCE(?, show_footer), updated_at = ? WHERE id = ?`,
    ).bind(show_header ?? null, show_footer ?? null, now, id).run();
  }

  const base = c.env.APP_URL ?? new URL(c.req.url).origin;
  await purgeUrl(new URL(page.slug, base).toString());
  if (body.slug) await purgeUrl(new URL(body.slug, base).toString());

  return c.json({ success: true });
});

adminRoutes.patch('/pages/:id/publish', async (c) => {
  const id = c.req.param('id');
  const db = drizzle(c.env.DB);
  const now = Math.floor(Date.now() / 1000);

  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) return c.json({ error: 'not found' }, 404);

  await db.update(pages).set({ isPublished: 1, updatedAt: now }).where(eq(pages.id, id));

  // 快照当前 page_blocks 为 published 版本
  const maxRow = await c.env.DB.prepare(
    `SELECT COALESCE(MAX(version),0) AS m FROM page_versions WHERE page_id = ?`,
  ).bind(id).first<{ m: number }>();
  const blocksRes = await c.env.DB.prepare(
    `SELECT block_type, sort_order, content_json FROM page_blocks WHERE page_id = ? ORDER BY sort_order ASC`,
  ).bind(id).all();
  const snapshot = (blocksRes.results ?? []).map((b) => ({
    block_type: b.block_type,
    sort_order: b.sort_order,
    content_json: JSON.parse(b.content_json),
  }));
  await c.env.DB.prepare(
    `INSERT INTO page_versions (id, page_id, version, status, blocks_json, created_by, created_at) VALUES (?, ?, ?, 'published', ?, ?, ?)`,
  )
    .bind(crypto.randomUUID(), id, (maxRow?.m ?? 0) + 1, JSON.stringify(snapshot), c.get('user')?.username ?? null, now)
    .run();

  const base = c.env.APP_URL ?? new URL(c.req.url).origin;
  const url = new URL(page.slug, base).toString();
  await purgeUrl(url);

  return c.json({ success: true, purged: url, version: (maxRow?.m ?? 0) + 1 });
});

/* ------------------------------ 实时预览 URL ------------------------------ */

adminRoutes.get('/preview-url', async (c) => {
  const slug = c.req.query('slug') ?? '/';
  const base = c.env.APP_URL ?? new URL(c.req.url).origin;
  const path = slug.startsWith('/') ? slug : `/${slug}`;
  const url = `${base.replace(/\/$/, '')}${path}?preview=${c.env.PREVIEW_TOKEN}`;
  return c.json({ url });
});

adminRoutes.delete('/pages/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const [page] = await db.select().from(pages).where(eq(pages.id, c.req.param('id'))).limit(1);
  await db.delete(pages).where(eq(pages.id, c.req.param('id')));
  if (page) {
    const base = c.env.APP_URL ?? new URL(c.req.url).origin;
    await purgeUrl(new URL(page.slug, base).toString());
  }
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

  // 草稿版本快照（供历史回滚）：最近一条已是草稿则原地更新（不重复创建）；最近是已发布/无版本才新建
  const latestRow = await c.env.DB.prepare(
    `SELECT id, status, version FROM page_versions WHERE page_id = ? ORDER BY version DESC LIMIT 1`,
  ).bind(pageId).first<{ id: string; status: string; version: number }>();
  let version = 0;
  if (latestRow?.status === 'draft') {
    await c.env.DB.prepare(
      `UPDATE page_versions SET blocks_json = ?, created_at = ?, created_by = ? WHERE id = ?`,
    ).bind(JSON.stringify(blocks), now, c.get('user')?.username ?? null, latestRow.id).run();
    version = latestRow.version;
  } else {
    const maxRow = await c.env.DB.prepare(
      `SELECT COALESCE(MAX(version),0) AS m FROM page_versions WHERE page_id = ?`,
    ).bind(pageId).first<{ m: number }>();
    version = (maxRow?.m ?? 0) + 1;
    await c.env.DB.prepare(
      `INSERT INTO page_versions (id, page_id, version, status, blocks_json, created_by, created_at) VALUES (?, ?, ?, 'draft', ?, ?, ?)`,
    )
      .bind(crypto.randomUUID(), pageId, version, JSON.stringify(blocks), c.get('user')?.username ?? null, now)
      .run();
  }

  const [page] = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
  if (page) {
    const base = c.env.APP_URL ?? new URL(c.req.url).origin;
    await purgeUrl(new URL(page.slug, base).toString());
  }

  return c.json({ success: true, count: blocks.length, version });
});

/* ------------------------------ 页面版本历史 ------------------------------ */

adminRoutes.get('/pages/:id/versions', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT id, version, status, created_by, created_at FROM page_versions
     WHERE page_id = ? ORDER BY version DESC LIMIT 100`,
  ).bind(c.req.param('id')).all();
  return c.json(rows.results ?? []);
});

/** 将历史版本恢复为当前草稿（不发布） */
adminRoutes.post('/pages/:id/versions/:vid/restore', async (c) => {
  const pageId = c.req.param('id');
  const vid = c.req.param('vid');
  const row = await c.env.DB.prepare(
    `SELECT blocks_json, version FROM page_versions WHERE id = ? AND page_id = ?`,
  ).bind(vid, pageId).first<{ blocks_json: string; version: number }>();
  if (!row) return c.json({ error: 'not found' }, 404);

  let parsed: { block_type: string; sort_order?: number; content_json?: unknown }[] = [];
  try { parsed = JSON.parse(row.blocks_json); } catch { return c.json({ error: 'bad snapshot' }, 500); }

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(`DELETE FROM page_blocks WHERE page_id = ?`).bind(pageId).run();
  for (const b of parsed) {
    await c.env.DB.prepare(
      `INSERT INTO page_blocks (id, page_id, block_type, sort_order, content_json, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(crypto.randomUUID(), pageId, b.block_type, b.sort_order ?? 0, JSON.stringify(b.content_json ?? {}), now)
      .run();
  }
  // 恢复后落草稿版本：最近已是草稿则原地更新，否则新建（避免重复草稿行）
  const latestRow = await c.env.DB.prepare(
    `SELECT id, status FROM page_versions WHERE page_id = ? ORDER BY version DESC LIMIT 1`,
  ).bind(pageId).first<{ id: string; status: string }>();
  if (latestRow?.status === 'draft') {
    await c.env.DB.prepare(
      `UPDATE page_versions SET blocks_json = ?, created_at = ?, created_by = ? WHERE id = ?`,
    ).bind(JSON.stringify(parsed), now, c.get('user')?.username ?? null, latestRow.id).run();
  } else {
    const maxRow = await c.env.DB.prepare(
      `SELECT COALESCE(MAX(version),0) AS m FROM page_versions WHERE page_id = ?`,
    ).bind(pageId).first<{ m: number }>();
    await c.env.DB.prepare(
      `INSERT INTO page_versions (id, page_id, version, status, blocks_json, created_by, created_at) VALUES (?, ?, ?, 'draft', ?, ?, ?)`,
    )
      .bind(crypto.randomUUID(), pageId, (maxRow?.m ?? 0) + 1, JSON.stringify(parsed), c.get('user')?.username ?? null, now)
      .run();
  }

  const [page] = await drizzle(c.env.DB).select().from(pages).where(eq(pages.id, pageId)).limit(1);
  if (page) {
    const base = c.env.APP_URL ?? new URL(c.req.url).origin;
    await purgeUrl(new URL(page.slug, base).toString());
  }

  return c.json({ success: true, version: row.version });
});

/* ------------------------------ 全局 Header/Footer 布局 ------------------------------ */

adminRoutes.get('/layout/:part', async (c) => {
  const part = c.req.param('part');
  if (part !== 'header' && part !== 'footer') return c.json({ error: 'invalid part' }, 400);
  const row = await c.env.DB.prepare(`SELECT blocks_json FROM site_layout WHERE id = ?`).bind(part).first<{ blocks_json: string }>();
  let blocks: unknown[] = [];
  if (row) { try { blocks = JSON.parse(row.blocks_json); } catch { /* ignore */ } }
  return c.json({ part, blocks, updatedAt: 0 });
});

adminRoutes.put('/layout/:part', async (c) => {
  const part = c.req.param('part');
  if (part !== 'header' && part !== 'footer') return c.json({ error: 'invalid part' }, 400);
  const body = await c.req.json<{ blocks: unknown[] }>();
  await c.env.DB.prepare(`UPDATE site_layout SET blocks_json = ?, updated_at = ? WHERE id = ?`)
    .bind(JSON.stringify(body.blocks ?? []), Math.floor(Date.now() / 1000), part)
    .run();
  return c.json({ success: true, count: (body.blocks ?? []).length });
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