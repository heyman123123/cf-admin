/**
 * 全局样式（商业化版本）
 * 设计原则：CSS 变量 + 层次化阴影 + 渐变 + 精细排版，全站响应式。
 */
export const GLOBAL_CSS = `
:root {
  --c-primary: #2563eb;
  --c-primary-hover: #1d4ed8;
  --c-accent: #7c3aed;
  --c-bg: #ffffff;
  --c-bg-soft: #f8fafc;
  --c-text: #0f172a;
  --c-text-muted: #64748b;
  --c-border: #e2e8f0;
  --c-radius: 16px;
  --c-shadow-sm: 0 1px 2px rgba(15,23,42,.05);
  --c-shadow: 0 4px 12px rgba(15,23,42,.06), 0 12px 32px rgba(15,23,42,.08);
  --c-shadow-lg: 0 8px 24px rgba(15,23,42,.10), 0 24px 64px rgba(15,23,42,.12);
  --c-container: 1200px;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
html, body { margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  color: var(--c-text);
  background: var(--c-bg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
img { max-width: 100%; height: auto; display: block; }
a { color: var(--c-primary); text-decoration: none; }
a:hover { text-decoration: none; }

.container { max-width: var(--c-container); margin: 0 auto; padding: 0 24px; }
.section { padding: 96px 0; }
.section--soft { background: var(--c-bg-soft); }
.section--dark { background: #0b1220; color: #fff; position: relative; overflow: hidden; }
.section--dark::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(600px 300px at 10% 0%, rgba(37,99,235,.15), transparent 60%),
    radial-gradient(600px 300px at 90% 100%, rgba(124,58,237,.12), transparent 60%);
  pointer-events: none;
}
.section--dark > * { position: relative; z-index: 1; }
.section--dark .muted { color: #94a3b8; }

.eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
  color: var(--c-primary); background: rgba(37,99,235,.08);
  padding: 6px 14px; border-radius: 999px; margin-bottom: 20px;
}
.section--dark .eyebrow { background: rgba(37,99,235,.2); color: #93c5fd; }

.h1 { font-size: clamp(40px, 7vw, 72px); line-height: 1.05; font-weight: 800; margin: 0 0 24px; letter-spacing: -0.03em; }
.h2 { font-size: clamp(30px, 4.5vw, 46px); line-height: 1.15; font-weight: 800; margin: 0 0 16px; letter-spacing: -0.02em; }
.lead { font-size: clamp(16px, 2vw, 20px); color: var(--c-text-muted); margin: 0 0 36px; line-height: 1.7; }
.section--dark .lead { color: #94a3b8; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;
  transition: all .2s; cursor: pointer; border: none; line-height: 1;
}
.btn--primary {
  background: linear-gradient(135deg, var(--c-primary), var(--c-accent));
  color: #fff; box-shadow: 0 4px 16px rgba(37,99,235,.35);
}
.btn--primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,.45); }
.btn--ghost { background: transparent; color: inherit; border: 1.5px solid var(--c-border); }
.btn--ghost:hover { border-color: var(--c-primary); color: var(--c-primary); }
.section--dark .btn--ghost { border-color: #334155; color: #e2e8f0; }
.section--dark .btn--ghost:hover { border-color: var(--c-primary); color: #93c5fd; }
.btn--lg { padding: 16px 40px; font-size: 18px; }
.btn--white { background: #fff; color: var(--c-primary); }
.btn--white:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,255,255,.3); }
.btn-row { display: flex; gap: 16px; flex-wrap: wrap; }

.grid { display: grid; gap: 28px; }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 900px) {
  .grid-3, .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .section { padding: 64px 0; }
}
@media (max-width: 640px) {
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
  .section { padding: 48px 0; }
  .btn-row { flex-direction: column; }
  .btn-row .btn { width: 100%; }
}

.hero { padding: 140px 0 120px; position: relative; overflow: hidden; }
.hero--gradient {
  background:
    radial-gradient(800px 400px at 20% 0%, rgba(37,99,235,.12), transparent 60%),
    radial-gradient(700px 400px at 80% 10%, rgba(124,58,237,.10), transparent 60%),
    linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}
.hero--dark { background: #0b1220; color: #fff; }
.hero--dark .lead { color: #94a3b8; }
.hero--light { background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%); }
.hero--center { text-align: center; }
.hero--center .lead { margin-left: auto; margin-right: auto; max-width: 680px; }
.hero--center .btn-row { justify-content: center; }
.hero--left .lead { max-width: 560px; }
.hero-img { margin-top: 48px; border-radius: 20px; box-shadow: var(--c-shadow-lg); border: 1px solid var(--c-border); }
.hero--dark .hero-img { border-color: #1e293b; }
.hero-grad-text {
  background: linear-gradient(120deg, var(--c-primary), var(--c-accent));
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
@media (max-width: 640px) { .hero { padding: 72px 0 56px; } }

.logo-cloud { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin-top: 40px; }
.logo-item {
  padding: 10px 22px; border: 1px solid var(--c-border); border-radius: 10px;
  font-weight: 700; color: var(--c-text-muted); font-size: 15px; background: #fff;
  transition: all .2s; letter-spacing: .02em;
}
.logo-item:hover { color: var(--c-primary); border-color: var(--c-primary); transform: translateY(-2px); box-shadow: var(--c-shadow-sm); }
.section--dark .logo-item { background: #0f172a; border-color: #1e293b; color: #94a3b8; }
.section--dark .logo-item:hover { color: #93c5fd; border-color: var(--c-primary); }

.card {
  background: #fff; border: 1px solid var(--c-border);
  border-radius: var(--c-radius); padding: 32px;
  transition: transform .25s, box-shadow .25s, border-color .25s; position: relative; overflow: hidden;
}
.card::after {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, var(--c-primary), var(--c-accent));
  opacity: 0; transition: opacity .25s;
}
.card:hover { transform: translateY(-4px); box-shadow: var(--c-shadow); border-color: rgba(37,99,235,.3); }
.card:hover::after { opacity: 1; }
.card--icon {
  width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;
  font-size: 26px; border-radius: 12px; background: rgba(37,99,235,.08); margin-bottom: 18px;
}
.card h3 { margin: 0 0 10px; font-size: 19px; font-weight: 700; letter-spacing: -0.01em; }
.card p { margin: 0; color: var(--c-text-muted); font-size: 15px; line-height: 1.7; }
.section--dark .card { background: #111a2c; border-color: #1e293b; }
.section--dark .card p { color: #94a3b8; }

.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px; text-align: center; }
.stat-num {
  font-size: clamp(40px, 5vw, 64px); font-weight: 800; line-height: 1;
  background: linear-gradient(120deg, var(--c-primary), var(--c-accent));
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  letter-spacing: -0.03em;
}
.stat-label { color: var(--c-text-muted); margin-top: 12px; font-size: 15px; font-weight: 500; }
.section--dark .stat-label { color: #94a3b8; }
@media (max-width: 640px) { .stats { grid-template-columns: repeat(2, 1fr); gap: 24px; } }

.pricing-card {
  background: #fff; border: 1px solid var(--c-border); border-radius: 20px;
  padding: 36px; display: flex; flex-direction: column; position: relative;
  transition: transform .25s, box-shadow .25s;
}
.pricing-card:hover { transform: translateY(-4px); box-shadow: var(--c-shadow); }
.pricing-card--featured {
  border: 2px solid transparent;
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(135deg, var(--c-primary), var(--c-accent)) border-box;
  box-shadow: var(--c-shadow);
}
.pricing-tag {
  position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
  background: linear-gradient(135deg, var(--c-primary), var(--c-accent));
  color: #fff; font-size: 12px; font-weight: 700; letter-spacing: .05em;
  padding: 5px 16px; border-radius: 999px; white-space: nowrap;
}
.pricing-name { font-size: 14px; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: .08em; font-weight: 600; }
.pricing-price { font-size: 48px; font-weight: 800; margin: 16px 0 4px; letter-spacing: -0.03em; }
.pricing-price small { font-size: 16px; font-weight: 400; color: var(--c-text-muted); letter-spacing: 0; }
.pricing-features { list-style: none; padding: 0; margin: 24px 0 32px; flex: 1; }
.pricing-features li { padding: 10px 0; border-top: 1px solid var(--c-border); font-size: 15px; display: flex; align-items: center; gap: 10px; }
.pricing-features li::before {
  content: "✓"; color: #fff; background: linear-gradient(135deg, var(--c-primary), var(--c-accent));
  width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; flex-shrink: 0;
}
.pricing-card .btn { width: 100%; }
.pricing-card--featured .btn { background: linear-gradient(135deg, var(--c-primary), var(--c-accent)); color: #fff; }

.testimonial {
  background: #fff; border: 1px solid var(--c-border); border-radius: 20px;
  padding: 32px; position: relative; transition: transform .25s, box-shadow .25s;
}
.testimonial:hover { transform: translateY(-4px); box-shadow: var(--c-shadow); }
.testimonial::before {
  content: "“"; position: absolute; top: 12px; right: 24px;
  font-size: 72px; line-height: 1; color: rgba(37,99,235,.15); font-family: Georgia, serif;
}
.testimonial-stars { color: #f59e0b; font-size: 15px; letter-spacing: 2px; margin-bottom: 14px; }
.testimonial-quote { font-size: 16.5px; line-height: 1.7; margin: 0 0 24px; color: var(--c-text); }
.testimonial-author { display: flex; align-items: center; gap: 14px; }
.testimonial-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  background: linear-gradient(135deg, var(--c-primary), var(--c-accent));
  display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; flex-shrink: 0;
}
.testimonial-name { font-weight: 700; font-size: 15px; }
.testimonial-role { font-size: 13px; color: var(--c-text-muted); }

.faq-item { border-bottom: 1px solid var(--c-border); }
.faq-item:first-child { border-top: 1px solid var(--c-border); }
.faq-q {
  width: 100%; text-align: left; background: none; border: none; cursor: pointer;
  padding: 24px 0; font-size: 17px; font-weight: 600; color: inherit;
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
}
.faq-q span {
  width: 28px; height: 28px; border-radius: 50%; background: rgba(37,99,235,.08);
  display: inline-flex; align-items: center; justify-content: center; font-size: 16px;
  color: var(--c-primary); transition: transform .2s; flex-shrink: 0;
}
.faq-item[open] .faq-q span { transform: rotate(45deg); }
.faq-a { padding: 0 0 24px; color: var(--c-text-muted); font-size: 15.5px; line-height: 1.8; max-width: 680px; }

.cta-band {
  background:
    radial-gradient(500px 300px at 15% 20%, rgba(255,255,255,.15), transparent 60%),
    radial-gradient(500px 300px at 85% 80%, rgba(255,255,255,.12), transparent 60%),
    linear-gradient(135deg, var(--c-primary), var(--c-accent));
  color: #fff; text-align: center; border-radius: 24px;
  padding: 80px 40px; position: relative; overflow: hidden;
}
.cta-band h2 { color: #fff; }
.cta-band .lead { color: rgba(255,255,255,.85); }
.cta-band .btn { background: #fff; color: var(--c-primary); box-shadow: 0 8px 24px rgba(0,0,0,.2); }
.cta-band .btn:hover { transform: translateY(-2px); }
@media (max-width: 640px) { .cta-band { padding: 56px 24px; } }

.contact-form { display: grid; gap: 18px; max-width: 620px; margin: 0 auto; }
.contact-form .field { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.contact-form input, .contact-form textarea {
  width: 100%; padding: 14px 18px; border: 1.5px solid var(--c-border);
  border-radius: 12px; font-size: 15px; font-family: inherit; transition: border-color .2s, box-shadow .2s;
  background: #fff;
}
.contact-form input:focus, .contact-form textarea:focus {
  outline: none; border-color: var(--c-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12);
}
.contact-form textarea { min-height: 130px; resize: vertical; }
.contact-form .btn { justify-self: center; min-width: 200px; }
.contact-note { text-align: center; font-size: 13px; color: var(--c-text-muted); margin-top: 16px; }
.section--dark .contact-form input, .section--dark .contact-form textarea { background: #0f172a; border-color: #1e293b; color: #fff; }
@media (max-width: 640px) { .contact-form .field { grid-template-columns: 1fr; } }

.team-card { text-align: center; padding: 32px 20px; }
.team-avatar {
  width: 104px; height: 104px; border-radius: 50%; margin: 0 auto 18px;
  background: linear-gradient(135deg, var(--c-primary), var(--c-accent));
  display: flex; align-items: center; justify-content: center;
  font-size: 36px; font-weight: 800; color: #fff; overflow: hidden; flex-shrink: 0;
}
.team-avatar img { width: 100%; height: 100%; object-fit: cover; }
.team-name { font-weight: 700; font-size: 17px; }
.team-role { color: var(--c-text-muted); font-size: 13px; margin-top: 4px; font-weight: 500; }
.team-bio { color: var(--c-text-muted); font-size: 14px; margin-top: 12px; line-height: 1.6; }
.section--dark .team-bio, .section--dark .team-role { color: #94a3b8; }

.post-card {
  display: block; background: #fff; border: 1px solid var(--c-border);
  border-radius: 20px; overflow: hidden; text-decoration: none; color: inherit;
  transition: transform .25s, box-shadow .25s;
}
.post-card:hover { transform: translateY(-4px); box-shadow: var(--c-shadow); }
.post-img { width: 100%; height: 200px; object-fit: cover; }
.post-noimg { height: 200px; background: linear-gradient(135deg, rgba(37,99,235,.15), rgba(124,58,237,.12)); }
.post-meta { color: var(--c-text-muted); font-size: 12.5px; padding: 22px 24px 0; font-weight: 500; }
.post-title { margin: 8px 24px 0; font-size: 19px; font-weight: 700; letter-spacing: -0.01em; }
.post-excerpt { margin: 10px 24px 24px; color: var(--c-text-muted); font-size: 14.5px; line-height: 1.7; }
.section--dark .post-card { background: #111a2c; border-color: #1e293b; }
.section--dark .post-excerpt, .section--dark .post-meta { color: #94a3b8; }

.video-wrap { max-width: 840px; margin: 0 auto; border-radius: 20px; overflow: hidden; box-shadow: var(--c-shadow-lg); border: 1px solid var(--c-border); background: #000; }
.video-frame { position: relative; padding-top: 56.25%; }
.video-frame iframe, .video-frame video { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.video-el { width: 100%; display: block; }
.video-placeholder {
  height: 400px; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0f172a, #1e293b); color: #94a3b8; font-size: 16px;
}

.divider { border: none; height: 1px; background: linear-gradient(90deg, transparent, var(--c-border), transparent); margin: 0; }
.spacer { height: 48px; }
.spacer--lg { height: 96px; }
.spacer--sm { height: 24px; }

.rich-content { max-width: 780px; margin: 0 auto; font-size: 16.5px; }
.rich-content p { margin: 0 0 20px; line-height: 1.8; color: #334155; }
.rich-content h1, .rich-content h2, .rich-content h3 { letter-spacing: -0.01em; margin: 32px 0 16px; }
.rich-content blockquote {
  border-left: 4px solid var(--c-primary); margin: 24px 0; padding: 8px 24px;
  color: var(--c-text-muted); font-style: italic; background: var(--c-bg-soft); border-radius: 0 12px 12px 0;
}
.section--dark .rich-content p { color: #cbd5e1; }
`;

export const THEME_PRESETS: Record<string, Record<string, string>> = {
  'default': {
    '--c-primary': '#2563eb',
    '--c-primary-hover': '#1d4ed8',
    '--c-accent': '#7c3aed',
  },
  'dark': {
    '--c-primary': '#22d3ee',
    '--c-primary-hover': '#06b6d4',
    '--c-accent': '#f472b6',
  },
  'orange': {
    '--c-primary': '#f97316',
    '--c-primary-hover': '#ea580c',
    '--c-accent': '#f59e0b',
  },
};

export function buildThemeCss(theme?: Record<string, string> | null): string {
  const vars = { ...THEME_PRESETS.default, ...(theme ?? {}) };
  return Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join('\n');
}
