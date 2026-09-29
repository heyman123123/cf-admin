import { sign, verify } from 'hono/jwt';
import type { Context } from 'hono';
import type { Env, Variables } from '../env';

const EXPIRE_SEC = 7 * 24 * 3600; // 7 天

export function createToken(env: Env, username: string): Promise<string> {
  return sign({ sub: username, exp: Math.floor(Date.now() / 1000) + EXPIRE_SEC }, env.JWT_SECRET);
}

/** 从 HTTP-Only Cookie 读取 JWT，验证后挂到 c.set('user', ...) */
export async function authMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: () => Promise<void>) {
  const cookie = c.req.header('Cookie') ?? '';
  const token = cookie
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('cf_admin_token='))
    ?.split('=')[1];

  if (!token) return c.json({ error: 'unauthorized' }, 401);

  try {
    const payload = (await verify(token, c.env.JWT_SECRET)) as { sub: string };
    c.set('user', { username: payload.sub });
  } catch {
    return c.json({ error: 'invalid token' }, 401);
  }
  await next();
}

export function setAuthCookie(c: Context<{ Bindings: Env }>, token: string) {
  c.header(
    'Set-Cookie',
    `cf_admin_token=${token}; HttpOnly; Secure; Path=/; Max-Age=${EXPIRE_SEC}; SameSite=Lax`,
  );
}

export function clearAuthCookie(c: Context) {
  c.header('Set-Cookie', 'cf_admin_token=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Lax');
}
