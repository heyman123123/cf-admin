export type Env = {
  // D1 / R2 / KV bindings
  DB: D1Database;
  BUCKET: R2Bucket;
  KV: KVNamespace;

  // Secrets
  TURNSTILE_SECRET_KEY: string;
  JWT_SECRET: string;

  // 初始管理员（仅开发模式；生产请前置 Cloudflare Access）
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;

  // Vars
  APP_URL: string;
  PREVIEW_TOKEN: string;
  R2_PUBLIC_URL: string; // e.g. https://assets.example.com

  // Optional webhooks
  LARK_WEBHOOK_URL?: string;
  WECOM_WEBHOOK_URL?: string;
};

export type Variables = {
  user?: { username: string };
};
