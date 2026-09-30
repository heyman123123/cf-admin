/**
 * 根据 block_type 渲染不同的前台组件（v3 商业化）。
 * 数据字段与后台 schema（apps/admin/src/lib/blocks.ts）保持一致。
 * v3 新增：variant 变体渲染 + paddingTop/paddingBottom 区块间距。
 * 兼容旧数据：cta → primaryCta，cta_secondary → secondaryCta。
 */
import type { PageBlock } from '@cf-admin/db';

interface BlockData {
  badge?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  image?: string;
  align?: 'left' | 'center';
  bg?: 'default' | 'soft' | 'dark' | 'gradient' | 'light';
  columns?: string | number;
  variant?: string;
  paddingTop?: number;
  paddingBottom?: number;
  bullets?: { icon?: string; title: string; desc: string }[];
  plans?: { name: string; price: string; period?: string; features: string[]; featured?: boolean; cta?: string }[];
  testimonials?: { quote: string; author: string; role: string }[];
  stats?: { num: string; label: string }[];
  faqs?: { q: string; a: string }[];
  logos?: { name: string }[] | string[];
  team?: { name: string; role: string; bio?: string; avatar?: string }[];
  posts?: { title: string; excerpt?: string; date?: string; image?: string; href?: string }[];
  video?: { url?: string; embed?: string; poster?: string };
  form?: { submit_label?: string; note?: string };
  ctas?: { text: string; href: string }[];
  primaryCta?: { text: string; href: string };
  secondaryCta?: { text: string; href: string };
  cta?: { text: string; href: string };
  cta_secondary?: { text: string; href: string };
  height?: 'sm' | 'md' | 'lg';
}

function parse(b: PageBlock): BlockData {
  let d: BlockData = {};
  try { d = JSON.parse(b.content_json) as BlockData; } catch { /* ignore */ }
  // v3.3：按钮数组化兼容迁移（旧 primaryCta/secondaryCta/cta → ctas）
  if (!Array.isArray(d.ctas)) {
    const old = [d.primaryCta ?? d.cta, d.secondaryCta ?? d.cta_secondary].filter((c) => c && typeof c === 'object' && c.text);
    if (old.length) d.ctas = old as { text: string; href: string }[];
  }
  return d;
}

function bgClass(bg?: string): string {
  if (bg === 'dark') return 'section section--dark';
  if (bg === 'soft') return 'section section--soft';
  return 'section';
}

function cols(n?: string | number): string {
  const v = Number(n ?? 3);
  if (v <= 2) return 'grid grid-2';
  if (v >= 4) return 'grid grid-4';
  return 'grid grid-3';
}

/** v3：区块间距（px）注入 section style */
function secStyle(d: BlockData, extra?: Record<string, string>) {
  const style: Record<string, string> = { ...(extra ?? {}) };
  if (d.paddingTop) style['paddingTop'] = `${d.paddingTop}px`;
  if (d.paddingBottom) style['paddingBottom'] = `${d.paddingBottom}px`;
  return Object.keys(style).length ? style : undefined;
}

