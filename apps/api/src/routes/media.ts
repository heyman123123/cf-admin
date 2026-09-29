import { Hono } from 'hono';
import type { Env, Variables } from '../env';
import { authMiddleware } from '../lib/auth';

export const mediaRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
mediaRoutes.use('*', authMiddleware);

/** 上传文件到 R2；返回公开 URL */
mediaRoutes.post('/upload', async (c) => {
  const form = await c.req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return c.json({ error: 'file 字段缺失' }, 400);

  const ext = file.name.split('.').pop();
  const key = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  await c.env.BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const url = `${c.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  return c.json({ key, url, size: file.size });
});

/** 列出最近上传 */
mediaRoutes.get('/list', async (c) => {
  const listed = await c.env.BUCKET.list({ limit: 50 });
  const objects = listed.objects.map((o) => ({
    key: o.key,
    size: o.size,
    uploaded: o.uploaded.toISOString(),
    url: `${c.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${o.key}`,
  }));
  return c.json(objects);
});
