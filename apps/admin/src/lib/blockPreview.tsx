/**
 * 预览渲染（与 API BlockRenderer 对齐，含 v3 变体 + v3.5 Header/Footer 布局）。
 * v3.5：从 BlockEditor.tsx 拆出，供画布 iframe 与组件库缩略图复用。
 */
import { PREVIEW_CSS } from './blockPreviewCss';

export type BlockData = Record<string, any>;
export type Draft = { block_type: string; sort_order: number; content_json: BlockData };

/* ================= 区块类型 → 图标/色相 ================= */

export const BLOCK_META: Record<string, { icon: string; tint: string }> = {
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
  header_nav: { icon: '🧭', tint: 'from-slate-600 to-slate-900' },
  site_footer: { icon: '🦶', tint: 'from-slate-700 to-slate-900' },
};
export const metaOf = (type: string) => BLOCK_META[type] ?? { icon: '🧩', tint: 'from-blue-500 to-indigo-500' };

/** 主题变量 → CSS :root 覆盖行（追加在 PREVIEW_CSS 之后即生效） */
export function themeCssLine(theme: Record<string, string>): string {
  const vars = { ...DEFAULT_THEME_VARS, ...theme };
  return Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join('');
}

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

export const DEFAULT_THEME_VARS: Record<string, string> = {
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

/** 通用区块样式注入（v3.5：间距 + 背景 + CSS 变量覆盖） */
function secStyleStr(d: BlockData, extra = ''): string {
  const parts: string[] = [];
  if (d.paddingTop) parts.push(`padding-top:${d.paddingTop}px`);
  if (d.paddingBottom) parts.push(`padding-bottom:${d.paddingBottom}px`);
  if (d.bgColor) parts.push(`background-color:${d.bgColor}`);
  if (d.textColor) parts.push(`--c-text:${d.textColor};--c-text-muted:color-mix(in srgb, ${d.textColor} 72%, transparent)`);
  if (d.radius) parts.push(`--c-radius:${d.radius}px`);
  if (d.maxWidth) parts.push(`--c-container:${d.maxWidth}px`);
  if (parts.length || extra) return `style="${parts.join(';')}${extra ? (parts.length ? ';' : '') + extra : ''}"`;
  return '';
}

/** Footer 多列 links 文本行解析："文字|链接" 每行一个 */
function parseLinks(text?: string): { label: string; href: string }[] {
  return String(text ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [label, href] = s.split('|').map((x) => x.trim());
      return { label: label || s, href: href || '#' };
    });
}

/** v3.8：按配置输出按钮 class（兼容旧数据：无 style 时按位置 primary/ghost） */
function btnCls(c: any, i?: number): string {
  const s = c?.style;
  if (s === 'ghost') return 'btn btn--ghost';
  if (s === 'outline') return 'btn btn--outline';
  if (s === 'white') return 'btn btn--white';
  if (s === 'primary') return 'btn btn--primary';
  return i === undefined || i === 0 ? 'btn btn--primary' : 'btn btn--ghost';
}

