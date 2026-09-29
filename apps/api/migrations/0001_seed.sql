-- 演示数据：一条首页 + 三个 Block
-- 本地 / 远程执行迁移后自动插入

INSERT OR IGNORE INTO pages (id, slug, title, meta_description, is_published, locale, created_at, updated_at)
VALUES ('seed-home', '/', 'cf-admin · 动态官网 + CRM 一体化', '基于 Cloudflare 原生 Serverless 的官网与 CRM 系统', 1, 'zh-CN', strftime('%s','now'), strftime('%s','now'));

INSERT OR IGNORE INTO page_blocks (id, page_id, block_type, sort_order, content_json, updated_at)
VALUES
  ('seed-hero', 'seed-home', 'hero', 0,
   '{"title":"Cloudflare 原生动态官网 + CRM","subtitle":"单域部署、边缘毫秒分发、零运维数据库","cta":{"text":"预约 Demo","href":"/contact"}}',
   strftime('%s','now')),
  ('seed-features', 'seed-home', 'features', 1,
   '{"title":"为什么选我们","bullets":[{"title":"边缘 SSR","desc":"Cloudflare Workers 上 Hono JSX 渲染，TTFB < 100ms"},{"title":"Cache 主动失效","desc":"发布即清缓存，秒级生效"},{"title":"表单直通 CRM","desc":"Turnstile 防刷，新线索秒级入库并推送飞书"}]}',
   strftime('%s','now')),
  ('seed-pricing', 'seed-home', 'pricing_table', 2,
   '{"title":"定价","plans":[{"name":"Starter","price":"¥0","features":["1 个官网","100 条线索/月","社区支持"]},{"name":"Growth","price":"¥299/月","features":["无限页面","无限线索","飞书/企微通知"]},{"name":"Scale","price":"定制","features":["SSO / Access","RBAC","SLA"]}]}',
   strftime('%s','now'));
