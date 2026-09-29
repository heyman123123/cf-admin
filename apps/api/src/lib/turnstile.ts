/**
 * 校验 Cloudflare Turnstile Token
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export async function verifyTurnstile(
  secret: string,
  token: string | undefined,
  remoteIp?: string,
): Promise<boolean> {
  if (!token) return false;
  if (!secret) {
    // 本地开发未配置 secret 时放行（生产必须配置）
    return true;
  }
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (remoteIp) form.append('remoteip', remoteIp);

  const resp = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body: form },
  );
  const data = (await resp.json()) as { success: boolean };
  return data.success === true;
}
