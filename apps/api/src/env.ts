export type Env = {
  // D1 / R2 / KV bindings
  DB: D1Database;
  BUCKET: R2Bucket;
  KV: KVNamespace;

  // Secrets
  TURNSTILE_SECRET_KEY: string;
  JWT_SECRET: string;

  // Vars
  APP_URL: string;
  PREVIEW_TOKEN: string;

  // Optional webhooks
  LARK_WEBHOOK_URL?: string;
  WECOM_WEBHOOK_URL?: string;
};

export type Variables = {
  // 后续鉴权：c.set('user', {...})
};
