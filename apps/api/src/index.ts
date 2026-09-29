import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { publicRoutes } from './routes/public';
import { adminRoutes } from './routes/admin';
import { siteRoutes } from './routes/site';
import type { Env } from './env';

const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());
app.use(
  '/api/*',
  cors({
    origin: (origin) => origin,
    credentials: true,
  }),
);

// 健康检查
app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));

// 业务路由
app.route('/api/public', publicRoutes);
app.route('/api/admin', adminRoutes);

// 官网 SSR 兜底（必须最后挂载）
app.route('/', siteRoutes);

export default app;