export function renderBlockPreview(b: Draft): string {
  const d = b.content_json;
  const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  switch (b.block_type) {
    /* ============ Header 导航栏（v3.5 · 全局布局 · sticky） ============ */
    case 'header_nav': {
      const v = d.variant ?? 'split';
      const links = (d.links ?? []).filter((l: any) => l && l.label);
      const ctas = (Array.isArray(d.ctas) ? d.ctas : []).filter((c: any) => c && c.text);
      const sticky = d.sticky !== false;
      return `<header class="site-header site-header--${v}" ${sticky ? '' : 'style="position:static"'} ${secStyleStr(d)}><div class="site-header-inner">
        <a class="site-logo" href="/">${d.logoImage ? `<img src="${esc(d.logoImage)}" alt="${esc(d.logo)}">` : esc(d.logo || 'LOGO')}</a>
        ${links.length ? `<nav class="site-nav">${links.map((l: any) => `<a href="${esc(l.href || '#')}">${esc(l.label)}</a>`).join('')}</nav>` : ''}
        ${ctas.length ? `<div class="site-header-cta">${ctas.map((c: any, i: number) => `<a class="${btnCls(c, i)}">${esc(c.text)}</a>`).join('')}</div>` : ''}
      </div></header>`;
    }

    /* ============ Footer 页脚（v3.5 · 全局布局 · 多列） ============ */
    case 'site_footer': {
      const v = d.variant ?? 'multi';
      const cols = (d.columns ?? []).filter((c: any) => c && c.heading);
      const socials = (d.socials ?? []).filter((s: any) => s && s.href);
      return `<footer class="site-footer site-footer--${v}" ${secStyleStr(d)}><div class="site-footer-inner">
        <div class="site-footer-grid">
          <div class="site-footer-col">
            ${d.logo ? `<div class="site-footer-brand">${esc(d.logo)}</div>` : ''}
            ${d.description ? `<p class="site-footer-desc">${esc(d.description)}</p>` : ''}
            ${socials.length ? `<div class="site-footer-social">${socials.map((s: any) => `<a href="${esc(s.href)}">${esc(s.icon || '·')}</a>`).join('')}</div>` : ''}
          </div>
          ${cols.map((c: any) => {
            const ls = parseLinks(c.links_text);
            return `<div class="site-footer-col"><h4>${esc(c.heading)}</h4>${ls.length ? `<ul class="site-footer-links">${ls.map((l: any) => `<li><a class="site-footer-link" href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('')}</ul>` : ''}</div>`;
          }).join('')}
        </div>
        ${d.bottomText ? `<div class="site-footer-bottom">${esc(d.bottomText)}</div>` : ''}
      </div></footer>`;
    }

    /* ============ 原 16 个页面组件 ============ */
    case 'hero': {
      const v = d.variant ?? 'gradient';
      const heroBg = v === 'dark' ? 'hero--dark' : v === 'light' ? 'hero--light' : v === 'image' ? 'hero--image' : 'hero--gradient';
      const align = d.align === 'left' ? 'hero--left' : 'hero--center';
      const bgImg = v === 'image' && d.image ? `background-image:linear-gradient(rgba(2,6,23,.62),rgba(2,6,23,.72)),url('${esc(d.image)}');background-size:cover;background-position:center` : '';
      const ctas = (Array.isArray(d.ctas) ? d.ctas : [d.primaryCta, d.secondaryCta].filter((c: any) => c?.text)).filter((c: any) => c && c.text);
      return `<section class="hero ${heroBg} ${align}" ${secStyleStr(d, bgImg)}><div class="container">
        ${d.badge ? `<span class="eyebrow hero-badge">${esc(d.badge)}</span>` : ''}
        ${d.title ? `<h1 class="h1">${esc(d.title)}</h1>` : ''}
        ${d.subtitle ? `<p class="lead">${esc(d.subtitle)}</p>` : ''}
        ${ctas.length ? `<div class="btn-row">${ctas.map((c: any, i: number) => `<a class="${btnCls(c, i)} btn--lg">${esc(c.text)}</a>`).join('')}</div>` : ''}
        ${v !== 'image' && d.image ? `<img class="hero-img" src="${esc(d.image)}" style="max-width:800px;margin:48px auto 0">` : ''}
      </div></section>`;
    }
    case 'logo_cloud': {
      const v = d.variant ?? 'row';
      const logos = (d.logos ?? []).filter((l: any) => l && (typeof l === 'string' ? l.trim() : l.name));
      return `<section class="section" ${secStyleStr(d)}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${logos.length ? `<div class="logo-cloud ${v === 'grid' ? 'logo-cloud--grid' : ''}">${logos.map((l: any) => `<span class="logo-item">${esc(typeof l === 'string' ? l : l.name)}</span>`).join('')}</div>` : ''}</div></section>`;
    }
    case 'features': {
      const v = d.variant ?? 'icon';
      const bullets = (d.bullets ?? []).filter((f: any) => f && f.title);
      return `<section class="section section--soft" ${secStyleStr(d)}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead" style="text-align:center">${esc(d.subtitle)}</p>` : ''}${bullets.length ? `<div class="grid grid-3">${bullets.map((f: any, i: number) => `<div class="card${v === 'number' ? ' card--num' : ''}">${v === 'number' ? `<div class="feature-num">${String(i + 1).padStart(2, '0')}</div>` : f.icon ? `<div class="card--icon">${esc(f.icon)}</div>` : ''}<h3>${esc(f.title)}</h3>${f.desc ? `<p>${esc(f.desc)}</p>` : ''}</div>`).join('')}</div>` : ''}</div></section>`;
    }
    case 'stats': {
      const v = d.variant ?? 'dark';
      const stats = (d.stats ?? []).filter((s: any) => s && s.num);
      return `<section class="section ${v === 'light' ? 'section--soft' : v === 'line' ? '' : 'section--dark'}" ${secStyleStr(d)}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${stats.length ? `<div class="stats${v === 'line' ? ' stats--line' : ''}">${stats.map((s: any) => `<div><div class="stat-num">${esc(s.num)}</div>${s.label ? `<div class="stat-label">${esc(s.label)}</div>` : ''}</div>`).join('')}</div>` : ''}</div></section>`;
    }
    case 'pricing_table': {
      const v = d.variant ?? 'three';
      const colCls = v === 'two' ? 'grid grid-2' : v === 'four' ? 'grid grid-4' : 'grid grid-3';
      const plans = (d.plans ?? []).filter((p: any) => p && p.name);
      return `<section class="section" ${secStyleStr(d)}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead" style="text-align:center">${esc(d.subtitle)}</p>` : ''}${plans.length ? `<div class="${colCls}" style="margin-top:48px;align-items:stretch">${plans.map((p: any) => {
        const fl = Array.isArray(p.features) ? p.features : String(p.features ?? '').split('\n').filter(Boolean);
        return `<div class="pricing-card ${p.featured ? 'pricing-card--featured' : ''}">${p.featured ? `<span class="pricing-tag">最受欢迎</span>` : ''}<div class="pricing-name">${esc(p.name)}</div><div class="pricing-price">${esc(p.price)} ${p.period ? `<small>${esc(p.period)}</small>` : ''}</div>${fl.length ? `<ul class="pricing-features">${fl.map((f: string) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}${p.cta ? `<a class="${btnCls(p)}">${esc(p.cta)}</a>` : ''}</div>`;
      }).join('')}</div>` : ''}</div></section>`;
    }
    case 'testimonials': {
      const v = d.variant ?? 'grid';
      const items = (d.testimonials ?? []).filter((t: any) => t && t.quote);
      return `<section class="section ${v === 'single' ? 'section--soft' : ''}" ${secStyleStr(d)}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${items.length ? `<div class="${v === 'single' ? 'testimonial-single' : 'grid grid-3'}">${items.map((t: any) => `<div class="testimonial"><div class="testimonial-stars">★★★★★</div><p class="testimonial-quote">"${esc(t.quote)}"</p>${t.author ? `<div class="testimonial-author"><div class="testimonial-avatar">${esc(t.author[0] ?? '?')}</div><div><div class="testimonial-name">${esc(t.author)}</div>${t.role ? `<div class="testimonial-role">${esc(t.role)}</div>` : ''}</div></div>` : ''}</div>`).join('')}</div>` : ''}</div></section>`;
    }
    case 'faq': {
      const v = d.variant ?? 'single';
      const faqs = (d.faqs ?? []).filter((f: any) => f && f.q);
      return `<section class="section" ${secStyleStr(d)}><div class="container" style="max-width:${v === 'two' ? 1000 : 800}px">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${faqs.length ? `<div class="${v === 'two' ? 'faq-grid-2' : ''}">${faqs.map((f: any) => `<details class="faq-item" open><summary class="faq-q">${esc(f.q)} <span>+</span></summary>${f.a ? `<div class="faq-a">${esc(f.a)}</div>` : ''}</details>`).join('')}</div>` : ''}</div></section>`;
    }
    case 'team': {
      const v = d.variant ?? 'four';
      const team = (d.team ?? []).filter((t: any) => t && t.name);
      return `<section class="section section--soft" ${secStyleStr(d)}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead" style="text-align:center">${esc(d.subtitle)}</p>` : ''}${team.length ? `<div class="grid ${v === 'two' ? 'grid-2' : 'grid-4'}">${team.map((t: any) => `<div class="team-card${v === 'two' ? ' team-card--lg' : ''}"><div class="team-avatar">${t.avatar ? `<img src="${esc(t.avatar)}">` : `<span>${esc(t.name[0] ?? '?')}</span>`}</div><div class="team-name">${esc(t.name)}</div>${t.role ? `<div class="team-role">${esc(t.role)}</div>` : ''}${t.bio ? `<div class="team-bio">${esc(t.bio)}</div>` : ''}</div>`).join('')}</div>` : ''}</div></section>`;
    }
    case 'blog_list': {
      const v = d.variant ?? 'grid';
      const posts = (d.posts ?? []).filter((p: any) => p && p.title);
      return `<section class="section" ${secStyleStr(d)}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${posts.length ? `<div class="grid ${v === 'feature' ? 'grid-2' : 'grid-3'}">${posts.map((p: any, i: number) => `<div class="post-card${v === 'feature' && i === 0 ? ' post-card--feature' : ''}">${p.image ? `<img class="post-img${v === 'feature' && i === 0 ? ' post-img--lg' : ''}" src="${esc(p.image)}">` : `<div class="post-noimg"></div>`}${p.date ? `<div class="post-meta">${esc(p.date)}</div>` : ''}<h3 class="post-title">${esc(p.title)}</h3>${p.excerpt ? `<p class="post-excerpt">${esc(p.excerpt)}</p>` : ''}</div>`).join('')}</div>` : ''}</div></section>`;
    }
    case 'video_embed': {
      const v = d.variant ?? 'boxed';
      return `<section class="section" ${secStyleStr(d)}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}<div class="video-wrap${v === 'full' ? ' video-wrap--full' : ''}"><div class="video-placeholder">视频嵌入区</div></div></div></section>`;
    }
    case 'cta_band': {
      const v = d.variant ?? 'gradient';
      const bgImg = v === 'image' && d.image ? `background-image:linear-gradient(rgba(2,6,23,.6),rgba(2,6,23,.6)),url('${esc(d.image)}');background-size:cover;background-position:center` : v === 'dark' ? 'background:linear-gradient(135deg,#0f172a,#1e293b)' : '';
      const ctas = (Array.isArray(d.ctas) ? d.ctas : d.cta ? [d.cta] : []).filter((c: any) => c && c.text);
      return `<section class="section" ${secStyleStr(d)}><div class="container"><div class="cta-band${v === 'dark' ? ' cta-band--dark' : ''}" ${secStyleStr(d, bgImg)}>${d.cta_icon ? `<div class="cta-icon">${esc(d.cta_icon)}</div>` : ''}${d.title ? `<h2 class="h2">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead">${esc(d.subtitle)}</p>` : ''}${ctas.length ? `<div class="btn-row">${ctas.map((c: any) => `<a class="${btnCls(c)} btn--lg">${esc(c.text)}</a>`).join('')}</div>` : ''}</div></div></section>`;
    }
    case 'contact_form': {
      const v = d.variant ?? 'center';
      const inner = `<div class="contact-form">${v === 'split' ? `<div class="contact-left">${d.leftTitle ? `<h3>${esc(d.leftTitle)}</h3>` : ''}${d.leftText ? `<p>${esc(d.leftText)}</p>` : ''}</div>` : ''}<div class="contact-fields"><div class="field"><input placeholder="您的称呼"><input placeholder="邮箱"></div><input placeholder="公司名称（选填）"><textarea placeholder="想了解什么？"></textarea><button class="btn btn--primary">${esc(d.form?.submit_label ?? '提交咨询')}</button></div></div>`;
      return `<section class="section section--soft" ${secStyleStr(d)}><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead" style="text-align:center">${esc(d.subtitle)}</p>` : ''}${inner}${d.form?.note ? `<p class="contact-note">${esc(d.form.note)}</p>` : ''}</div></section>`;
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
      return `<section class="section" ${secStyleStr(d)}><div class="container"><div class="rich-content${v === 'center' ? ' rich-content--center' : ''}">${d.title ? `<h2 class="h2">${esc(d.title)}</h2>` : ''}<div>${d.body ?? ''}</div></div></div></section>`;
    }
  }
}
