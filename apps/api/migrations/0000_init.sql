-- 创建于 PRD v1.0 对齐

CREATE TABLE pages (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  meta_description TEXT,
  is_published  INTEGER DEFAULT 1,
  locale        TEXT DEFAULT 'zh-CN',
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_published ON pages(is_published);

CREATE TABLE page_blocks (
  id           TEXT PRIMARY KEY,
  page_id      TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  block_type   TEXT NOT NULL,
  sort_order   INTEGER DEFAULT 0,
  content_json TEXT NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX idx_blocks_page ON page_blocks(page_id, sort_order);

CREATE TABLE leads (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  company_name TEXT,
  source       TEXT NOT NULL,
  status       TEXT DEFAULT 'new',
  deal_value   REAL DEFAULT 0,
  assigned_to  TEXT,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_created ON leads(created_at);

CREATE TABLE lead_activities (
  id             TEXT PRIMARY KEY,
  lead_id        TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_by     TEXT NOT NULL,
  activity_type  TEXT NOT NULL,
  note           TEXT NOT NULL,
  next_follow_up INTEGER,
  created_at     INTEGER NOT NULL
);
CREATE INDEX idx_activities_lead ON lead_activities(lead_id, created_at);
CREATE INDEX idx_activities_next ON lead_activities(next_follow_up);

CREATE TABLE form_submissions (
  id           TEXT PRIMARY KEY,
  form_id      TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  ip_address   TEXT,
  user_agent   TEXT,
  created_at   INTEGER NOT NULL
);
CREATE INDEX idx_submissions_form ON form_submissions(form_id, created_at);