export function BlockRenderer({ block }: { block: PageBlock }) {
  const d = parse(block);

  switch (block.block_type) {
    case 'hero': {
      const v = d.variant ?? 'gradient';
      const heroBg = v === 'dark' ? 'hero--dark' : v === 'light' ? 'hero--light' : v === 'image' ? 'hero--image' : 'hero--gradient';
      const align = d.align === 'left' ? 'hero--left' : 'hero--center';
      const bgStyle = v === 'image' && d.image
        ? { backgroundImage: `linear-gradient(rgba(2,6,23,.62),rgba(2,6,23,.72)),url('${d.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : undefined;
      return (
        <section class={`hero ${heroBg} ${align}`} style={secStyle(d, bgStyle)}>
          <div class="container">
            {d.badge && <span class="eyebrow hero-badge">{d.badge}</span>}
            {d.title && <h1 class="h1">{d.title}</h1>}
            {d.subtitle && <p class="lead">{d.subtitle}</p>}
            {(d.ctas?.length ?? 0) > 0 && (
              <div class="btn-row">
                {d.ctas!.map((c, i) => (
                  <a class={`btn btn--lg ${i === 0 ? 'btn--primary' : 'btn--ghost'}`} href={c.href ?? '#'} key={i}>{c.text}</a>
                ))}
              </div>
            )}
            {v !== 'image' && d.image && <img class="hero-img" src={d.image} alt={d.title ?? ''} />}
          </div>
        </section>
      );
    }

    case 'logo_cloud': {
      const v = d.variant ?? 'row';
      return (
        <section class={bgClass(d.bg)} style={secStyle(d)}>
          <div class="container">
            {d.title && <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>}
            <div class={`logo-cloud${v === 'grid' ? ' logo-cloud--grid' : ''}`}>
              {(d.logos ?? []).map((l, i) => (
                <span class="logo-item" key={i}>{typeof l === 'string' ? l : l.name}</span>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case 'features': {
      const v = d.variant ?? 'icon';
      const bullets = (d.bullets ?? []).filter((f) => f && f.title);
      return (
        <section class="section section--soft" style={secStyle(d)}>
          <div class="container">
            {d.title && <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>}
            {d.subtitle && <p class="lead" style={{ textAlign: 'center' }}>{d.subtitle}</p>}
            {bullets.length > 0 && (
              <div class={cols(d.columns)} style={{ marginTop: 48 }}>
                {bullets.map((f, i) => (
                  <div class={`card${v === 'number' ? ' card--num' : ''}`} key={i}>
                    {v === 'number'
                      ? <div class="feature-num">{String(i + 1).padStart(2, '0')}</div>
                      : f.icon && <div class="card--icon">{f.icon}</div>}
                    <h3>{f.title}</h3>
                    {f.desc && <p>{f.desc}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    case 'stats': {
      const v = d.variant ?? 'dark';
      const secCls = v === 'light' ? 'section section--soft' : v === 'line' ? 'section' : 'section section--dark';
      const stats = (d.stats ?? []).filter((s) => s && s.num);
      return (
        <section class={secCls} style={secStyle(d)}>
          <div class="container">
            {d.title && <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>}
            {stats.length > 0 && (
              <div class={`stats${v === 'line' ? ' stats--line' : ''}`} style={{ marginTop: 40 }}>
                {stats.map((s, i) => (
                  <div key={i}>
                    <div class="stat-num">{s.num}</div>
                    {s.label && <div class="stat-label">{s.label}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    case 'pricing_table': {
      const v = d.variant ?? 'three';
      const colCls = v === 'two' ? 'grid grid-2' : v === 'four' ? 'grid grid-4' : 'grid grid-3';
      const plans = (d.plans ?? []).filter((p) => p && p.name);
      return (
        <section class={bgClass(d.bg)} style={secStyle(d)}>
          <div class="container">
            {d.title && <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>}
            {d.subtitle && <p class="lead" style={{ textAlign: 'center' }}>{d.subtitle}</p>}
            {plans.length > 0 && (
              <div class={colCls} style={{ marginTop: 56, alignItems: 'stretch' }}>
                {plans.map((p, i) => (
                  <div class={`pricing-card ${p.featured ? 'pricing-card--featured' : ''}`} key={i}>
                    {p.featured && <span class="pricing-tag">最受欢迎</span>}
                    <div class="pricing-name">{p.name}</div>
                    <div class="pricing-price">
                      {p.price} {p.period && <small>{p.period}</small>}
                    </div>
                    <ul class="pricing-features">
                      {(Array.isArray(p.features) ? p.features : String(p.features ?? '').split('\n').filter(Boolean)).map((f, j) => (
                        <li key={j}>{f}</li>
                      ))}
                    </ul>
                    {p.cta && <a href={d.ctas?.[0]?.href ?? '#'} class="btn btn--primary">{p.cta}</a>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    case 'testimonials': {
      const v = d.variant ?? 'grid';
      const items = (d.testimonials ?? []).filter((t) => t && t.quote);
      return (
        <section class={v === 'single' ? 'section section--soft' : bgClass(d.bg)} style={secStyle(d)}>
          <div class="container">
            {d.title && <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>}
            {items.length > 0 && (
              <div class={v === 'single' ? 'testimonial-single' : 'grid grid-3'} style={{ marginTop: 48 }}>
                {items.map((t, i) => (
                  <div class="testimonial" key={i}>
                    <div class="testimonial-stars">★★★★★</div>
                    <p class="testimonial-quote">"{t.quote}"</p>
                    {t.author && (
                      <div class="testimonial-author">
                        <div class="testimonial-avatar">{t.author?.[0] ?? '?'}</div>
                        <div>
                          <div class="testimonial-name">{t.author}</div>
                          {t.role && <div class="testimonial-role">{t.role}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    case 'faq': {
      const v = d.variant ?? 'single';
      const faqs = (d.faqs ?? []).filter((f) => f && f.q);
      return (
        <section class={bgClass(d.bg)} style={secStyle(d)}>
          <div class="container" style={{ maxWidth: v === 'two' ? 1000 : 800 }}>
            {d.title && <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>}
            {faqs.length > 0 && (
              <div class={v === 'two' ? 'faq-grid-2' : ''} style={{ marginTop: 40 }}>
                {faqs.map((f, i) => (
                  <details class="faq-item" key={i}>
                    <summary class="faq-q">{f.q} <span>+</span></summary>
                    {f.a && <div class="faq-a">{f.a}</div>}
                  </details>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    case 'team': {
      const v = d.variant ?? 'four';
      const team = (d.team ?? []).filter((t) => t && t.name);
      return (
        <section class="section section--soft" style={secStyle(d)}>
          <div class="container">
            {d.title && <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>}
            {d.subtitle && <p class="lead" style={{ textAlign: 'center' }}>{d.subtitle}</p>}
            {team.length > 0 && (
              <div class={`grid ${v === 'two' ? 'grid-2' : 'grid-4'}`} style={{ marginTop: 48 }}>
                {team.map((t, i) => (
                  <div class={`team-card${v === 'two' ? ' team-card--lg' : ''}`} key={i}>
                    <div class="team-avatar">
                      {t.avatar ? <img src={t.avatar} alt={t.name} /> : <span>{t.name?.[0] ?? '?'}</span>}
                    </div>
                    <div class="team-name">{t.name}</div>
                    {t.role && <div class="team-role">{t.role}</div>}
                    {t.bio && <div class="team-bio">{t.bio}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    case 'blog_list': {
      const v = d.variant ?? 'grid';
      const posts = (d.posts ?? []).filter((p) => p && p.title);
      return (
        <section class={bgClass(d.bg)} style={secStyle(d)}>
          <div class="container">
            {d.title && <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>}
            {posts.length > 0 && (
              <div class={`grid ${v === 'feature' ? 'grid-2' : 'grid-3'}`} style={{ marginTop: 48 }}>
                {posts.map((p, i) => (
                  <a class={`post-card${v === 'feature' && i === 0 ? ' post-card--feature' : ''}`} href={p.href ?? '#'} key={i}>
                    {p.image
                      ? <img src={p.image} alt={p.title} class={`post-img${v === 'feature' && i === 0 ? ' post-img--lg' : ''}`} />
                      : <div class="post-noimg" />}
                    {p.date && <div class="post-meta">{p.date}</div>}
                    <h3 class="post-title">{p.title}</h3>
                    {p.excerpt && <p class="post-excerpt">{p.excerpt}</p>}
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    case 'video_embed': {
      const v = d.variant ?? 'boxed';
      return (
        <section class={bgClass(d.bg)} style={secStyle(d)}>
          <div class="container">
            {d.title && <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>}
            <div class={`video-wrap${v === 'full' ? ' video-wrap--full' : ''}`} style={{ marginTop: 40 }}>
              {d.video?.embed ? (
                <div class="video-frame" innerHTML={d.video.embed} />
              ) : d.video?.url ? (
                <video controls poster={d.video.poster} src={d.video.url} class="video-el" />
              ) : (
                <div class="video-placeholder">视频占位</div>
              )}
            </div>
          </div>
        </section>
      );
    }

    case 'contact_form': {
      const v = d.variant ?? 'center';
      return (
        <section class="section section--soft" style={secStyle(d)}>
          <div class="container">
            {d.title && <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>}
            {d.subtitle && <p class="lead" style={{ textAlign: 'center' }}>{d.subtitle}</p>}
            <form class={`contact-form${v === 'split' ? ' contact-form--split' : ''}`} action="/api/public/submit-form" method="POST" style={{ marginTop: 40 }}>
              {v === 'split' && (
                <div class="contact-left">
                  <h3>{d.leftTitle ?? d.title}</h3>
                  <p>{d.leftText ?? d.subtitle}</p>
                </div>
              )}
              <div class="contact-fields">
                <div class="field">
                  <input name="name" placeholder="您的称呼" required />
                  <input name="email" type="email" placeholder="邮箱" required />
                </div>
                <input name="company" placeholder="公司名称（选填）" />
                <textarea name="message" placeholder="想了解什么？"></textarea>
                <button type="submit" class="btn btn--primary">{d.form?.submit_label ?? '提交咨询'}</button>
              </div>
            </form>
            {d.form?.note && <p class="contact-note">{d.form.note}</p>}
          </div>
        </section>
      );
    }

    case 'cta_band': {
      const v = d.variant ?? 'gradient';
      const bgStyle = v === 'image' && d.image
        ? { backgroundImage: `linear-gradient(rgba(2,6,23,.6),rgba(2,6,23,.6)),url('${d.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : v === 'dark' ? { background: 'linear-gradient(135deg,#0f172a,#1e293b)' } : undefined;
      const ctas = (d.ctas ?? []).filter((c) => c && c.text);
      return (
        <section class="section" style={secStyle(d)}>
          <div class="container">
            <div class={`cta-band${v === 'dark' ? ' cta-band--dark' : ''}`} style={bgStyle}>
              {d.cta_icon && <div class="cta-icon">{d.cta_icon}</div>}
              {d.title && <h2 class="h2">{d.title}</h2>}
              {d.subtitle && <p class="lead">{d.subtitle}</p>}
              {ctas.length > 0 && (
                <div class="btn-row">
                  {ctas.map((c, i) => (
                    <a class="btn btn--lg" href={c.href ?? '#'} key={i}>{c.text}</a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    case 'divider': {
      const v = d.variant ?? 'solid';
      return <hr class={`divider divider--${v}`} style={{ margin: d.height === 'lg' ? '48px 0' : '24px 0' }} />;
    }

    case 'spacer':
      return <div class={`spacer${d.height === 'lg' ? ' spacer--lg' : d.height === 'sm' ? ' spacer--sm' : ''}`} />;

    case 'rich_text':
    default: {
      const v = d.variant ?? 'left';
      return (
        <section class={bgClass(d.bg)} style={secStyle(d)}>
          <div class="container">
            <div class={`rich-content${v === 'center' ? ' rich-content--center' : ''}`}>
              {d.title && <h2 class="h2">{d.title}</h2>}
              <div innerHTML={d.body ?? ''} />
            </div>
          </div>
        </section>
      );
    }
  }
}
