import { Hono } from 'hono';
import type { Env, Variables } from '../env';
import { createToken, authMiddleware, setAuthCookie, clearAuthCookie } from '../lib/auth';

export const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

authRoutes.post('/login', async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>();
  if (body.username !== c.env.ADMIN_USERNAME || body.password !== c.env.ADMIN_PASSWORD) {
    return c.json({ error: '用户名或密码错误' }, 401);
  }
  const token = await createToken(c.env, body.username!);
  setAuthCookie(c, token);
  return c.json({ success: true, username: body.username });
});

authRoutes.post('/logout', (c) => {
  clearAuthCookie(c);
  return c.json({ success: true });
});

authRoutes.get('/me', authMiddleware, (c) => {
  return c.json({ user: c.get('user') });
});
