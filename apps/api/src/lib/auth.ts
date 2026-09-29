import { sign, verify } from 'hono/jwt';
import type { Context } from 'hono';
import type { Env, Variables } from '../env';

const EXPIRE_SEC = 7 * 24 * 3600;

export function createToken(env: Env, username: string): Promise<string> {
  return sign({ sub: username, exp: Math.floor(Date.now() / 1000) + EXPIRE_SEC }, env.JWT_SECRET);
}

export async function authMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: () => Promise<void>) {
  if (c.req.method === 'OPTIONS') return await next();

  // 优先 Bearer 头（跨站场景）
  const authHeader = c.req.header('Authorization') ?? '';
  let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  // 回退 Cookie
  if (!token) {
    const cookie = c.req.header('Cookie') ?? '';
    token = cookie
      .split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith('cf_admin_token='))
      ?.split('=')[1];
  }

  if (!token) return c.json({ error: 'unauthorized' }, 401);

  try {
    const payload = (await verify(token, c.env.JWT_SECRET, 'HS256')) as { sub: string };
    c.set('user', { username: payload.sub });
  } catch (e) {
    console.log('[auth] invalid token', e);
    return c.json({ error: 'invalid token' }, 401);
  }
  await next();
}

export function setAuthCookie(c: Context<{ Bindings: Env }>, token: string) {
  c.header('Set-Cookie', `cf_admin_token=${token}; HttpOnly; Secure; Path=/; Max-Age=${EXPIRE_SEC}; SameSite=None`);
}

export function clearAuthCookie(c: Context) {
  c.header('Set-Cookie', 'cf_admin_token=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=None');
}
