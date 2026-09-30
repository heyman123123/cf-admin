/**
 * 画布 / 缩略图预览用 CSS（与 API GLOBAL_CSS 对齐，含编辑器选中描边与 Header/Footer 布局）。
 * v3.5：从 BlockEditor.tsx 拆出，供编辑器 iframe 与组件库 hover 缩略图复用。
 */
export const PREVIEW_CSS = `
:root{--c-primary:#2563eb;--c-primary-hover:#1d4ed8;--c-accent:#7c3aed;--c-bg:#fff;--c-bg-soft:#f8fafc;--c-text:#0f172a;--c-text-muted:#64748b;--c-border:#e2e8f0;--c-radius:16px;--c-shadow:0 4px 12px rgba(15,23,42,.06),0 12px 32px rgba(15,23,42,.08);--c-container:1200px}
*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;color:var(--c-text);line-height:1.6;-webkit-font-smoothing:antialiased}img{max-width:100%;display:block}a{color:var(--c-primary);text-decoration:none}
.container{max-width:var(--c-container);margin:0 auto;padding:0 24px}.section{padding:96px 0}.section--soft{background:var(--c-bg-soft)}.section--dark{background:#0b1220;color:#fff}.section--dark .lead{color:#94a3b8}
.eyebrow{display:inline-flex;align-items:center;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--c-primary);background:rgba(37,99,235,.08);padding:6px 14px;border-radius:999px;margin-bottom:20px}
.h1{font-size:clamp(40px,7vw,72px);line-height:1.05;font-weight:800;margin:0 0 24px;letter-spacing:-.03em}.h2{font-size:clamp(30px,4.5vw,46px);line-height:1.15;font-weight:800;margin:0 0 16px;letter-spacing:-.02em}.lead{font-size:clamp(16px,2vw,20px);color:var(--c-text-muted);margin:0 0 36px;line-height:1.7}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px;line-height:1;cursor:pointer;text-decoration:none}.btn--primary{background:linear-gradient(135deg,var(--c-primary),var(--c-accent));color:#fff;box-shadow:0 4px 16px rgba(37,99,235,.35)}.btn--ghost{background:transparent;color:inherit;border:1.5px solid var(--c-border)}.btn--outline{background:#fff;color:var(--c-primary);border:1.5px solid var(--c-border);box-shadow:0 1px 2px rgba(15,23,42,.04)}.btn--outline:hover{border-color:var(--c-primary)}.btn--white{background:#fff;color:var(--c-primary)}.btn--lg{padding:16px 40px;font-size:18px}.btn-row{display:flex;gap:16px;flex-wrap:wrap;justify-content:center}
.grid{display:grid;gap:28px}.grid-2{grid-template-columns:repeat(2,1fr)}.grid-3{grid-template-columns:repeat(3,1fr)}.grid-4{grid-template-columns:repeat(4,1fr)}
.hero{padding:140px 0 120px;text-align:center;position:relative;overflow:hidden}.hero--gradient{background:radial-gradient(800px 400px at 20% 0%,rgba(37,99,235,.12),transparent 60%),radial-gradient(700px 400px at 80% 10%,rgba(124,58,237,.10),transparent 60%),linear-gradient(180deg,#f8fafc,#fff)}.hero--dark{background:#0b1220;color:#fff}.hero--dark .lead{color:#94a3b8}.hero--light{background:linear-gradient(180deg,#f0f9ff,#fff)}.hero--image{background:#020617;color:#fff;background-size:cover;background-position:center;position:relative}.hero--image .lead{color:#cbd5e1}.hero--image .btn--ghost{border-color:#475569;color:#e2e8f0}.hero--center .lead{margin-left:auto;margin-right:auto;max-width:680px}.hero--left{text-align:left}.hero--left .btn-row{justify-content:flex-start}
.logo-cloud{display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin-top:40px}.logo-cloud--grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}.logo-item{padding:10px 22px;border:1px solid var(--c-border);border-radius:10px;font-weight:700;color:var(--c-text-muted);font-size:15px;background:#fff;text-align:center}
.card{background:#fff;border:1px solid var(--c-border);border-radius:var(--c-radius);padding:32px;position:relative;overflow:hidden}.card::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--c-primary),var(--c-accent));opacity:0;transition:opacity .25s}.card:hover::after{opacity:1}.card--icon{width:52px;height:52px;display:flex;align-items:center;justify-content:center;font-size:26px;border-radius:12px;background:rgba(37,99,235,.08);margin-bottom:18px}.card h3{margin:0 0 10px;font-size:19px;font-weight:700}.card p{margin:0;color:var(--c-text-muted);font-size:15px;line-height:1.7}.feature-num{font-size:44px;font-weight:800;line-height:1;background:linear-gradient(120deg,var(--c-primary),var(--c-accent));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:16px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:28px;text-align:center}.stats--line{display:grid;grid-template-columns:repeat(4,1fr);gap:28px;text-align:center}.stats--line>div{border-right:1px solid var(--c-border);padding:0 24px}.stats--line>div:last-child{border-right:none}.stat-num{font-size:clamp(40px,5vw,64px);font-weight:800;line-height:1;background:linear-gradient(120deg,var(--c-primary),var(--c-accent));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}.stat-label{color:var(--c-text-muted);margin-top:12px;font-size:15px;font-weight:500}
.pricing-card{background:#fff;border:1px solid var(--c-border);border-radius:20px;padding:36px;display:flex;flex-direction:column;position:relative}.pricing-card--featured{border:2px solid transparent;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(135deg,var(--c-primary),var(--c-accent)) border-box;box-shadow:var(--c-shadow)}.pricing-tag{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--c-primary),var(--c-accent));color:#fff;font-size:12px;font-weight:700;padding:5px 16px;border-radius:999px;white-space:nowrap}.pricing-name{font-size:14px;color:var(--c-text-muted);text-transform:uppercase;letter-spacing:.08em;font-weight:600}.pricing-price{font-size:48px;font-weight:800;margin:16px 0 4px}.pricing-price small{font-size:16px;font-weight:400;color:var(--c-text-muted)}.pricing-features{list-style:none;padding:0;margin:24px 0 32px;flex:1}.pricing-features li{padding:10px 0;border-top:1px solid var(--c-border);font-size:15px;display:flex;align-items:center;gap:10px}.pricing-features li::before{content:"✓";color:#fff;background:linear-gradient(135deg,var(--c-primary),var(--c-accent));width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}.pricing-card .btn{width:100%}
.testimonial{background:#fff;border:1px solid var(--c-border);border-radius:20px;padding:32px;position:relative}.testimonial::before{content:"“";position:absolute;top:12px;right:24px;font-size:72px;color:rgba(37,99,235,.15);font-family:Georgia,serif}.testimonial-stars{color:#f59e0b;font-size:15px;letter-spacing:2px;margin-bottom:14px}.testimonial-quote{font-size:16.5px;line-height:1.7;margin:0 0 24px}.testimonial-author{display:flex;align-items:center;gap:14px}.testimonial-avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--c-primary),var(--c-accent));display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0}.testimonial-name{font-weight:700;font-size:15px}.testimonial-role{font-size:13px;color:var(--c-text-muted)}.testimonial-single{max-width:680px;margin:0 auto;display:grid;gap:20px}
.faq-item{border-bottom:1px solid var(--c-border)}.faq-item:first-child{border-top:1px solid var(--c-border)}.faq-q{width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:24px 0;font-size:17px;font-weight:600;color:inherit;display:flex;justify-content:space-between;align-items:center}.faq-q span{width:28px;height:28px;border-radius:50%;background:rgba(37,99,235,.08);display:inline-flex;align-items:center;justify-content:center;font-size:16px;color:var(--c-primary);flex-shrink:0}.faq-a{padding:0 0 24px;color:var(--c-text-muted);font-size:15.5px;line-height:1.8}.faq-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:0 40px}
.cta-band{background:radial-gradient(500px 300px at 15% 20%,rgba(255,255,255,.15),transparent 60%),radial-gradient(500px 300px at 85% 80%,rgba(255,255,255,.12),transparent 60%),linear-gradient(135deg,var(--c-primary),var(--c-accent));color:#fff;text-align:center;border-radius:24px;padding:80px 40px;position:relative;overflow:hidden}.cta-band--dark{background:linear-gradient(135deg,#0f172a,#1e293b)}.cta-band h2{color:#fff}.cta-band .lead{color:rgba(255,255,255,.85)}.cta-band .btn{background:#fff;color:var(--c-primary);box-shadow:0 8px 24px rgba(0,0,0,.2)}.cta-icon{font-size:40px;margin-bottom:12px}
.contact-form{display:grid;gap:18px;max-width:620px;margin:0 auto}.contact-form .field{display:grid;grid-template-columns:1fr 1fr;gap:18px}.contact-form input,.contact-form textarea{width:100%;padding:14px 18px;border:1.5px solid var(--c-border);border-radius:12px;font-size:15px;font-family:inherit}.contact-form textarea{min-height:130px;resize:vertical}.contact-form .btn{justify-self:center;min-width:200px}.contact-note{text-align:center;font-size:13px;color:var(--c-text-muted);margin-top:16px}
.team-card{text-align:center;padding:32px 20px}.team-avatar{width:104px;height:104px;border-radius:50%;margin:0 auto 18px;background:linear-gradient(135deg,var(--c-primary),var(--c-accent));display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;color:#fff;overflow:hidden}.team-avatar img{width:100%;height:100%;object-fit:cover}.team-name{font-weight:700;font-size:17px}.team-role{color:var(--c-text-muted);font-size:13px;margin-top:4px}.team-bio{color:var(--c-text-muted);font-size:14px;margin-top:12px}
.post-card{display:block;background:#fff;border:1px solid var(--c-border);border-radius:20px;overflow:hidden;text-decoration:none;color:inherit}.post-img{width:100%;height:200px;object-fit:cover}.post-img--lg{height:320px}.post-noimg{height:200px;background:linear-gradient(135deg,rgba(37,99,235,.15),rgba(124,58,237,.12))}.post-meta{color:var(--c-text-muted);font-size:12.5px;padding:22px 24px 0}.post-title{margin:8px 24px 0;font-size:19px;font-weight:700}.post-excerpt{margin:10px 24px 24px;color:var(--c-text-muted);font-size:14.5px}
.video-wrap{max-width:840px;margin:0 auto;border-radius:20px;overflow:hidden;box-shadow:var(--c-shadow);background:#000}.video-wrap--full{max-width:100%}.video-placeholder{height:400px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a,#1e293b);color:#94a3b8}
.divider{border:none;height:1px;background:linear-gradient(90deg,transparent,var(--c-border),transparent)}.divider--dashed{background:none;border-top:1px dashed var(--c-border);height:0}.divider--gradient{background:linear-gradient(90deg,transparent,var(--c-primary),transparent)}.rich-content{max-width:780px;margin:0 auto;font-size:16.5px}.rich-content--center{text-align:center}.rich-content p{margin:0 0 20px;line-height:1.8;color:#334155}
/* ---- v3.5 Header / Footer（全局布局） ---- */
.site-header{position:sticky;top:0;z-index:100;background:var(--c-bg,#fff);border-bottom:1px solid var(--c-border);backdrop-filter:blur(12px)}
.site-header--overlay{position:absolute;background:transparent;border-bottom-color:transparent;color:#fff}
.site-header--overlay .site-nav a{color:rgba(255,255,255,.85)}
.site-header--overlay .site-nav a:hover{color:#fff}
.site-header--dark{background:#0b1220;border-bottom-color:#1e293b;color:#fff}
.site-header--dark .site-nav a{color:#cbd5e1}
.site-header--dark .site-nav a:hover{color:#fff}
.site-header--dark .site-cta--ghost{border-color:#334155;color:#e2e8f0}
.site-header--center .site-header-inner{justify-content:center}
.site-header--minimal .site-header-inner{justify-content:space-between}
.site-header--minimal .site-nav{display:none}
.site-header-inner{display:flex;align-items:center;justify-content:space-between;gap:24px;max-width:var(--c-container);margin:0 auto;padding:0 24px;height:72px}
.site-logo{display:flex;align-items:center;gap:10px;font-size:19px;font-weight:800;letter-spacing:-.02em;color:inherit;text-decoration:none}
.site-logo img{height:32px;width:auto}
.site-nav{display:flex;align-items:center;gap:6px;list-style:none;margin:0;padding:0}
.site-nav a{display:block;padding:9px 14px;border-radius:8px;font-size:15px;font-weight:500;color:var(--c-text);text-decoration:none;transition:color .2s,background .2s}
.site-nav a:hover{color:var(--c-primary);background:rgba(37,99,235,.06)}
.site-header-cta{display:flex;align-items:center;gap:10px}
.site-header-cta .btn{padding:10px 20px;font-size:14px;border-radius:9px}
.site-cta--ghost{background:transparent;color:inherit;border:1.5px solid var(--c-border)}
.site-cta--ghost:hover{border-color:var(--c-primary);color:var(--c-primary)}
@media(max-width:768px){.site-nav{display:none}.site-header-inner{height:60px}}
.site-footer{background:#0f172a;color:#cbd5e1;padding:72px 0 32px}
.site-footer--light{background:var(--c-bg-soft);color:var(--c-text)}
.site-footer--light .site-footer-link{color:var(--c-text-muted)}
.site-footer--light .site-footer-bottom{border-top-color:var(--c-border);color:var(--c-text-muted)}
.site-footer-inner{max-width:var(--c-container);margin:0 auto;padding:0 24px}
.site-footer--stack .site-footer-grid{justify-content:center}
.site-footer--stack .site-footer-col{text-align:center}
.site-footer--stack .site-footer-col .site-footer-links{justify-content:center}
.site-footer--minimal .site-footer-grid{display:none}
.site-footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px}
.site-footer-brand{font-size:18px;font-weight:800;color:#fff;margin-bottom:12px}
.site-footer-desc{font-size:14px;line-height:1.8;color:#94a3b8;max-width:320px}
.site-footer-col h4{color:#fff;font-size:14px;font-weight:600;margin:0 0 14px}
.site-footer-links{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px}
.site-footer-link{font-size:14px;color:#94a3b8;text-decoration:none;transition:color .2s}
.site-footer-link:hover{color:#fff}
.site-footer-social{display:flex;gap:10px;margin-top:18px}
.site-footer-social a{width:36px;height:36px;border-radius:9px;background:rgba(255,255,255,.08);display:inline-flex;align-items:center;justify-content:center;font-size:15px;color:#cbd5e1;text-decoration:none;transition:background .2s,transform .2s}
.site-footer-social a:hover{background:rgba(37,99,235,.35);transform:translateY(-2px)}
.site-footer-bottom{margin-top:48px;padding-top:24px;border-top:1px solid rgba(255,255,255,.1);font-size:13px;color:#64748b;text-align:center}
@media(max-width:900px){.site-footer-grid{grid-template-columns:1fr 1fr;gap:32px}}
@media(max-width:640px){.site-footer-grid{grid-template-columns:1fr}}
/* ---- 编辑器画布：点选描边 ---- */
.cf-block{position:relative;cursor:pointer;transition:outline-color .15s, box-shadow .15s}
.cf-block:hover{outline:1.5px dashed rgba(37,99,235,.55);outline-offset:3px}
.cf-selected{outline:2.5px solid #2563eb;outline-offset:3px;z-index:2}
.cf-selected::after{content:'选中 · 在右侧编辑';position:absolute;top:-30px;left:50%;transform:translateX(-50%);background:#2563eb;color:#fff;font-size:11px;font-weight:600;letter-spacing:.02em;padding:4px 12px;border-radius:999px;white-space:nowrap;box-shadow:0 4px 12px rgba(37,99,235,.35);z-index:10}
/* ---- v3.6 全局布局区块（画布内标记，点击切到对应布局编辑） ---- */
.cf-global{outline:1.5px dashed rgba(124,58,237,.55);outline-offset:3px;cursor:pointer}
.cf-global:hover{outline-color:rgba(124,58,237,.9)}
.cf-global::before{content:attr(data-tag);position:absolute;top:8px;right:8px;background:rgba(124,58,237,.92);color:#fff;font-size:10px;font-weight:700;letter-spacing:.03em;padding:3px 10px;border-radius:999px;z-index:10;box-shadow:0 2px 8px rgba(124,58,237,.35);white-space:nowrap;pointer-events:none}
`;
