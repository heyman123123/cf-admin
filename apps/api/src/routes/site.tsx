/**
 * 官网 SSR：根据 slug 渲染 pages + page_blocks
 * 缓存策略：Cache API + 发布时主动失效；?preview=token 跳过缓存
 */
import { Hono } from 'hono';
import { renderToString } from 'hono/jsx/streaming';
import type { Env } from '../env';
import { BlockRenderer } from '../pages/BlockRenderer';
import type { Page, PageBlock } from '@cf-admin/db';

export const siteRoutes = new Hono<{ Bindings: Env }>();

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (ch) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] as string,
  );
}

async function buildHtml(c: any, slug: string): Promise<{ html: string; status: number }> {
  const page = (await c.env.DB.prepare(
    'SELECT * FROM pages WHERE slug = ? AND is_published = 1',
  )
    .bind(slug)
    .first<Page>()) as Page | null;

  if (!page) return { html: 'not found', status: 404 };

  const blocksRes = await c.env.DB.prepare(
    'SELECT * FROM page_blocks WHERE page_id = ? ORDER BY sort_order ASC',
  )
    .bind(page.id)
    .all<PageBlock>();
  const blocks = blocksRes.results ?? [];

  const body = blocks.map((b) => renderToString(<BlockRenderer block={b} />)).join('');

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(page.title)}</title>
<meta name="description" content="${escapeHtml(page.metaDescription ?? '')}" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;line-height:1.6}</style>
</head>
<body>${body}</body>
</html>`;

  return { html, status: 200 };
}

siteRoutes.get('/*', async (c) => {
  const url = new URL(c.req.url);
  const slug = url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '');

  const previewToken = url.searchParams.get('preview');
  const isPreview = !!previewToken && previewToken === c.env.PREVIEW_TOKEN;

  if (!isPreview) {
    const cacheKey = new Request(c.req.url, c.req.raw);
    const cached = await caches.default.match(cacheKey);
    if (cached) return cached;
  }

  const { html, status } = await buildHtml(c, slug);
  if (status === 404) return c.notFound();

  const resp = c.html(html, {
    headers: {
      'Cache-Control': isPreview ? 'no-store' : 'public, max-age=604800',
      'X-Powered-By': 'Hono + Cloudflare Workers',
    },
  });

  if (!isPreview) {
    const cacheKey = new Request(c.req.url, c.req.raw);
    c.executionCtx.waitUntil(caches.default.put(cacheKey, resp.clone()));
  }
  return resp;
});
