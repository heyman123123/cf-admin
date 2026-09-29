/**
 * Pages Functions：同域 API 反向代理 + SPA fallback。
 * - /api/* → 转发到 Cloudflare Worker（同域，无跨域 preflight，不依赖用户网络直连 workers.dev）
 * - 其他路径 → 先尝试静态资源，未命中（前端路由）回退 index.html
 *
 * 部署：wrangler pages deploy dist 会自动编译 functions/ 目录。
 * 配置：环境变量 API_TARGET 指定 Worker 地址（默认 cf-admin-api.itwebmomo.workers.dev）。
 */
const DEFAULT_TARGET = 'https://cf-admin-api.itwebmomo.workers.dev';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 非 /api 路径：静态资源优先，前端路由回退 index.html
  if (!url.pathname.startsWith('/api/')) {
    const res = await env.ASSETS.fetch(request);
    if (res.status !== 404) return res;
    const indexRes = await env.ASSETS.fetch(new URL('/', request.url).toString());
    return new Response(indexRes.body, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // API 反向代理
  const targetBase = env.API_TARGET ?? DEFAULT_TARGET;
  const target = targetBase + url.pathname + url.search;

  const headers = new Headers(request.headers);
  headers.delete('host');

  let body = undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}
