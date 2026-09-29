import type { Env } from '../env';

/** 写一条审计日志 */
export async function audit(
  env: Env,
  actor: string,
  action: string,
  targetType: string,
  targetId?: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, actor, action, target_type, target_id, detail_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        crypto.randomUUID(),
        actor,
        action,
        targetType,
        targetId ?? null,
        detail ? JSON.stringify(detail) : null,
        Math.floor(Date.now() / 1000),
      )
      .run();
  } catch (e) {
    console.error('[audit] failed', e);
  }
}
