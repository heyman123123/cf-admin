-- 第二套演示模板：SaaS 产品页
INSERT OR IGNORE INTO pages (id, slug, title, meta_description, is_published, locale, created_at, updated_at)
VALUES ('seed-saas', '/saas', 'Acme SaaS — 让团队协作更简单', '面向中小团队的协作工具', 1, 'zh-CN', strftime('%s','now'), strftime('%s','now'));

INSERT OR IGNORE INTO page_blocks (id, page_id, block_type, sort_order, content_json, updated_at)
VALUES
  ('seed-saas-hero', 'seed-saas', 'hero', 0,
   '{"title":"一个工具搞定团队协作","subtitle":"任务、文档、聊天，全在一个地方","cta":{"text":"免费开始","href":"/contact"}}',
   strftime('%s','now')),
  ('seed-saas-features', 'seed-saas', 'features', 1,
   '{"title":"为什么选 Acme","bullets":[{"title":"实时协作","desc":"多人同时编辑，毫秒同步"},{"title":"权限精细","desc":"部门/项目/文件三级权限"},{"title":"开箱即用","desc":"5 分钟接入，无需培训"}]}',
   strftime('%s','now'));
