/**
 * 官网 SSR：根据 slug 渲染 pages + page_blocks
 * 缓存策略：Cache API + 发布时主动失效；?preview=token 跳过缓存
 */
import { Hono } from 'hono';
import type { Env } from '../env';
import { BlockRenderer } from '../pages/BlockRenderer';
import type { Page, PageBlock } from '@cf-admin/db';

export const siteRoutes = new Hono<{ Bindings: Env }>();

async function renderPage(c: any, slug: string, preview: boolean): Promise<Response> {
  const page = (await c.env.DB.prepare(
    'SELECT * FROM pages WHERE slug = ? AND is_published = 1',
  )
    .bind(slug)
    .first<Page>()) as Page | null;

  if (!page) return c.notFound();

  const blocks = (await c.env.DB.prepare(
    'SELECT * FROM page_blocks WHERE page_id = ? ORDER BY sort_order ASC',
  )
    .bind(page.id)
    .all<PageBlock>()) as { results: PageBlock[] };

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(page.title)}</title>
<meta name="description" content="${escapeHtml(page.metaDescription ?? '')}" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111}</style>
</head>
<body>${blocks.results
  .map((b) => BlockRendererToString(b))
  .join('')}</body>
</html>`;

  return c.html(html, {
    headers: {
      'Cache-Control': preview ? 'no-store' : 'public, max-age=604800',
      'X-Powered-By': 'Hono + Cloudflare Workers',
    },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] as string));
}

/** SSR 时在 Worker 内把 JSX 渲染成字符串 */
function BlockRendererToString(b: PageBlock): string {
  // 简化：直接返回一个占位；实际项目中用 hono/react 的 renderToString
  // 这里通过 BlockRenderer 组件 + renderToString 统一渲染
  return `<div data-block="${b.blockType}">${JSON.stringify(b.contentJson)}</div>`;
}

siteRoutes.get('/*', async (c) => {
  const url = new URL(c.req.url);
  const slug = url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '');

  const previewToken = url.searchParams.get('preview');
  const isPreview = previewToken && previewToken === c.env.PREVIEW_TOKEN;

  if (!isPreview) {
    const cacheKey = new Request(c.req.url, c.req.raw);
    const cached = await caches.default.match(cacheKey);
    if (cached) return cached;
  }

  const resp = await renderPage(c, slug, !!isPreview);

  if (!isPreview && resp.status === 200) {
    const cacheKey = new Request(c.req.url, c.req.raw);
    c.executionCtx.waitUntil(caches.default.put(cacheKey, resp.clone()));
  }
  return resp;
});
