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

/* ---------------- Hero ---------------- */
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

/* ---------------- Logo Cloud ---------------- */
.logo-cloud { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin-top: 40px; }
.logo-item {
  padding: 10px 22px; border: 1px solid var(--c-border); border-radius: 10px;
  font-weight: 700; color: var(--c-text-muted); font-size: 15px; background: #fff;
  transition: all .2s; letter-spacing: .02em;
}
.logo-item:hover { color: var(--c-primary); border-color: var(--c-primary); transform: translateY(-2px); box-shadow: var(--c-shadow-sm); }
.section--dark .logo-item { background: #0f172a; border-color: #1e293b; color: #94a3b8; }
.section--dark .logo-item:hover { color: #93c5fd; border-color: var(--c-primary); }

/* ---------------- Cards / Features ---------------- */
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

/* ---------------- Stats ---------------- */
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

/* ---------------- Pricing ---------------- */
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

/* ---------------- Testimonials ---------------- */
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

/* ---------------- FAQ ---------------- */
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

/* ---------------- CTA Band ---------------- */
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

/* ---------------- Contact Form ---------------- */
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

/* ---------------- Team ---------------- */
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

/* ---------------- Blog List ---------------- */
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

/* ---------------- Video ---------------- */
.video-wrap { max-width: 840px; margin: 0 auto; border-radius: 20px; overflow: hidden; box-shadow: var(--c-shadow-lg); border: 1px solid var(--c-border); background: #000; }
.video-frame { position: relative; padding-top: 56.25%; }
.video-frame iframe, .video-frame video { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.video-el { width: 100%; display: block; }
.video-placeholder {
  height: 400px; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0f172a, #1e293b); color: #94a3b8; font-size: 16px;
}

/* ---------------- Divider / Spacer / Rich Text ---------------- */
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

/* ===== v3.5 全局 Header / Footer ===== */
.site-header { position: sticky; top: 0; z-index: 100; background: var(--c-bg, #fff); border-bottom: 1px solid var(--c-border); backdrop-filter: blur(12px); }
.site-header--overlay { position: absolute; background: transparent; border-bottom-color: transparent; color: #fff; }
.site-header--overlay .site-nav a { color: rgba(255, 255, 255, 0.85); }
.site-header--overlay .site-nav a:hover { color: #fff; }
.site-header--dark { background: #0b1220; border-bottom-color: #1e293b; color: #fff; }
.site-header--dark .site-nav a { color: #cbd5e1; }
.site-header--dark .site-nav a:hover { color: #fff; }
.site-header--dark .site-cta--ghost { border-color: #334155; color: #e2e8f0; }
.site-header--center .site-header-inner { justify-content: center; }
.site-header--minimal .site-header-inner { justify-content: space-between; }
.site-header--minimal .site-nav { display: none; }
.site-header-inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; max-width: var(--c-container); margin: 0 auto; padding: 0 24px; height: 72px; }
.site-logo { display: flex; align-items: center; gap: 10px; font-size: 19px; font-weight: 800; letter-spacing: -0.02em; color: inherit; text-decoration: none; }
.site-logo img { height: 32px; width: auto; }
.site-nav { display: flex; align-items: center; gap: 6px; list-style: none; margin: 0; padding: 0; }
.site-nav a { display: block; padding: 9px 14px; border-radius: 8px; font-size: 15px; font-weight: 500; color: var(--c-text); text-decoration: none; transition: color 0.2s, background 0.2s; }
.site-nav a:hover { color: var(--c-primary); background: rgba(37, 99, 235, 0.06); }
.site-header-cta { display: flex; align-items: center; gap: 10px; }
.site-header-cta .btn { padding: 10px 20px; font-size: 14px; border-radius: 9px; }
.site-cta--ghost { background: transparent; color: inherit; border: 1.5px solid var(--c-border); }
.site-cta--ghost:hover { border-color: var(--c-primary); color: var(--c-primary); }
@media (max-width: 768px) { .site-nav { display: none; } .site-header-inner { height: 60px; } }
.site-footer { background: #0f172a; color: #cbd5e1; padding: 72px 0 32px; }
.site-footer--light { background: var(--c-bg-soft); color: var(--c-text); }
.site-footer--light .site-footer-link { color: var(--c-text-muted); }
.site-footer--light .site-footer-bottom { border-top-color: var(--c-border); color: var(--c-text-muted); }
.site-footer-inner { max-width: var(--c-container); margin: 0 auto; padding: 0 24px; }
.site-footer--stack .site-footer-grid { justify-content: center; }
.site-footer--stack .site-footer-col { text-align: center; }
.site-footer--stack .site-footer-col .site-footer-links { justify-content: center; }
.site-footer--minimal .site-footer-grid { display: none; }
.site-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
.site-footer-brand { font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 12px; }
.site-footer-desc { font-size: 14px; line-height: 1.8; color: #94a3b8; max-width: 320px; }
.site-footer-col h4 { color: #fff; font-size: 14px; font-weight: 600; margin: 0 0 14px; }
.site-footer-links { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.site-footer-link { font-size: 14px; color: #94a3b8; text-decoration: none; transition: color 0.2s; }
.site-footer-link:hover { color: #fff; }
.site-footer-social { display: flex; gap: 10px; margin-top: 18px; }
.site-footer-social a { width: 36px; height: 36px; border-radius: 9px; background: rgba(255, 255, 255, 0.08); display: inline-flex; align-items: center; justify-content: center; font-size: 15px; color: #cbd5e1; text-decoration: none; transition: background 0.2s, transform 0.2s; }
.site-footer-social a:hover { background: rgba(37, 99, 235, 0.35); transform: translateY(-2px); }
.site-footer-bottom { margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 13px; color: #64748b; text-align: center; }
@media (max-width: 900px) { .site-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; } }
@media (max-width: 640px) { .site-footer-grid { grid-template-columns: 1fr; } }

/* ===== v3 变体（variant）样式 ===== */
.hero--dark { background: #0b1220; color: #fff; }
.hero--dark .lead { color: #94a3b8; }
.hero--dark .btn--ghost { border-color: #334155; color: #e2e8f0; }
.hero--light { background: linear-gradient(180deg, #f0f9ff, #fff); }
.hero--image { background-color: #020617; color: #fff; background-size: cover; background-position: center; position: relative; }
.hero--image .lead { color: #cbd5e1; }
.hero--image .btn--ghost { border-color: #475569; color: #e2e8f0; }
.hero--left { text-align: left; }
.hero--left .btn-row { justify-content: flex-start; }
.feature-num { font-size: 44px; font-weight: 800; line-height: 1; background: linear-gradient(120deg, var(--c-primary), var(--c-accent)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 16px; }
.stats--line > div { border-right: 1px solid var(--c-border); padding: 0 24px; }
.stats--line > div:last-child { border-right: none; }
.pricing-card { display: flex; flex-direction: column; position: relative; }
.pricing-card--featured { border: 2px solid transparent; background: linear-gradient(#fff, #fff) padding-box, linear-gradient(135deg, var(--c-primary), var(--c-accent)) border-box; box-shadow: var(--c-shadow); }
.pricing-tag { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, var(--c-primary), var(--c-accent)); color: #fff; font-size: 12px; font-weight: 700; padding: 5px 16px; border-radius: 999px; white-space: nowrap; }
.pricing-features { flex: 1; }
.testimonial::before { content: "“"; position: absolute; top: 12px; right: 24px; font-size: 72px; color: rgba(37, 99, 235, 0.15); font-family: Georgia, serif; }
.testimonial-single { max-width: 680px; margin: 0 auto; display: grid; gap: 20px; }
.faq-item:first-child { border-top: 1px solid var(--c-border); }
.faq-q { width: 100%; text-align: left; background: none; border: none; cursor: pointer; padding: 24px 0; font-size: 17px; font-weight: 600; color: inherit; display: flex; justify-content: space-between; align-items: center; }
.faq-q span { width: 28px; height: 28px; border-radius: 50%; background: rgba(37, 99, 235, 0.08); display: inline-flex; align-items: center; justify-content: center; font-size: 16px; color: var(--c-primary); flex-shrink: 0; }
.faq-a { padding: 0 0 24px; color: var(--c-text-muted); font-size: 15.5px; line-height: 1.8; }
.faq-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 40px; }
.cta-band { background: radial-gradient(500px 300px at 15% 20%, rgba(255, 255, 255, 0.15), transparent 60%), radial-gradient(500px 300px at 85% 80%, rgba(255, 255, 255, 0.12), transparent 60%), linear-gradient(135deg, var(--c-primary), var(--c-accent)); color: #fff; text-align: center; border-radius: 24px; padding: 80px 40px; position: relative; overflow: hidden; }
.cta-band--dark { background: linear-gradient(135deg, #0f172a, #1e293b); }
.cta-band h2 { color: #fff; }
.cta-band .lead { color: rgba(255, 255, 255, 0.85); }
.cta-band .btn { background: #fff; color: var(--c-primary); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); }
.cta-icon { font-size: 40px; margin-bottom: 12px; }
.team-card--lg { text-align: left; display: flex; gap: 20px; align-items: center; }
.team-card--lg .team-avatar { margin: 0; flex-shrink: 0; }
.team-card--lg .team-bio { margin-top: 6px; }
.post-card--feature { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 28px; padding: 24px; }
.post-card--feature .post-img--lg { height: 100%; min-height: 240px; border-radius: 14px; }
.post-card--feature .post-noimg { height: 100%; min-height: 240px; border-radius: 14px; }
.post-card--feature .post-meta, .post-card--feature .post-title, .post-card--feature .post-excerpt { padding: 0; margin: 0 0 12px; }
.logo-cloud--grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.video-wrap { max-width: 840px; margin: 0 auto; border-radius: 20px; overflow: hidden; box-shadow: var(--c-shadow); background: #000; }
.video-wrap--full { max-width: 100%; }
.video-el { width: 100%; display: block; }
.video-frame { position: relative; padding-bottom: 56.25%; height: 0; }
.video-frame iframe, .video-frame video { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.video-placeholder { height: 400px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a, #1e293b); color: #94a3b8; }
.divider--dashed { background: none; border-top: 1px dashed var(--c-border); height: 0; }
.divider--gradient { background: linear-gradient(90deg, transparent, var(--c-primary), transparent); }
.contact-form--split { grid-template-columns: 1fr 1.4fr; align-items: start; gap: 48px; }
.contact-left h3 { font-size: 24px; margin: 0 0 12px; }
.contact-left p { color: var(--c-text-muted); line-height: 1.8; }

@media (max-width: 900px) {
  .faq-grid-2 { grid-template-columns: 1fr; }
  .stats--line > div { border-right: none; padding: 0; }
  .contact-form--split { grid-template-columns: 1fr; }
  .post-card--feature { grid-template-columns: 1fr; }
}
`;

/**
 * 潘通（Pantone）色卡主题预设 + 经典内置方案。
 * 每套预设覆盖全站 CSS 变量：主色 / 主色悬停 / 强调色 / 背景 / 浅背景 / 正文 / 次要文字 / 边框 / 圆角。
 * 与 admin 端 `apps/admin/src/lib/theme.ts` 保持一致（两端同步维护）。
 */
export const THEME_PRESETS: Record<string, { name: string; vars: Record<string, string> }> = {
  /* ---------- 内置经典方案（兼容早期数据） ---------- */
  'default': {
    name: '科技蓝',
    vars: { '--c-primary': '#2563eb', '--c-primary-hover': '#1d4ed8', '--c-accent': '#7c3aed', '--c-bg': '#ffffff', '--c-bg-soft': '#f8fafc', '--c-text': '#0f172a', '--c-text-muted': '#64748b', '--c-border': '#e2e8f0', '--c-radius': '16px' },
  },
  'dark': {
    name: '冷青',
    vars: { '--c-primary': '#22d3ee', '--c-primary-hover': '#06b6d4', '--c-accent': '#f472b6', '--c-bg': '#ffffff', '--c-bg-soft': '#f8fafc', '--c-text': '#0f172a', '--c-text-muted': '#64748b', '--c-border': '#e2e8f0', '--c-radius': '16px' },
  },
  'orange': {
    name: '活力橙',
    vars: { '--c-primary': '#f97316', '--c-primary-hover': '#ea580c', '--c-accent': '#f59e0b', '--c-bg': '#ffffff', '--c-bg-soft': '#f8fafc', '--c-text': '#0f172a', '--c-text-muted': '#64748b', '--c-border': '#e2e8f0', '--c-radius': '16px' },
  },

  /* ---------- 潘通年度色（Pantone Color of the Year） ---------- */
  'classic_blue': {
    name: '经典蓝 2020',
    vars: { '--c-primary': '#0f4c81', '--c-primary-hover': '#0b3d68', '--c-accent': '#5c88b5', '--c-bg': '#ffffff', '--c-bg-soft': '#f3f7fb', '--c-text': '#0e2a47', '--c-text-muted': '#5a728a', '--c-border': '#d8e2ee', '--c-radius': '16px' },
  },
  'ultimate_gray': {
    name: '极致灰×亮黄 2021',
    vars: { '--c-primary': '#e9d94c', '--c-primary-hover': '#d6c636', '--c-accent': '#8f9296', '--c-bg': '#ffffff', '--c-bg-soft': '#f5f5f2', '--c-text': '#24282b', '--c-text-muted': '#66696d', '--c-border': '#e0e0dc', '--c-radius': '14px' },
  },
  'very_peri': {
    name: '长春花蓝 2022',
    vars: { '--c-primary': '#6667ab', '--c-primary-hover': '#545598', '--c-accent': '#9b8ec9', '--c-bg': '#ffffff', '--c-bg-soft': '#f5f5fb', '--c-text': '#23244e', '--c-text-muted': '#5f6091', '--c-border': '#dddcf0', '--c-radius': '18px' },
  },
  'viva_magenta': {
    name: '洋红万岁 2023',
    vars: { '--c-primary': '#bb2649', '--c-primary-hover': '#a01e3d', '--c-accent': '#e27a8f', '--c-bg': '#ffffff', '--c-bg-soft': '#fdf4f6', '--c-text': '#3d0f1d', '--c-text-muted': '#7d4a58', '--c-border': '#f0d5db', '--c-radius': '14px' },
  },
  'peach_fuzz': {
    name: '柔和桃 2024',
    vars: { '--c-primary': '#e8846a', '--c-primary-hover': '#d96f54', '--c-accent': '#f4b896', '--c-bg': '#ffffff', '--c-bg-soft': '#fdf6f2', '--c-text': '#4a2b1f', '--c-text-muted': '#8c6553', '--c-border': '#f2ddd0', '--c-radius': '18px' },
  },
  'mocha_mousse': {
    name: '摩卡慕斯 2025',
    vars: { '--c-primary': '#a47864', '--c-primary-hover': '#8d654f', '--c-accent': '#c8a27e', '--c-bg': '#ffffff', '--c-bg-soft': '#f8f3ee', '--c-text': '#3c2b21', '--c-text-muted': '#7a6253', '--c-border': '#eadcd2', '--c-radius': '16px' },
  },

  /* ---------- 潘通经典色（Pantone 标志性色号） ---------- */
  'greenery': {
    name: '草木绿 15-0343',
    vars: { '--c-primary': '#88b04b', '--c-primary-hover': '#75983d', '--c-accent': '#2e6b4f', '--c-bg': '#ffffff', '--c-bg-soft': '#f6f9ef', '--c-text': '#223a1c', '--c-text-muted': '#5f7a52', '--c-border': '#dde8cc', '--c-radius': '16px' },
  },
  'living_coral': {
    name: '珊瑚橘 16-1546',
    vars: { '--c-primary': '#ff6f61', '--c-primary-hover': '#e85c4f', '--c-accent': '#ffb199', '--c-bg': '#ffffff', '--c-bg-soft': '#fff5f2', '--c-text': '#4a2018', '--c-text-muted': '#8c5a4e', '--c-border': '#f5dbd3', '--c-radius': '14px' },
  },
  'ultra_violet': {
    name: '紫外光 18-3838',
    vars: { '--c-primary': '#5f259f', '--c-primary-hover': '#4e1d82', '--c-accent': '#9b6dc4', '--c-bg': '#ffffff', '--c-bg-soft': '#f8f4fc', '--c-text': '#2a1147', '--c-text-muted': '#6c5489', '--c-border': '#e6dcf2', '--c-radius': '18px' },
  },
  'serenity_rose': {
    name: '静谧蓝×玫瑰石英 2016',
    vars: { '--c-primary': '#91a8d0', '--c-primary-hover': '#7b94c0', '--c-accent': '#f7cac9', '--c-bg': '#ffffff', '--c-bg-soft': '#f5f7fb', '--c-text': '#313b55', '--c-text-muted': '#6b7695', '--c-border': '#dde3f0', '--c-radius': '18px' },
  },
  'aurora_gold': {
    name: '极光金',
    vars: { '--c-primary': '#b8860b', '--c-primary-hover': '#a0750a', '--c-accent': '#4b5e91', '--c-bg': '#ffffff', '--c-bg-soft': '#faf8f2', '--c-text': '#3a2e10', '--c-text-muted': '#7d6f4a', '--c-border': '#ece3c8', '--c-radius': '16px' },
  },
};

export const THEME_PRESETS_LEGACY = Object.fromEntries(
  Object.entries(THEME_PRESETS).map(([k, v]) => [k, v.vars]),
);

export const THEME_VAR_LABELS: Record<string, string> = {
  '--c-primary': '主色',
  '--c-primary-hover': '主色悬停',
  '--c-accent': '强调色',
  '--c-bg': '页面背景',
  '--c-bg-soft': '浅色背景',
  '--c-text': '正文文字',
  '--c-text-muted': '次要文字',
  '--c-border': '边框色',
  '--c-radius': '圆角半径',
};

export function buildThemeCss(theme?: Record<string, string> | null): string {
  const vars = { ...THEME_PRESETS['default'].vars, ...(theme ?? {}) };
  return Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join('\n');
}
