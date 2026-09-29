-- 邮件服务（v3 · MoeMail 对齐）：邮箱账号 / 消息 / 分享 / API Key

CREATE TABLE email_accounts (
  id         TEXT PRIMARY KEY,
  address    TEXT NOT NULL UNIQUE,          -- 完整邮箱地址 xxx@domain
  domain     TEXT NOT NULL,
  expires_at INTEGER,                       -- NULL = 永久；否则为过期时间戳
  role       TEXT DEFAULT 'knight',         -- emperor / duke / knight / peasant
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_email_accounts_domain ON email_accounts(domain);
CREATE INDEX idx_email_accounts_expires ON email_accounts(expires_at);

CREATE TABLE email_messages (
  id          TEXT PRIMARY KEY,
  account_id  TEXT NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  mailbox     TEXT NOT NULL,                -- inbox / sent
  subject     TEXT,
  from_addr   TEXT,
  to_addr     TEXT,
  body_text   TEXT,
  body_html   TEXT,
  read_at     INTEGER,
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_email_messages_account ON email_messages(account_id, created_at);
CREATE INDEX idx_email_messages_mailbox ON email_messages(account_id, mailbox, created_at);

CREATE TABLE email_shares (
  id         TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_email_shares_token ON email_shares(token);

CREATE TABLE email_api_keys (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  key_hash   TEXT NOT NULL UNIQUE,          -- sha256 摘要，不存明文
  role       TEXT DEFAULT 'knight',
  created_at INTEGER NOT NULL
);
