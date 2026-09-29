/**
 * 新线索异步通知（飞书 / 企业微信 Webhook）
 * 使用 context.waitUntil() 调用，不阻塞 HTTP 响应。
 */
import type { Lead } from '@cf-admin/db';

interface NotifyEnv {
  LARK_WEBHOOK_URL?: string;
  WECOM_WEBHOOK_URL?: string;
}

export async function notifyNewLead(lead: Lead, env: NotifyEnv): Promise<void> {
  const text = [
    `【新线索】${lead.name}`,
    `公司：${lead.companyName ?? '-'}`,
    `邮箱：${lead.email}`,
    `电话：${lead.phone ?? '-'}`,
    `来源：${lead.source}`,
  ].join('\n');

  const tasks: Promise<unknown>[] = [];

  if (env.LARK_WEBHOOK_URL) {
    tasks.push(
      fetch(env.LARK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg_type: 'text', content: { text } }),
      }).catch((err) => console.error('[lark webhook]', err)),
    );
  }

  if (env.WECOM_WEBHOOK_URL) {
    tasks.push(
      fetch(env.WECOM_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msgtype: 'text', text: { content: text } }),
      }).catch((err) => console.error('[wecom webhook]', err)),
    );
  }

  await Promise.allSettled(tasks);
}
