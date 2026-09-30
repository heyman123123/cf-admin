/**
 * 官网 SSR：根据 slug 渲染 pages + page_blocks
 * 缓存策略：Cache API + 发布时主动失效；?preview=token 跳过缓存
 */
import { Hono } from 'hono';
import { renderToString } from 'hono/jsx/dom/server';
import type { Env } from '../env';
import { BlockRenderer } from '../pages/BlockRenderer';
import { GLOBAL_CSS, buildThemeCss } from '../pages/theme';
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

  // 全局 Header/Footer（site_layout），按页面开关拼装
  const showHeader = (page as any).show_header !== 0;
  const showFooter = (page as any).show_footer !== 0;
  const layoutRes = await c.env.DB.prepare(
    `SELECT id, blocks_json FROM site_layout WHERE id IN ('header','footer')`,
  ).all<{ id: string; blocks_json: string }>();
  const layoutMap = new Map<string, any[]>();
  for (const row of layoutRes.results ?? []) {
    try { layoutMap.set(row.id, JSON.parse(row.blocks_json)); } catch { layoutMap.set(row.id, []); }
  }

  const toBlock = (b: any) => ({
    id: '',
    pageId: '',
    // v4.0 修复：BlockRenderer 读取 block.block_type / block.content_json（snake_case）。
    // 此前误用 blockType/contentJson（camelCase）→ 全局 Header/Footer 分支不匹配、
    // 内容解析为空，导致线上/预览缺失页头页脚而画布正常（画布走前端本地渲染）。
    block_type: b.block_type,
    sortOrder: b.sort_order ?? 0,
    content_json: JSON.stringify(b.content_json ?? {}),
    updatedAt: 0,
  }) as unknown as PageBlock;

  const headerHtml = showHeader
    ? (layoutMap.get('header') ?? []).map((b: any) => renderToString(<BlockRenderer block={toBlock(b)} />)).join('')
    : '';
  const footerHtml = showFooter
    ? (layoutMap.get('footer') ?? []).map((b: any) => renderToString(<BlockRenderer block={toBlock(b)} />)).join('')
    : '';
  const bodyHtml = blocks.map((b: PageBlock) => renderToString(<BlockRenderer block={b} />)).join('');

  const body = headerHtml + bodyHtml + footerHtml;

  // 读取主题（KV），注入 CSS 变量
  let themeVars: Record<string, string> | null = null;
  try {
    const raw = await c.env.KV.get('theme:current');
    if (raw) themeVars = JSON.parse(raw) as Record<string, string>;
  } catch { /* 忽略主题读取错误 */ }

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(page.title)}</title>
<meta name="description" content="${escapeHtml(page.metaDescription ?? '')}" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta property="og:title" content="${escapeHtml(page.title)}" />
<meta property="og:description" content="${escapeHtml(page.metaDescription ?? '')}" />
<meta property="og:type" content="website" />
<link rel="sitemap" href="/sitemap.xml" />
<style>${GLOBAL_CSS}:root{${buildThemeCss(themeVars)}}</style>
</head>
<body>${body}</body>
</html>`;

  return { html, status: 200 };
}

/* -------- SEO 静态路由（必须在 /* 之前注册） -------- */

siteRoutes.get('/robots.txt', (c) => {
  return c.text('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n');
});

siteRoutes.get('/sitemap.xml', async (c) => {
  const pages = await c.env.DB.prepare(
    `SELECT slug, updated_at FROM pages WHERE is_published = 1`,
  ).all<{ slug: string; updated_at: number }>();
  const base = c.env.APP_URL ?? new URL(c.req.url).origin;
  const urls = (pages.results ?? [])
    .map((p) => `  <url><loc>${base}${p.slug}</loc><lastmod>${new Date(p.updated_at * 1000).toISOString()}</lastmod></url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  return c.text(xml, 200, { 'Content-Type': 'application/xml' });
});

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
      // v3.9：浏览器不缓存（max-age=0），CDN/边缘缓存 5 分钟（s-maxage=300）。
      // 发布接口会 purge 边缘缓存 → 发布后用户刷新立即看到新内容；边缘命中仍保持低 TTFB。
      'Cache-Control': isPreview ? 'no-store' : 'public, max-age=0, s-maxage=300',
      'X-Powered-By': 'Hono + Cloudflare Workers',
    },
  });

  if (!isPreview) {
    const cacheKey = new Request(c.req.url, c.req.raw);
    c.executionCtx.waitUntil(caches.default.put(cacheKey, resp.clone()));
  }
  return resp;
});