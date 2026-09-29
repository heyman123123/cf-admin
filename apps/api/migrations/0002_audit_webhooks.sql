-- 审计日志
CREATE TABLE audit_logs (
  id          TEXT PRIMARY KEY,
  actor       TEXT NOT NULL,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   TEXT,
  detail_json TEXT,
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_audit_actor ON audit_logs(actor, created_at);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id);

-- 出站 Webhook 配置
CREATE TABLE webhooks (
  id          TEXT PRIMARY KEY,
  url         TEXT NOT NULL,
  event       TEXT NOT NULL,
  is_active   INTEGER DEFAULT 1,
  created_at  INTEGER NOT NULL
);
