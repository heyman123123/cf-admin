export type Env = {
  // D1 / R2 / KV bindings
  DB: D1Database;
  MAIL_DB?: D1Database;
  BUCKET?: R2Bucket; // R2 待启用后再挂载
  KV: KVNamespace;

  // Secrets
  TURNSTILE_SECRET_KEY?: string;
  JWT_SECRET: string;

  // 初始管理员（仅开发模式；生产请前置 Cloudflare Access）
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;

  // Vars
  APP_URL?: string;
  PREVIEW_TOKEN: string;
  R2_PUBLIC_URL?: string;

  // 邮件服务（v3 · MoeMail 对齐）
  MAIL_DOMAINS?: string;            // 逗号分隔的允许域名
  MAIL_INCOMING_SECRET?: string;    // Email Routing 回调校验
  RESEND_API_KEY?: string;          // 发件（Resend）
  RESEND_FROM?: string;             // 发件人地址

  // Optional webhooks
  LARK_WEBHOOK_URL?: string;
  WECOM_WEBHOOK_URL?: string;
};

export type Variables = {
  user?: { username: string };
};
