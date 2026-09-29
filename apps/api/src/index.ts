import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { publicRoutes } from './routes/public';
import { adminRoutes } from './routes/admin';
import { authRoutes } from './routes/auth';
import { activityRoutes } from './routes/activities';
import { mediaRoutes } from './routes/media';
import { statsRoutes } from './routes/stats';
import { miscRoutes } from './routes/misc';
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

app.route('/api/public', publicRoutes);
app.route('/api/admin/auth', authRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/admin/leads', activityRoutes);
app.route('/api/admin/media', mediaRoutes);
app.route('/api/admin/stats', statsRoutes);
app.route('/api/admin', miscRoutes);

// 官网 SSR + robots/sitemap
app.route('/', siteRoutes);

export default app;
