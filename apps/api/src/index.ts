import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { publicRoutes } from './routes/public';
import { adminRoutes } from './routes/admin';
import { authRoutes } from './routes/auth';
import { activityRoutes } from './routes/activities';
import { mediaRoutes } from './routes/media';
import { statsRoutes } from './routes/stats';
import { siteRoutes } from './routes/site';
import type { Env, Variables } from './env';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use('*', logger());
app.use(
  '/api/*',
  cors({
    origin: (o) => o,
    credentials: true,
  }),
);

app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));

// 公开
app.route('/api/public', publicRoutes);

// 登录态（不挂在 adminRoutes 下，因为它内部强制 authMiddleware）
app.route('/api/admin/auth', authRoutes);

// 受保护业务
app.route('/api/admin', adminRoutes);
app.route('/api/admin/leads', activityRoutes); // /:leadId/activities
app.route('/api/admin/media', mediaRoutes);
app.route('/api/admin/stats', statsRoutes);

// 官网 SSR 兜底
app.route('/', siteRoutes);

export default app;
