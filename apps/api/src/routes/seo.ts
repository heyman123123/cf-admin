import { Hono } from 'hono';
import type { Env } from '../env';

/** 公开 SEO 路由：/robots.txt /sitemap.xml */
export const seoRoutes = new Hono<{ Bindings: Env }>();

seoRoutes.get('/robots.txt', (c) => {
  return c.text('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n');
});

seoRoutes.get('/sitemap.xml', async (c) => {
  const pages = await c.env.DB.prepare(
    `SELECT slug, updated_at FROM pages WHERE is_published = 1`,
  ).all<{ slug: string; updated_at: number }>();
  const base = c.env.APP_URL ?? new URL(c.req.url).origin;
  const urls = (pages.results ?? [])
    .map((p) => `  <url><loc>${base}${p.slug}</loc><lastmod>${new Date(p.updated_at * 1000).toISOString()}</lastmod></url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  return c.text(xml, 200, { 'Content-Type': 'application/xml' });
});
