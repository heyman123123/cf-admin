import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type BlockItem } from '../lib/api';
import { BLOCK_SCHEMAS, BLOCK_GROUPS, SCHEMA_MAP, migrateContent, getVariants, defaultVariant } from '../lib/blocks';
import { SchemaForm } from '../components/SchemaForm';

type BlockData = Record<string, any>;
type Draft = { block_type: string; sort_order: number; content_json: BlockData };

/* ================= 预览渲染（与 API BlockRenderer 对齐，含 v3 变体） ================= */

function renderBlockPreview(b: Draft): string {
  const d = b.content_json;
  const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const secStyle = (extra = '') =>
    `style="${(d.paddingTop ? `padding-top:${d.paddingTop}px;` : '')}${(d.paddingBottom ? `padding-bottom:${d.paddingBottom}px;` : '')}${extra}"`;

  switch (b.block_type) {
    case 'hero': {
      const v = d.variant ?? 'gradient';
      const heroBg = v === 'dark' ? 'hero--dark' : v === 'light' ? 'hero--light' : v === 'image' ? 'hero--image' : 'hero--gradient';
      const align = d.align === 'left' ? 'hero--left' : 'hero--center';
      const bgImg = v === 'image' && d.image ? `style="background-image:linear-gradient(rgba(2,6,23,.62),rgba(2,6,23,.72)),url('${esc(d.image)}')"` : '';
      return `<section class="hero ${heroBg} ${align}" ${bgImg || secStyle()}><div class="container">
        ${d.badge ? `<span class="eyebrow hero-badge">${esc(d.badge)}</span>` : ''}
        <h1 class="h1">${esc(d.title)}</h1>
        ${d.subtitle ? `<p class="lead">${esc(d.subtitle)}</p>` : ''}
        ${(d.primaryCta || d.secondaryCta) ? `<div class="btn-row">${d.primaryCta ? `<a class="btn btn--primary btn--lg">${esc(d.primaryCta.text)}</a>` : ''}${d.secondaryCta ? `<a class="btn btn--ghost btn--lg">${esc(d.secondaryCta.text)}</a>` : ''}</div>` : ''}
        ${v !== 'image' && d.image ? `<img class="hero-img" src="${esc(d.image)}" style="max-width:800px;margin:48px auto 0">` : ''}
      </div></section>`;
    }
    case 'logo_cloud': {
      const v = d.variant ?? 'row';
      return `<section class="section" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}<div class="logo-cloud ${v === 'grid' ? 'logo-cloud--grid' : ''}">${(d.logos ?? []).map((l: any) => `<span class="logo-item">${esc(typeof l === 'string' ? l : l.name)}</span>`).join('')}</div></div></section>`;
    }
    case 'features': {
      const v = d.variant ?? 'icon';
      return `<section class="section section--soft" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead" style="text-align:center">${esc(d.subtitle)}</p>` : ''}<div class="grid grid-3">${(d.bullets ?? []).map((f: any, i: number) => `<div class="card${v === 'number' ? ' card--num' : ''}">${v === 'number' ? `<div class="feature-num">${String(i + 1).padStart(2, '0')}</div>` : f.icon ? `<div class="card--icon">${esc(f.icon)}</div>` : ''}<h3>${esc(f.title)}</h3><p>${esc(f.desc)}</p></div>`).join('')}</div></div></section>`;
    }
    case 'stats': {
      const v = d.variant ?? 'dark';
      return `<section class="section ${v === 'light' ? 'section--soft' : v === 'line' ? '' : 'section--dark'}" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}<div class="stats${v === 'line' ? ' stats--line' : ''}">${(d.stats ?? []).map((s: any) => `<div><div class="stat-num">${esc(s.num)}</div><div class="stat-label">${esc(s.label)}</div></div>`).join('')}</div></div></section>`;
    }
    case 'pricing_table': {
      const v = d.variant ?? 'three';
      const colCls = v === 'two' ? 'grid grid-2' : v === 'four' ? 'grid grid-4' : 'grid grid-3';
      return `<section class="section" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead" style="text-align:center">${esc(d.subtitle)}</p>` : ''}<div class="${colCls}" style="margin-top:48px;align-items:stretch">${(d.plans ?? []).map((p: any) => {
        const fl = Array.isArray(p.features) ? p.features : String(p.features ?? '').split('\n').filter(Boolean);
        return `<div class="pricing-card ${p.featured ? 'pricing-card--featured' : ''}">${p.featured ? `<span class="pricing-tag">最受欢迎</span>` : ''}<div class="pricing-name">${esc(p.name)}</div><div class="pricing-price">${esc(p.price)} <small>${esc(p.period ?? '/月')}</small></div><ul class="pricing-features">${fl.map((f: string) => `<li>${esc(f)}</li>`).join('')}</ul><a class="btn btn--primary">${esc(p.cta ?? '开始使用')}</a></div>`;
      }).join('')}</div></div></section>`;
    }
    case 'testimonials': {
      const v = d.variant ?? 'grid';
      return `<section class="section ${v === 'single' ? 'section--soft' : ''}" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}<div class="${v === 'single' ? 'testimonial-single' : 'grid grid-3'}">${(d.testimonials ?? []).map((t: any) => `<div class="testimonial"><div class="testimonial-stars">★★★★★</div><p class="testimonial-quote">"${esc(t.quote)}"</p><div class="testimonial-author"><div class="testimonial-avatar">${esc(t.author?.[0] ?? '?')}</div><div><div class="testimonial-name">${esc(t.author)}</div><div class="testimonial-role">${esc(t.role)}</div></div></div></div>`).join('')}</div></div></section>`;
    }
    case 'faq': {
      const v = d.variant ?? 'single';
      return `<section class="section" ${secStyle()}><div class="container" style="max-width:${v === 'two' ? 1000 : 800}px">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}<div class="${v === 'two' ? 'faq-grid-2' : ''}">${(d.faqs ?? []).map((f: any) => `<details class="faq-item" open><summary class="faq-q">${esc(f.q)} <span>+</span></summary><div class="faq-a">${esc(f.a)}</div></details>`).join('')}</div></div></section>`;
    }
    case 'team': {
      const v = d.variant ?? 'four';
      return `<section class="section section--soft" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead" style="text-align:center">${esc(d.subtitle)}</p>` : ''}<div class="grid ${v === 'two' ? 'grid-2' : 'grid-4'}">${(d.team ?? []).map((t: any) => `<div class="team-card${v === 'two' ? ' team-card--lg' : ''}"><div class="team-avatar">${t.avatar ? `<img src="${esc(t.avatar)}">` : `<span>${esc(t.name?.[0] ?? '?')}</span>`}</div><div class="team-name">${esc(t.name)}</div><div class="team-role">${esc(t.role)}</div>${t.bio ? `<div class="team-bio">${esc(t.bio)}</div>` : ''}</div>`).join('')}</div></div></section>`;
    }
    case 'blog_list': {
      const v = d.variant ?? 'grid';
      return `<section class="section" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}<div class="grid ${v === 'feature' ? 'grid-2' : 'grid-3'}">${(d.posts ?? []).map((p: any, i: number) => `<div class="post-card${v === 'feature' && i === 0 ? ' post-card--feature' : ''}">${p.image ? `<img class="post-img${v === 'feature' && i === 0 ? ' post-img--lg' : ''}" src="${esc(p.image)}">` : `<div class="post-noimg"></div>`}<div class="post-meta">${esc(p.date ?? '')}</div><h3 class="post-title">${esc(p.title)}</h3>${p.excerpt ? `<p class="post-excerpt">${esc(p.excerpt)}</p>` : ''}</div>`).join('')}</div></div></section>`;
    }
    case 'video_embed': {
      const v = d.variant ?? 'boxed';
      return `<section class="section" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}<div class="video-wrap${v === 'full' ? ' video-wrap--full' : ''}"><div class="video-placeholder">视频嵌入区</div></div></div></section>`;
    }
    case 'cta_band': {
      const v = d.variant ?? 'gradient';
      const bgImg = v === 'image' && d.image ? `style="background-image:linear-gradient(rgba(2,6,23,.6),rgba(2,6,23,.6)),url('${esc(d.image)}');background-size:cover;background-position:center"` : v === 'dark' ? 'style="background:linear-gradient(135deg,#0f172a,#1e293b)"' : '';
      return `<section class="section" ${secStyle()}><div class="container"><div class="cta-band${v === 'dark' ? ' cta-band--dark' : ''}" ${bgImg}>${d.cta_icon ? `<div class="cta-icon">${esc(d.cta_icon)}</div>` : ''}<h2 class="h2">${esc(d.title)}</h2>${d.subtitle ? `<p class="lead">${esc(d.subtitle)}</p>` : ''}${d.cta ? `<a class="btn btn--lg">${esc(d.cta.text)}</a>` : ''}</div></div></section>`;
    }
    case 'contact_form': {
      const v = d.variant ?? 'center';
      const inner = `<div class="contact-form">${v === 'split' ? `<div class="contact-left">${d.leftTitle ? `<h3>${esc(d.leftTitle)}</h3>` : ''}${d.leftText ? `<p>${esc(d.leftText)}</p>` : ''}</div>` : ''}<div class="contact-fields"><div class="field"><input placeholder="您的称呼"><input placeholder="邮箱"></div><input placeholder="公司名称（选填）"><textarea placeholder="想了解什么？"></textarea><button class="btn btn--primary">${esc(d.form?.submit_label ?? '提交咨询')}</button></div></div>`;
      return `<section class="section section--soft" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead" style="text-align:center">${esc(d.subtitle)}</p>` : ''}${inner}${d.form?.note ? `<p class="contact-note">${esc(d.form.note)}</p>` : ''}</div></section>`;
    }
    case 'divider': {
      const v = d.variant ?? 'solid';
      return `<hr class="divider divider--${v}" style="margin:${d.height === 'lg' ? 48 : 24}px 0">`;
    }
    case 'spacer':
      return `<div style="height:${d.height === 'lg' ? 96 : d.height === 'sm' ? 24 : 48}px"></div>`;
    case 'rich_text':
    default: {
      const v = d.variant ?? 'left';
      return `<section class="section" ${secStyle()}><div class="container"><div class="rich-content${v === 'center' ? ' rich-content--center' : ''}">${d.title ? `<h2 class="h2">${esc(d.title)}</h2>` : ''}<div>${d.body ?? ''}</div></div></div></section>`;
    }
  }
}

/* ================= 预览样式（v3：含全部变体，与 API GLOBAL_CSS 对齐） ================= */

const PREVIEW_CSS = `
:root{--c-primary:#2563eb;--c-primary-hover:#1d4ed8;--c-accent:#7c3aed;--c-bg:#fff;--c-bg-soft:#f8fafc;--c-text:#0f172a;--c-text-muted:#64748b;--c-border:#e2e8f0;--c-radius:16px;--c-shadow:0 4px 12px rgba(15,23,42,.06),0 12px 32px rgba(15,23,42,.08);--c-container:1200px}
*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;color:var(--c-text);line-height:1.6;-webkit-font-smoothing:antialiased}img{max-width:100%;display:block}a{color:var(--c-primary);text-decoration:none}
.container{max-width:var(--c-container);margin:0 auto;padding:0 24px}.section{padding:96px 0}.section--soft{background:var(--c-bg-soft)}.section--dark{background:#0b1220;color:#fff}.section--dark .lead{color:#94a3b8}
.eyebrow{display:inline-flex;align-items:center;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--c-primary);background:rgba(37,99,235,.08);padding:6px 14px;border-radius:999px;margin-bottom:20px}
.h1{font-size:clamp(40px,7vw,72px);line-height:1.05;font-weight:800;margin:0 0 24px;letter-spacing:-.03em}.h2{font-size:clamp(30px,4.5vw,46px);line-height:1.15;font-weight:800;margin:0 0 16px;letter-spacing:-.02em}.lead{font-size:clamp(16px,2vw,20px);color:var(--c-text-muted);margin:0 0 36px;line-height:1.7}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px;line-height:1;cursor:pointer;text-decoration:none}.btn--primary{background:linear-gradient(135deg,var(--c-primary),var(--c-accent));color:#fff;box-shadow:0 4px 16px rgba(37,99,235,.35)}.btn--ghost{background:transparent;color:inherit;border:1.5px solid var(--c-border)}.btn--lg{padding:16px 40px;font-size:18px}.btn-row{display:flex;gap:16px;flex-wrap:wrap;justify-content:center}
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
@media(max-width:900px){.grid-3,.grid-4{grid-template-columns:repeat(2,1fr)}.faq-grid-2{grid-template-columns:1fr}.stats--line>div{border-right:none;padding:0}}@media(max-width:640px){.grid-2,.grid-3,.grid-4{grid-template-columns:1fr}.section{padding:48px 0}.hero{padding:72px 0 56px}.btn-row{flex-direction:column}.btn-row .btn{width:100%}.stats,.stats--line{grid-template-columns:repeat(2,1fr)}.contact-form .field{grid-template-columns:1fr}.contact-form{grid-template-columns:1fr!important}}
`;

/* ================= 撤销/重做钩子 ================= */

function useHistory<T>(initial: T) {
  const [state, setState] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);

  const set = (next: T | ((s: T) => T), record = true) => {
    setState((cur) => {
      const val = typeof next === 'function' ? (next as (s: T) => T)(cur) : next;
      if (record) {
        past.current = [...past.current.slice(-49), cur];
        future.current = [];
      }
      return val;
    });
  };

  const undo = () => {
    if (!past.current.length) return;
    const prev = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [...future.current, state];
    setState(prev);
  };

  const redo = () => {
    if (!future.current.length) return;
    const next = future.current[future.current.length - 1];
    future.current = future.current.slice(0, -1);
    past.current = [...past.current, state];
    setState(next);
  };

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;
  return { state, setState, set, undo, redo, canUndo, canRedo };
}

/* ================= 编辑器主体 ================= */

export default function BlockEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const history = useHistory<Draft[]>([]);
  const { state: blocks, set: setBlocks, undo, redo, canUndo, canRedo } = history;

  const [selected, setSelected] = useState(0);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => {
    api.listBlocks(id!).then((rows: BlockItem[]) => {
      setBlocks(rows.map((r) => ({
        block_type: r.blockType,
        sort_order: r.sortOrder,
        content_json: migrateContent(r.blockType, JSON.parse(r.contentJson)),
      })), false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 点选即配：iframe 内点击区块 → postMessage → 选中
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'cf-block-click' && typeof e.data.ix === 'number') {
        setSelected(e.data.ix);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const schemaOf = (type: string) => SCHEMA_MAP[type] ?? BLOCK_SCHEMAS[0];

  const update = (i: number, patch: Partial<Draft>) => {
    setBlocks((bs) => bs.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  };

  const move = (i: number, dir: -1 | 1) => {
    setBlocks((bs) => {
      const next = [...bs];
      const [item] = next.splice(i, 1);
      next.splice(i + dir, 0, item);
      return next.map((b, idx) => ({ ...b, sort_order: idx }));
    });
    setSelected((s) => Math.max(0, Math.min(s + dir, blocks.length - 1)));
  };

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= blocks.length || to >= blocks.length) return;
    setBlocks((bs) => {
      const next = [...bs];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next.map((b, idx) => ({ ...b, sort_order: idx }));
    });
    setSelected(to);
  };

  const duplicate = (i: number) => {
    setBlocks((bs) => {
      const copy = { ...bs[i], content_json: JSON.parse(JSON.stringify(bs[i].content_json)) };
      const next = [...bs];
      next.splice(i + 1, 0, copy);
      return next.map((b, idx) => ({ ...b, sort_order: idx }));
    });
    setSelected(Math.min(i + 1, blocks.length));
  };

  const remove = (i: number) => {
    setBlocks((bs) => bs.filter((_, idx) => idx !== i).map((b, idx) => ({ ...b, sort_order: idx })));
    setHidden((h) => {
      const n = new Set<number>();
      h.forEach((v) => n.add(v > i ? v - 1 : v));
      return n;
    });
    setSelected(Math.max(0, i - 1));
  };

  const toggleHidden = (i: number) => {
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });
  };

  const addBlock = (type: string) => {
    const schema = SCHEMA_MAP[type];
    if (!schema) return;
    const block: Draft = { block_type: type, sort_order: blocks.length, content_json: { ...schema.defaults(), variant: defaultVariant(type) } };
    setBlocks((bs) => [...bs, block]);
    setSelected(blocks.length);
  };

  const changeType = (i: number, type: string) => {
    const schema = SCHEMA_MAP[type];
    if (!schema) return;
    update(i, { block_type: type, content_json: { ...schema.defaults(), variant: defaultVariant(type) } });
  };

  const save = async (publish: boolean) => {
    setSaving('saving');
    try {
      await api.saveBlocks(id!, blocks);
      if (publish) await api.publishPage(id!);
      setSaving('saved');
      setTimeout(() => setSaving('idle'), 2000);
      if (publish) nav('/pages');
    } catch (e) {
      setSaving('idle');
      alert(String(e));
    }
  };

  // 画布 HTML：可见区块按序渲染，每个区块可点击选中
  const previewHtml = useMemo(() => {
    const body = blocks
      .map((b, i) => (hidden.has(i) ? '' : `<div data-ix="${i}" onclick="event.stopPropagation();parent.postMessage({type:'cf-block-click',ix:${i}},'*')">${renderBlockPreview(b)}</div>`))
      .join('');
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${PREVIEW_CSS}</style></head><body style="margin:0">${body || '<div style="padding:80px;text-align:center;color:#94a3b8">空页面 · 从左侧添加区块</div>'}</body></html>`;
  }, [blocks, hidden]);

  const cur = blocks[selected];
  const variants = cur ? getVariants(cur.block_type) : [];

  const deviceWidth = device === 'mobile' ? 375 : device === 'tablet' ? 768 : '100%';

  return (
    <div className="flex h-screen -m-6">
      {/* ======== 左：Layers 面板 ======== */}
      <div className="w-72 border-r bg-gray-50 flex flex-col min-w-0">
        <div className="px-3 py-3 border-b bg-white">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold">页面区块</h3>
            <span className="text-[10px] text-gray-400">{blocks.length} 个 · 拖拽排序</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {blocks.map((b, i) => {
            const isHidden = hidden.has(i);
            const isDragOver = dragOver === i && dragFrom !== i;
            return (
              <div
                key={i}
                draggable
                onDragStart={() => setDragFrom(i)}
                onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                onDragLeave={() => setDragOver((v) => (v === i ? null : v))}
                onDrop={() => { if (dragFrom !== null) reorder(dragFrom, i); setDragFrom(null); setDragOver(null); }}
                onDragEnd={() => { setDragFrom(null); setDragOver(null); }}
                onClick={() => setSelected(i)}
                className={`group flex items-center gap-1 px-2 py-1.5 rounded text-sm cursor-pointer border transition-all ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-transparent'} ${i === selected ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'} ${isHidden ? 'opacity-45' : ''}`}
              >
                <span className="text-[10px] opacity-60 w-4 shrink-0">{i + 1}</span>
                <span className="flex-1 truncate">{schemaOf(b.block_type).label}</span>
                <button
                  title={isHidden ? '显示' : '隐藏'}
                  onClick={(e) => { e.stopPropagation(); toggleHidden(i); }}
                  className={`text-xs shrink-0 ${i === selected ? 'text-white/80 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                >{isHidden ? '◔' : '◉'}</button>
                <button title="复制" onClick={(e) => { e.stopPropagation(); duplicate(i); }}
                  className={`text-xs shrink-0 opacity-0 group-hover:opacity-100 ${i === selected ? 'text-white/80' : 'text-gray-400 hover:text-gray-600'}`}>⧉</button>
                <button title="删除" onClick={(e) => { e.stopPropagation(); remove(i); }}
                  className={`text-xs shrink-0 opacity-0 group-hover:opacity-100 ${i === selected ? 'text-white/80' : 'text-red-400 hover:text-red-600'}`}>✕</button>
              </div>
            );
          })}
          {blocks.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">暂无区块，从下方添加</p>
          )}
        </div>
        {/* 添加区块 */}
        <div className="border-t bg-white p-3 max-h-64 overflow-auto">
          <h4 className="text-[10px] text-gray-400 font-bold mb-2">添加区块</h4>
          {BLOCK_GROUPS.map((g) => (
            <div key={g} className="mb-2">
              <h5 className="text-[10px] text-gray-400 mb-1">{g}</h5>
              <div className="flex flex-wrap gap-1">
                {BLOCK_SCHEMAS.filter((s) => s.group === g).map((s) => (
                  <button key={s.type} onClick={() => addBlock(s.type)}
                    className="px-2 py-1 text-[11px] rounded border border-gray-200 hover:border-blue-400 hover:text-blue-600 bg-white text-gray-600 truncate">
                    + {s.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======== 右：设置面板 ======== */}
      <div className="w-96 border-r p-4 overflow-auto bg-white flex flex-col min-w-0">
        <div className="flex justify-between items-center mb-3 shrink-0">
          <h3 className="font-bold text-sm">区块设置</h3>
          {cur && (
            <div className="flex gap-1">
              <button onClick={() => move(selected, -1)} disabled={selected === 0} className="px-2 py-1 border rounded text-xs disabled:opacity-30" title="上移">↑</button>
              <button onClick={() => move(selected, 1)} disabled={selected === blocks.length - 1} className="px-2 py-1 border rounded text-xs disabled:opacity-30" title="下移">↓</button>
              <button onClick={() => duplicate(selected)} disabled={!cur} className="px-2 py-1 border rounded text-xs disabled:opacity-30" title="复制">⧉</button>
              <button onClick={() => remove(selected)} disabled={!cur} className="px-2 py-1 border rounded text-xs text-red-500 disabled:opacity-30" title="删除">✕</button>
            </div>
          )}
        </div>

        {cur && (
          <>
            {/* 组件类型 */}
            <div className="mb-3">
              <span className="text-xs font-medium text-gray-500 block mb-1">组件类型</span>
              <select
                value={cur.block_type}
                onChange={(e) => changeType(selected, e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm"
              >
                {BLOCK_SCHEMAS.map((s) => <option key={s.type} value={s.type}>{s.label}</option>)}
              </select>
            </div>

            {/* 变体（v3 商业化） */}
            {variants.length > 0 && (
              <div className="mb-3">
                <span className="text-xs font-medium text-gray-500 block mb-1">视觉变体</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {variants.map((v) => (
                    <button key={v.value} onClick={() => update(selected, { content_json: { ...cur.content_json, variant: v.value } })}
                      className={`px-2 py-1.5 text-[11px] rounded border transition ${(cur.content_json.variant ?? variants[0].value) === v.value ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 区块间距（v3） */}
            <div className="mb-3 border rounded p-3 bg-gray-50/60">
              <span className="text-xs font-medium text-gray-500 block mb-2">区块间距</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-gray-400 block mb-1">上边距 (px)</span>
                  <input type="number" className="w-full border rounded px-2 py-1 text-sm" value={cur.content_json.paddingTop ?? ''}
                    onChange={(e) => update(selected, { content_json: { ...cur.content_json, paddingTop: e.target.value === '' ? undefined : Number(e.target.value) } })} placeholder="默认" />
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 block mb-1">下边距 (px)</span>
                  <input type="number" className="w-full border rounded px-2 py-1 text-sm" value={cur.content_json.paddingBottom ?? ''}
                    onChange={(e) => update(selected, { content_json: { ...cur.content_json, paddingBottom: e.target.value === '' ? undefined : Number(e.target.value) } })} placeholder="默认" />
                </div>
              </div>
            </div>

            {/* 字段表单（分组折叠） */}
            <SchemaForm
              grouped
              fields={schemaOf(cur.block_type).fields}
              value={cur.content_json}
              onChange={(v) => update(selected, { content_json: v })}
            />
          </>
        )}
      </div>

      {/* ======== 中：画布 ======== */}
      <div className="flex-1 bg-gray-200 flex flex-col min-w-0">
        {/* 顶栏 */}
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <button onClick={() => nav('/pages')} className="text-sm text-gray-500 hover:text-blue-600">‹ 返回页面</button>
          <div className="flex items-center gap-1.5">
            {/* 撤销/重做 */}
            <button onClick={undo} disabled={!canUndo} title="撤销 (Ctrl+Z)" className="px-2 py-1 border rounded text-xs disabled:opacity-30">↶ 撤销</button>
            <button onClick={redo} disabled={!canRedo} title="重做" className="px-2 py-1 border rounded text-xs disabled:opacity-30">↷ 重做</button>
          </div>
          {/* 设备切换 */}
          <div className="flex gap-1.5">
            <button onClick={() => setDevice('desktop')} className={`px-3 py-1 text-xs rounded ${device === 'desktop' ? 'bg-blue-600 text-white' : 'border bg-white'}`}>桌面</button>
            <button onClick={() => setDevice('tablet')} className={`px-3 py-1 text-xs rounded ${device === 'tablet' ? 'bg-blue-600 text-white' : 'border bg-white'}`}>平板 768</button>
            <button onClick={() => setDevice('mobile')} className={`px-3 py-1 text-xs rounded ${device === 'mobile' ? 'bg-blue-600 text-white' : 'border bg-white'}`}>手机 375</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => save(false)} disabled={saving === 'saving'} className="px-3 py-1 border rounded text-sm bg-white disabled:opacity-50">
              {saving === 'saving' ? '保存中…' : saving === 'saved' ? '已保存 ✓' : '存草稿'}
            </button>
            <button onClick={() => save(true)} disabled={saving === 'saving'} className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50">发布</button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-auto flex justify-center items-start">
          <iframe
            title="preview"
            srcDoc={previewHtml}
            style={{
              width: deviceWidth,
              maxWidth: '100%',
              height: '100%',
              minHeight: 480,
              border: 'none',
              borderRadius: 12,
              background: '#fff',
              boxShadow: '0 4px 24px rgba(15,23,42,.14)',
              transition: 'width .25s',
            }}
          />
        </div>
      </div>
    </div>
  );
}
