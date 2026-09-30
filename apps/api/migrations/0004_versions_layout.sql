-- v3.5: 页面版本历史 + 全局 Header/Footer 布局 + 页面显隐开关

-- 页面版本历史（draft=草稿快照，published=已发布快照）
CREATE TABLE IF NOT EXISTS page_versions (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',   -- draft | published
  blocks_json TEXT NOT NULL,
  created_by TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pv_page ON page_versions(page_id, version DESC);

-- 页面级页头/页脚显隐开关（默认显示）
ALTER TABLE pages ADD COLUMN show_header INTEGER NOT NULL DEFAULT 1;
ALTER TABLE pages ADD COLUMN show_footer INTEGER NOT NULL DEFAULT 1;

-- 全局布局（id='header' | 'footer'）
CREATE TABLE IF NOT EXISTS site_layout (
  id TEXT PRIMARY KEY,
  blocks_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO site_layout (id, blocks_json, updated_at) VALUES
  ('header', '[]', 0),
  ('footer', '[]', 0);
