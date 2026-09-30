/**
 * Block 可视化编辑器（v3 · Shopify Theme Editor 范式 · 商业化 UI）
 * 布局：深色顶栏(设备/撤销重做/存草稿/发布) + 左 Layers(拖拽/显隐/复制/删除/添加)
 *       + 中画布(点选即配 iframe，选中描边) + 右设置面板(变体/间距/SchemaForm 分组)
 */
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type BlockItem } from '../lib/api';
import { BLOCK_SCHEMAS, BLOCK_GROUPS, SCHEMA_MAP, migrateContent, getVariants, defaultVariant } from '../lib/blocks';
import { SchemaForm } from '../components/SchemaForm';

type BlockData = Record<string, any>;
type Draft = { block_type: string; sort_order: number; content_json: BlockData };

/* ================= 区块类型 → 图标/色相 ================= */

const BLOCK_META: Record<string, { icon: string; tint: string }> = {
  hero: { icon: '🛡️', tint: 'from-blue-500 to-indigo-500' },
  logo_cloud: { icon: '🏷️', tint: 'from-slate-500 to-gray-600' },
  features: { icon: '⚡', tint: 'from-amber-500 to-orange-500' },
  stats: { icon: '📊', tint: 'from-emerald-500 to-teal-500' },
  pricing_table: { icon: '💳', tint: 'from-violet-500 to-purple-500' },
  testimonials: { icon: '💬', tint: 'from-pink-500 to-rose-500' },
  faq: { icon: '❓', tint: 'from-sky-500 to-cyan-500' },
  cta_band: { icon: '🎯', tint: 'from-red-500 to-orange-500' },
  contact_form: { icon: '📬', tint: 'from-green-500 to-emerald-500' },
  team: { icon: '👥', tint: 'from-indigo-500 to-blue-500' },
  blog_list: { icon: '📰', tint: 'from-cyan-500 to-sky-500' },
  video_embed: { icon: '🎬', tint: 'from-fuchsia-500 to-pink-500' },
  rich_text: { icon: '📝', tint: 'from-gray-500 to-slate-500' },
  divider: { icon: '➖', tint: 'from-gray-400 to-gray-500' },
  spacer: { icon: '▭', tint: 'from-gray-300 to-gray-400' },
};
const metaOf = (type: string) => BLOCK_META[type] ?? { icon: '🧩', tint: 'from-blue-500 to-indigo-500' };

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
      const ctas = (Array.isArray(d.ctas) ? d.ctas : [d.primaryCta, d.secondaryCta].filter((c: any) => c?.text)).filter((c: any) => c && c.text);
      return `<section class="hero ${heroBg} ${align}" ${bgImg || secStyle()}><div class="container">
        ${d.badge ? `<span class="eyebrow hero-badge">${esc(d.badge)}</span>` : ''}
        ${d.title ? `<h1 class="h1">${esc(d.title)}</h1>` : ''}
        ${d.subtitle ? `<p class="lead">${esc(d.subtitle)}</p>` : ''}
        ${ctas.length ? `<div class="btn-row">${ctas.map((c: any, i: number) => `<a class="btn ${i === 0 ? 'btn--primary' : 'btn--ghost'} btn--lg">${esc(c.text)}</a>`).join('')}</div>` : ''}
        ${v !== 'image' && d.image ? `<img class="hero-img" src="${esc(d.image)}" style="max-width:800px;margin:48px auto 0">` : ''}
      </div></section>`;
    }
    case 'logo_cloud': {
      const v = d.variant ?? 'row';
      const logos = (d.logos ?? []).filter((l: any) => l && (typeof l === 'string' ? l.trim() : l.name));
      return `<section class="section" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${logos.length ? `<div class="logo-cloud ${v === 'grid' ? 'logo-cloud--grid' : ''}">${logos.map((l: any) => `<span class="logo-item">${esc(typeof l === 'string' ? l : l.name)}</span>`).join('')}</div>` : ''}</div></section>`;
    }
    case 'features': {
      const v = d.variant ?? 'icon';
      const bullets = (d.bullets ?? []).filter((f: any) => f && f.title);
      return `<section class="section section--soft" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead" style="text-align:center">${esc(d.subtitle)}</p>` : ''}${bullets.length ? `<div class="grid grid-3">${bullets.map((f: any, i: number) => `<div class="card${v === 'number' ? ' card--num' : ''}">${v === 'number' ? `<div class="feature-num">${String(i + 1).padStart(2, '0')}</div>` : f.icon ? `<div class="card--icon">${esc(f.icon)}</div>` : ''}<h3>${esc(f.title)}</h3>${f.desc ? `<p>${esc(f.desc)}</p>` : ''}</div>`).join('')}</div>` : ''}</div></section>`;
    }
    case 'stats': {
      const v = d.variant ?? 'dark';
      const stats = (d.stats ?? []).filter((s: any) => s && s.num);
      return `<section class="section ${v === 'light' ? 'section--soft' : v === 'line' ? '' : 'section--dark'}" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${stats.length ? `<div class="stats${v === 'line' ? ' stats--line' : ''}">${stats.map((s: any) => `<div><div class="stat-num">${esc(s.num)}</div>${s.label ? `<div class="stat-label">${esc(s.label)}</div>` : ''}</div>`).join('')}</div>` : ''}</div></section>`;
    }
    case 'pricing_table': {
      const v = d.variant ?? 'three';
      const colCls = v === 'two' ? 'grid grid-2' : v === 'four' ? 'grid grid-4' : 'grid grid-3';
      const plans = (d.plans ?? []).filter((p: any) => p && p.name);
      return `<section class="section" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead" style="text-align:center">${esc(d.subtitle)}</p>` : ''}${plans.length ? `<div class="${colCls}" style="margin-top:48px;align-items:stretch">${plans.map((p: any) => {
        const fl = Array.isArray(p.features) ? p.features : String(p.features ?? '').split('\n').filter(Boolean);
        return `<div class="pricing-card ${p.featured ? 'pricing-card--featured' : ''}">${p.featured ? `<span class="pricing-tag">最受欢迎</span>` : ''}<div class="pricing-name">${esc(p.name)}</div><div class="pricing-price">${esc(p.price)} ${p.period ? `<small>${esc(p.period)}</small>` : ''}</div>${fl.length ? `<ul class="pricing-features">${fl.map((f: string) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}${p.cta ? `<a class="btn btn--primary">${esc(p.cta)}</a>` : ''}</div>`;
      }).join('')}</div>` : ''}</div></section>`;
    }
    case 'testimonials': {
      const v = d.variant ?? 'grid';
      const items = (d.testimonials ?? []).filter((t: any) => t && t.quote);
      return `<section class="section ${v === 'single' ? 'section--soft' : ''}" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${items.length ? `<div class="${v === 'single' ? 'testimonial-single' : 'grid grid-3'}">${items.map((t: any) => `<div class="testimonial"><div class="testimonial-stars">★★★★★</div><p class="testimonial-quote">"${esc(t.quote)}"</p>${t.author ? `<div class="testimonial-author"><div class="testimonial-avatar">${esc(t.author[0] ?? '?')}</div><div><div class="testimonial-name">${esc(t.author)}</div>${t.role ? `<div class="testimonial-role">${esc(t.role)}</div>` : ''}</div></div>` : ''}</div>`).join('')}</div>` : ''}</div></section>`;
    }
    case 'faq': {
      const v = d.variant ?? 'single';
      const faqs = (d.faqs ?? []).filter((f: any) => f && f.q);
      return `<section class="section" ${secStyle()}><div class="container" style="max-width:${v === 'two' ? 1000 : 800}px">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${faqs.length ? `<div class="${v === 'two' ? 'faq-grid-2' : ''}">${faqs.map((f: any) => `<details class="faq-item" open><summary class="faq-q">${esc(f.q)} <span>+</span></summary>${f.a ? `<div class="faq-a">${esc(f.a)}</div>` : ''}</details>`).join('')}</div>` : ''}</div></section>`;
    }
    case 'team': {
      const v = d.variant ?? 'four';
      const team = (d.team ?? []).filter((t: any) => t && t.name);
      return `<section class="section section--soft" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead" style="text-align:center">${esc(d.subtitle)}</p>` : ''}${team.length ? `<div class="grid ${v === 'two' ? 'grid-2' : 'grid-4'}">${team.map((t: any) => `<div class="team-card${v === 'two' ? ' team-card--lg' : ''}"><div class="team-avatar">${t.avatar ? `<img src="${esc(t.avatar)}">` : `<span>${esc(t.name[0] ?? '?')}</span>`}</div><div class="team-name">${esc(t.name)}</div>${t.role ? `<div class="team-role">${esc(t.role)}</div>` : ''}${t.bio ? `<div class="team-bio">${esc(t.bio)}</div>` : ''}</div>`).join('')}</div>` : ''}</div></section>`;
    }
    case 'blog_list': {
      const v = d.variant ?? 'grid';
      const posts = (d.posts ?? []).filter((p: any) => p && p.title);
      return `<section class="section" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${posts.length ? `<div class="grid ${v === 'feature' ? 'grid-2' : 'grid-3'}">${posts.map((p: any, i: number) => `<div class="post-card${v === 'feature' && i === 0 ? ' post-card--feature' : ''}">${p.image ? `<img class="post-img${v === 'feature' && i === 0 ? ' post-img--lg' : ''}" src="${esc(p.image)}">` : `<div class="post-noimg"></div>`}${p.date ? `<div class="post-meta">${esc(p.date)}</div>` : ''}<h3 class="post-title">${esc(p.title)}</h3>${p.excerpt ? `<p class="post-excerpt">${esc(p.excerpt)}</p>` : ''}</div>`).join('')}</div>` : ''}</div></section>`;
    }
    case 'video_embed': {
      const v = d.variant ?? 'boxed';
      return `<section class="section" ${secStyle()}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}<div class="video-wrap${v === 'full' ? ' video-wrap--full' : ''}"><div class="video-placeholder">视频嵌入区</div></div></div></section>`;
    }
    case 'cta_band': {
      const v = d.variant ?? 'gradient';
      const bgImg = v === 'image' && d.image ? `style="background-image:linear-gradient(rgba(2,6,23,.6),rgba(2,6,23,.6)),url('${esc(d.image)}');background-size:cover;background-position:center"` : v === 'dark' ? 'style="background:linear-gradient(135deg,#0f172a,#1e293b)"' : '';
      const ctas = (Array.isArray(d.ctas) ? d.ctas : d.cta ? [d.cta] : []).filter((c: any) => c && c.text);
      return `<section class="section" ${secStyle()}><div class="container"><div class="cta-band${v === 'dark' ? ' cta-band--dark' : ''}" ${bgImg}>${d.cta_icon ? `<div class="cta-icon">${esc(d.cta_icon)}</div>` : ''}${d.title ? `<h2 class="h2">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead">${esc(d.subtitle)}</p>` : ''}${ctas.length ? `<div class="btn-row">${ctas.map((c: any) => `<a class="btn btn--lg">${esc(c.text)}</a>`).join('')}</div>` : ''}</div></div></section>`;
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

/* ================= 预览样式（v3：含全部变体 + 编辑器选中描边，与 API GLOBAL_CSS 对齐） ================= */

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
/* ---- 编辑器画布：点选描边 ---- */
.cf-block{position:relative;cursor:pointer;transition:outline-color .15s, box-shadow .15s}
.cf-block:hover{outline:1.5px dashed rgba(37,99,235,.55);outline-offset:3px}
.cf-selected{outline:2.5px solid #2563eb;outline-offset:3px;z-index:2}
.cf-selected::after{content:'选中 · 在右侧编辑';position:absolute;top:-30px;left:50%;transform:translateX(-50%);background:#2563eb;color:#fff;font-size:11px;font-weight:600;letter-spacing:.02em;padding:4px 12px;border-radius:999px;white-space:nowrap;box-shadow:0 4px 12px rgba(37,99,235,.35);z-index:10}
`;

/* ================= 样式与主题（tab 面板 · 与 API THEME_PRESETS 对齐） ================= */

const THEME_VAR_LABELS: Record<string, string> = {
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

const DEFAULT_THEME_VARS: Record<string, string> = {
  '--c-primary': '#2563eb',
  '--c-primary-hover': '#1d4ed8',
  '--c-accent': '#7c3aed',
  '--c-bg': '#ffffff',
  '--c-bg-soft': '#f8fafc',
  '--c-text': '#0f172a',
  '--c-text-muted': '#64748b',
  '--c-border': '#e2e8f0',
  '--c-radius': '16px',
};

/** 主题变量 → CSS :root 覆盖行（追加在 PREVIEW_CSS 之后即生效） */
function themeCssLine(theme: Record<string, string>): string {
  const vars = { ...DEFAULT_THEME_VARS, ...theme };
  return Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join('');
}

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

/* ================= 图标（内联 SVG） ================= */

const Icon = {
  back: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  undo: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>,
  redo: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/></svg>,
  desktop: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="12" x="3" y="4" rx="2"/><path d="M12 16v4M8 20h8"/></svg>,
  tablet: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M12 18h.01"/></svg>,
  phone: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="10" height="20" x="7" y="2" rx="2.5"/><path d="M11 18h2"/></svg>,
  eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 8 10 8a13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.39-1.61"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24M2 2l20 20"/></svg>,
  copy: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
  trash: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>,
  grip: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>,
  up: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>,
  down: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  plus: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
};

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
  const [layersOpen, setLayersOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'blocks' | 'theme'>('blocks');
  const [pop, setPop] = useState<{ i: number; pos: 'above' | 'below'; x: number; y: number } | null>(null);
  const [theme, setTheme] = useState<Record<string, string>>({});
  const [themePresets, setThemePresets] = useState<{ key: string; name: string; vars: Record<string, string> }[]>([]);
  const [themeSaved, setThemeSaved] = useState(false);

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

  // 加载主题（编辑器内「样式和主题」tab 使用）
  useEffect(() => {
    api.getTheme().then((r) => {
      setTheme(r.theme);
      setThemePresets(r.presets);
    }).catch(() => undefined);
  }, []);

  const applyPreset = (vars: Record<string, string>) => {
    setTheme(vars);
    setThemeSaved(false);
  };

  const saveTheme = async () => {
    try {
      await api.saveTheme(theme);
      setThemeSaved(true);
      setTimeout(() => setThemeSaved(false), 2000);
    } catch (e) {
      alert(String(e));
    }
  };

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

  // Ctrl+Z / Ctrl+Shift+Z 快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo]);

  const schemaOf = (type: string) => SCHEMA_MAP[type] ?? BLOCK_SCHEMAS[0];

  const update = (i: number, patch: Partial<Draft>) => {
    setBlocks((bs) => bs.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  };

  /** 打开组件库浮层：锚定左栏右边缘，垂直对齐触发按钮所在行 */
  const openPop = (e: ReactMouseEvent<HTMLButtonElement>, i: number, pos: 'above' | 'below') => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    const leftEdge = document.querySelector<HTMLElement>('.w-80')?.getBoundingClientRect().right;
    const x = (leftEdge ?? r.right) + 10;
    setPop({ i, pos, x, y: Math.max(8, r.top - 12) });
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

  /** 在指定位置插入组件（Popover 使用）：above → 插到 i，below → 插到 i+1 */
  const addBlockAt = (type: string, target: { i: number; pos: 'above' | 'below' }) => {
    const schema = SCHEMA_MAP[type];
    if (!schema) return;
    const at = Math.max(0, Math.min(target.i + (target.pos === 'above' ? 0 : 1), blocks.length));
    const block: Draft = { block_type: type, sort_order: at, content_json: { ...schema.defaults(), variant: defaultVariant(type) } };
    setBlocks((bs) => [...bs.slice(0, at), block, ...bs.slice(at)].map((b, idx) => ({ ...b, sort_order: idx })));
    setSelected(at);
    setPop(null);
    setQuery('');
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

  // 画布 HTML：可见区块按序渲染，选中区块带描边
  const previewHtml = useMemo(() => {
    const body = blocks
      .map((b, i) => (hidden.has(i) ? '' : `<div class="cf-block${i === selected ? ' cf-selected' : ''}" data-ix="${i}" onclick="event.stopPropagation();parent.postMessage({type:'cf-block-click',ix:${i}},'*')">${renderBlockPreview(b)}</div>`))
      .join('');
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${PREVIEW_CSS}:root{${themeCssLine(theme)}}</style></head><body style="margin:0">${body || '<div style="padding:80px;text-align:center;color:#94a3b8">空页面 · 从左侧添加区块</div>'}</body></html>`;
  }, [blocks, hidden, selected, theme]);

  const cur = blocks[selected];
  const variants = cur ? getVariants(cur.block_type) : [];
  const ql = query.trim().toLowerCase();
  const visibleSchemas = ql ? BLOCK_SCHEMAS.filter((s) => s.label.toLowerCase().includes(ql) || s.type.toLowerCase().includes(ql)) : BLOCK_SCHEMAS;
  const groupsWithSchemas = ql
    ? BLOCK_GROUPS.map((g) => ({ g, list: visibleSchemas.filter((s) => s.group === g) })).filter((x) => x.list.length > 0)
    : BLOCK_GROUPS.map((g) => ({ g, list: BLOCK_SCHEMAS.filter((s) => s.group === g) }));

  const deviceWidth = device === 'mobile' ? 375 : device === 'tablet' ? 768 : '100%';
  const deviceLabel = device === 'mobile' ? '375px' : device === 'tablet' ? '768px' : '自适应';

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden">
      {/* ======== 左：页面区块 / 样式和主题（tab 切换） ======== */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col min-w-0">
        {/* Tab 栏 */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-2 pt-2 gap-1">
          <button
            onClick={() => setTab('blocks')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[12.5px] font-semibold transition border border-b-0 ${tab === 'blocks' ? 'bg-white text-blue-700 border-slate-200 shadow-[0_-2px_6px_rgba(15,23,42,.04)]' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
            页面区块
            {tab === 'blocks' && blocks.length > 0 && <span className="text-[10px] font-bold text-blue-500 bg-blue-50 rounded-full px-1.5 py-px">{blocks.length}</span>}
          </button>
          <button
            onClick={() => setTab('theme')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[12.5px] font-semibold transition border border-b-0 ${tab === 'theme' ? 'bg-white text-blue-700 border-slate-200 shadow-[0_-2px_6px_rgba(15,23,42,.04)]' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.52-.67 1.67-1.33.17-.66-.08-1.17-.5-1.5-.4-.33-.83-1-.83-1.67a2 2 0 0 1 2-2h3.5c2.9 0 5.16-2.9 3.66-5.9C20.6 7.27 16.6 6 13.5 6c-.5 0-1.5-.5-1.5-1.5S13 2 12 2Z"/></svg>
            样式和主题
          </button>
        </div>

        {/* ---------- Tab：页面区块 ---------- */}
        {tab === 'blocks' && (
          <>
        <div className="px-4 py-3 border-b border-slate-200 bg-white">
          <button type="button" onClick={() => setLayersOpen((o) => !o)} className="w-full flex items-center justify-between group">
            <span className="flex items-center gap-2 text-[13px] font-bold text-slate-800 tracking-tight">
              页面区块
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{blocks.length}</span>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`text-slate-400 transition-transform duration-200 ${layersOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <p className="text-[11px] text-slate-400 mt-1">拖拽排序 · 点击选中 · hover 添加上/下区块</p>
        </div>

        {layersOpen && (
          <div className="flex-1 overflow-auto p-2.5 space-y-2 min-h-0">
            {blocks.map((b, i) => {
              const isHidden = hidden.has(i);
              const isDragOver = dragOver === i && dragFrom !== i;
              const active = i === selected;
              const meta = metaOf(b.block_type);
              return (
                <div key={i}>
                  {/* 上方添加（hover 浮现） */}
                  <div className="relative h-0 z-20 -mb-0.5">
                    <button
                      title="在上方添加区块"
                      onClick={(e) => openPop(e, i, 'above')}
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/30 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all flex items-center justify-center"
                      style={{ opacity: undefined }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
                    ><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14M12 5v14"/></svg></button>
                  </div>

                  <div
                    draggable
                    onDragStart={() => setDragFrom(i)}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                    onDragLeave={() => setDragOver((v) => (v === i ? null : v))}
                    onDrop={() => { if (dragFrom !== null) reorder(dragFrom, i); setDragFrom(null); setDragOver(null); }}
                    onDragEnd={() => { setDragFrom(null); setDragOver(null); }}
                    onClick={() => setSelected(i)}
                    className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] cursor-pointer border transition-all duration-150 ${isDragOver ? 'border-blue-400 bg-blue-50 shadow-inner' : active ? 'border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'} ${isHidden ? 'opacity-45' : ''}`}
                  >
                    <span className={`shrink-0 cursor-grab opacity-40 group-hover:opacity-100 ${active ? 'text-white' : 'text-slate-400'}`} title="拖拽排序">{Icon.grip}</span>
                    <span className={`w-7 h-7 rounded-md bg-gradient-to-br ${meta.tint} flex items-center justify-center text-[13px] shrink-0 shadow-sm ${active ? 'ring-1 ring-white/40' : ''}`}>{meta.icon}</span>
                    <span className="flex-1 truncate font-medium">{schemaOf(b.block_type).label}</span>
                    <button title={isHidden ? '显示' : '隐藏'} onClick={(e) => { e.stopPropagation(); toggleHidden(i); }}
                      className={`shrink-0 p-1 rounded transition ${active ? 'text-white/70 hover:text-white hover:bg-white/15' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>{isHidden ? Icon.eyeOff : Icon.eye}</button>
                    <button title="复制" onClick={(e) => { e.stopPropagation(); duplicate(i); }}
                      className={`shrink-0 p-1 rounded transition ${active ? 'text-white/70 hover:text-white hover:bg-white/15' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>{Icon.copy}</button>
                    <button title="删除" onClick={(e) => { e.stopPropagation(); remove(i); }}
                      className={`shrink-0 p-1 rounded transition ${active ? 'text-white/70 hover:text-white hover:bg-white/15' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}>{Icon.trash}</button>

                    {/* 下方添加（hover 浮现） */}
                    <button
                      title="在下方添加区块"
                      onClick={(e) => openPop(e, i, 'below')}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/30 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all flex items-center justify-center"
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
                    ><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14M12 5v14"/></svg></button>
                  </div>
                </div>
              );
            })}

            {/* 末尾添加（追加到末尾） */}
            {blocks.length > 0 && (
              <div className="pt-2 border-t border-dashed border-slate-200">
                <button
                  onClick={(e) => openPop(e, blocks.length, 'below')}
                  className="w-full py-2 rounded-lg border border-dashed border-slate-300 text-[12px] font-medium text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition flex items-center justify-center gap-1.5"
                ><span className="text-blue-500">{Icon.plus}</span>末尾添加区块</button>
              </div>
            )}

            {blocks.length === 0 && (
              <div className="text-center py-10 px-4">
                <div className="text-2xl mb-1">🧩</div>
                <p className="text-xs text-slate-400 mb-3">页面还没有区块</p>
                <button onClick={(e) => openPop(e, 0, 'below')}
                  className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/25 transition">
                  添加第一个区块
                </button>
              </div>
            )}
          </div>
        )}
          </>
        )}

        {/* ---------- Tab：样式和主题 ---------- */}
        {tab === 'theme' && (
          <div className="flex-1 overflow-auto p-3.5 min-h-0 space-y-5">
            {/* 保存栏 */}
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-slate-800 tracking-tight">样式和主题</h3>
              <button onClick={saveTheme}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition ${themeSaved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-md shadow-blue-600/20'}`}>
                {themeSaved ? '已保存 ✓' : '保存主题'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">主题为全局设置：保存后所有页面立即生效（旧缓存自动失效），画布实时预览。</p>

            {/* 潘通色卡预设 */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">潘通色卡预设</span>
              <div className="grid grid-cols-2 gap-2">
                {themePresets.map((p) => {
                  const active = Object.keys(p.vars).every((k) => theme[k] === p.vars[k]) && Object.keys(p.vars).length > 0;
                  return (
                    <button key={p.key} onClick={() => applyPreset(p.vars)}
                      className={`group text-left rounded-xl border p-2 transition-all ${active ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/60' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'}`}>
                      <span className="block h-8 rounded-lg mb-1.5 relative overflow-hidden"
                        style={{ background: `linear-gradient(120deg, ${p.vars['--c-primary'] ?? '#2563eb'}, ${p.vars['--c-accent'] ?? '#7c3aed'})` }}>
                        {active && <span className="absolute inset-0 flex items-center justify-center text-white bg-black/15">{Icon.check}</span>}
                      </span>
                      <span className="block text-[11px] font-semibold text-slate-700 truncate">{p.name}</span>
                      <span className="block text-[10px] text-slate-400 truncate mt-0.5">
                        {p.vars['--c-primary'] ?? ''} · {p.vars['--c-accent'] ?? ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 自定义变量 */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">自定义变量</span>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {Object.entries(THEME_VAR_LABELS).map(([k, label]) => {
                  const isColor = k.startsWith('--c-') && k !== '--c-radius';
                  return (
                    <div key={k} className="flex items-center gap-2.5 px-3 py-2.5">
                      <span className="w-16 shrink-0 text-[11px] text-slate-500">{label}</span>
                      {isColor && (
                        <input type="color" value={theme[k] ?? DEFAULT_THEME_VARS[k] ?? '#000000'}
                          onChange={(e) => setTheme((t) => ({ ...t, [k]: e.target.value }))}
                          className="w-8 h-7 rounded border border-slate-200 bg-white cursor-pointer shrink-0 p-0.5" />
                      )}
                      <input
                        value={theme[k] ?? DEFAULT_THEME_VARS[k] ?? ''}
                        onChange={(e) => setTheme((t) => ({ ...t, [k]: e.target.value }))}
                        className={`flex-1 min-w-0 border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition ${k === '--c-radius' ? '' : 'font-mono'}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======== 右：设置面板（order-2 → 视觉最右） ======== */}
      <div className="w-96 border-r border-slate-200 bg-white flex flex-col min-w-0 order-2">
        <div className="px-4 py-3.5 border-b border-slate-200 flex justify-between items-center shrink-0">
          <h3 className="text-[13px] font-bold text-slate-800 tracking-tight">区块设置</h3>
          {cur && (
            <div className="flex gap-1">
              <button onClick={() => move(selected, -1)} disabled={selected === 0} title="上移"
                className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition">{Icon.up}</button>
              <button onClick={() => move(selected, 1)} disabled={selected === blocks.length - 1} title="下移"
                className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition">{Icon.down}</button>
              <button onClick={() => duplicate(selected)} disabled={!cur} title="复制"
                className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 transition">{Icon.copy}</button>
              <button onClick={() => remove(selected)} disabled={!cur} title="删除"
                className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-red-400 hover:text-red-600 disabled:opacity-30 transition">{Icon.trash}</button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {cur ? (
            <>
              {/* 组件类型 */}
              <div className="mb-3.5">
                <span className="text-xs font-medium text-slate-600 block mb-1.5">组件类型</span>
                <div className="relative">
                  <select
                    value={cur.block_type}
                    onChange={(e) => changeType(selected, e.target.value)}
                    className="w-full border border-slate-200 rounded-lg bg-white px-2.5 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer"
                  >
                    {BLOCK_SCHEMAS.map((s) => <option key={s.type} value={s.type}>{s.label}</option>)}
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{Icon.down}</span>
                </div>
              </div>

              {/* 视觉变体 */}
              {variants.length > 0 && (
                <div className="mb-3.5">
                  <span className="text-xs font-medium text-slate-600 block mb-1.5">视觉变体</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {variants.map((v) => {
                      const on = (cur.content_json.variant ?? variants[0].value) === v.value;
                      return (
                        <button key={v.value} onClick={() => update(selected, { content_json: { ...cur.content_json, variant: v.value } })}
                          className={`flex items-center gap-1.5 px-2.5 py-2 text-[11px] rounded-lg border transition ${on ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-200' : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-slate-50'}`}>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${on ? 'bg-blue-500' : 'bg-slate-300'}`} />
                          <span className="flex-1 truncate text-left">{v.label}</span>
                          {on && <span className="text-blue-600 shrink-0">{Icon.check}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 区块间距 */}
              <div className="mb-4 border border-slate-200 rounded-xl p-3.5 bg-slate-50/70">
                <span className="text-xs font-semibold text-slate-700 block mb-2.5">区块间距</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">上边距 (px)</span>
                    <div className="relative">
                      <input type="number" className="w-full border border-slate-200 rounded-lg bg-white px-2.5 py-2 pr-8 text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        value={cur.content_json.paddingTop ?? ''}
                        onChange={(e) => update(selected, { content_json: { ...cur.content_json, paddingTop: e.target.value === '' ? undefined : Number(e.target.value) } })} placeholder="默认" />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">px</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">下边距 (px)</span>
                    <div className="relative">
                      <input type="number" className="w-full border border-slate-200 rounded-lg bg-white px-2.5 py-2 pr-8 text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        value={cur.content_json.paddingBottom ?? ''}
                        onChange={(e) => update(selected, { content_json: { ...cur.content_json, paddingBottom: e.target.value === '' ? undefined : Number(e.target.value) } })} placeholder="默认" />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">px</span>
                    </div>
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
          ) : (
            <div className="text-center py-16">
              <div className="text-3xl mb-3">👆</div>
              <p className="text-xs text-slate-400 leading-relaxed">点击左侧图层或画布中的区块<br />在这里配置它的内容与样式</p>
            </div>
          )}
        </div>
      </div>

      {/* ======== 中：画布（order-1 → 视觉中间） ======== */}
      <div className="flex-1 flex flex-col min-w-0 order-1">
        {/* 深色顶栏 */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          {/* 左：返回 + 标题 */}
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => nav('/pages')} className="flex items-center gap-1 text-[13px] text-slate-300 hover:text-white transition whitespace-nowrap">
              {Icon.back}<span>页面</span>
            </button>
            <span className="h-4 w-px bg-slate-700 shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[13px] font-semibold text-white truncate">页面编辑器</span>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${saving === 'saved' ? 'bg-emerald-500/15 text-emerald-400' : saving === 'saving' ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-700/60 text-slate-400'}`}>
                {saving === 'saved' ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />已保存</>
                  : saving === 'saving' ? <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />保存中</>
                  : <><span className="w-1.5 h-1.5 rounded-full bg-slate-500" />未保存</>}
              </span>
            </div>
          </div>

          {/* 中：撤销/重做 + 设备切换 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
              <button onClick={undo} disabled={!canUndo} title="撤销 (Ctrl+Z)"
                className="w-7 h-7 inline-flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300 transition">{Icon.undo}</button>
              <button onClick={redo} disabled={!canRedo} title="重做 (Ctrl+Shift+Z)"
                className="w-7 h-7 inline-flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300 transition">{Icon.redo}</button>
            </div>

            <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg p-0.5">
              {([
                ['desktop', Icon.desktop, '桌面'],
                ['tablet', Icon.tablet, '平板 768'],
                ['mobile', Icon.phone, '手机 375'],
              ] as const).map(([d, ic, tip]) => (
                <button key={d} onClick={() => setDevice(d)} title={tip}
                  className={`w-8 h-7 inline-flex items-center justify-center rounded-md transition ${device === d ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{ic}</button>
              ))}
            </div>
            <span className="hidden lg:inline text-[10px] text-slate-500 whitespace-nowrap w-12">{deviceLabel}</span>
          </div>

          {/* 右：保存/发布 */}
          <div className="flex items-center gap-2">
            <button onClick={() => save(false)} disabled={saving === 'saving'}
              className="px-3.5 py-1.5 rounded-lg border border-slate-600 text-[13px] font-medium text-slate-200 hover:border-slate-400 hover:text-white disabled:opacity-50 transition whitespace-nowrap">
              {saving === 'saving' ? '保存中…' : '存草稿'}
            </button>
            <button onClick={() => save(true)} disabled={saving === 'saving'}
              className="px-4 py-1.5 rounded-lg text-[13px] font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/25 disabled:opacity-50 transition whitespace-nowrap">
              发布
            </button>
          </div>
        </div>

        {/* 画布区：点阵背景 */}
        <div className="flex-1 p-4 overflow-auto flex justify-center items-start"
          style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundColor: '#eef2f7' }}>
          <iframe
            title="preview"
            srcDoc={previewHtml}
            style={{
              width: deviceWidth,
              maxWidth: '100%',
              height: '100%',
              minHeight: 520,
              border: 'none',
              borderRadius: 16,
              background: '#fff',
              boxShadow: device === 'mobile' ? '0 0 0 1px #e2e8f0, 0 24px 48px rgba(15,23,42,.18)' : '0 12px 40px rgba(15,23,42,.16)',
              transition: 'width .3s ease, box-shadow .3s ease',
            }}
          />
        </div>
      </div>

      {/* ======== 组件库 Popover（对应行右侧 fixed 浮层 + 遮罩） ======== */}
      {pop && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => { setPop(null); setQuery(''); }} />
          <div
            className="fixed z-40 w-[300px] max-h-[72vh] overflow-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_16px_48px_rgba(15,23,42,.22)]"
            style={{ left: Math.min(pop.x, window.innerWidth - 320), top: pop.y }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold text-slate-700">
                在{pop.pos === 'above' ? '上方' : '下方'}添加组件
                {pop.i >= blocks.length ? ' · 追加到末尾' : ''}
              </span>
              <button onClick={() => { setPop(null); setQuery(''); }} title="关闭"
                className="w-5 h-5 inline-flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">✕</button>
            </div>
            <div className="relative mb-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索组件…"
                className="w-full border border-slate-200 rounded-lg bg-slate-50 px-3 py-1.5 pr-8 text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {groupsWithSchemas.map(({ g, list }) => (
                <div key={g} className="contents">
                  {list.map((s) => {
                    const m = metaOf(s.type);
                    return (
                      <button key={s.type} onClick={() => addBlockAt(s.type, pop)}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm hover:-translate-y-px transition-all text-left col-span-2">
                        <span className={`w-5 h-5 rounded bg-gradient-to-br ${m.tint} flex items-center justify-center text-[10px] shrink-0`}>{m.icon}</span>
                        <span className="flex-1 truncate text-[11px] font-medium text-slate-600 hover:text-blue-700">{s.label}</span>
                        <span className="text-blue-400 shrink-0">{Icon.plus}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
              {visibleSchemas.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 col-span-2">没有匹配「{query}」的组件</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
