/**
 * 根据 block_type 渲染不同的前台组件（商业化版本）。
 * 数据字段与后台 schema（apps/admin/src/lib/blocks.ts）保持一致。
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
  primaryCta?: { text: string; href: string };
  secondaryCta?: { text: string; href: string };
  cta?: { text: string; href: string };
  cta_secondary?: { text: string; href: string };
  height?: 'sm' | 'md' | 'lg';
}

function parse(b: PageBlock): BlockData {
  let d: BlockData = {};
  try { d = JSON.parse(b.content_json) as BlockData; } catch { /* ignore */ }
  if (d.cta && !d.primaryCta) d.primaryCta = d.cta;
  if (d.cta_secondary && !d.secondaryCta) d.secondaryCta = d.cta_secondary;
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

export function BlockRenderer({ block }: { block: PageBlock }) {
  const d = parse(block);

  switch (block.block_type) {
    case 'hero': {
      const heroBg = d.bg === 'dark' ? 'hero--dark' : d.bg === 'light' ? 'hero--light' : 'hero--gradient';
      return (
        <section class={`hero ${heroBg} ${d.align === 'left' ? 'hero--left' : 'hero--center'}`}>
          <div class="container">
            {d.badge && <span class="eyebrow hero-badge">{d.badge}</span>}
            <h1 class="h1">{d.title}</h1>
            {d.subtitle && <p class="lead">{d.subtitle}</p>}
            {(d.primaryCta || d.secondaryCta) && (
              <div class="btn-row">
                {d.primaryCta && <a class="btn btn--primary btn--lg" href={d.primaryCta.href}>{d.primaryCta.text}</a>}
                {d.secondaryCta && <a class="btn btn--ghost btn--lg" href={d.secondaryCta.href}>{d.secondaryCta.text}</a>}
              </div>
            )}
            {d.image && <img class="hero-img" src={d.image} alt={d.title ?? ''} />}
          </div>
        </section>
      );
    }

    case 'logo_cloud':
      return (
        <section class={bgClass(d.bg)}>
          <div class="container">
            {d.title && <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>}
            <div class="logo-cloud">
              {(d.logos ?? []).map((l, i) => (
                <span class="logo-item" key={i}>{typeof l === 'string' ? l : l.name}</span>
              ))}
            </div>
          </div>
        </section>
      );

    case 'features':
      return (
        <section class={bgClass(d.bg)}>
          <div class="container">
            <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>
            {d.subtitle && <p class="lead" style={{ textAlign: 'center' }}>{d.subtitle}</p>}
            <div class={cols(d.columns)} style={{ marginTop: 48 }}>
              {(d.bullets ?? []).map((f, i) => (
                <div class="card" key={i}>
                  {f.icon && <div class="card--icon">{f.icon}</div>}
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'stats':
      return (
        <section class={bgClass(d.bg)}>
          <div class="container">
            {d.title && <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>}
            <div class="stats" style={{ marginTop: 40 }}>
              {(d.stats ?? []).map((s, i) => (
                <div key={i}>
                  <div class="stat-num">{s.num}</div>
                  <div class="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'pricing_table':
      return (
        <section class={bgClass(d.bg)}>
          <div class="container">
            <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>
            {d.subtitle && <p class="lead" style={{ textAlign: 'center' }}>{d.subtitle}</p>}
            <div class="grid grid-3" style={{ marginTop: 56, alignItems: 'stretch' }}>
              {(d.plans ?? []).map((p, i) => (
                <div class={`pricing-card ${p.featured ? 'pricing-card--featured' : ''}`} key={i}>
                  {p.featured && <span class="pricing-tag">最受欢迎</span>}
                  <div class="pricing-name">{p.name}</div>
                  <div class="pricing-price">
                    {p.price} <small>{p.period ?? '/月'}</small>
                  </div>
                  <ul class="pricing-features">
                    {(Array.isArray(p.features) ? p.features : String(p.features ?? '').split('\n').filter(Boolean)).map((f, j) => (
                      <li key={j}>{f}</li>
                    ))}
                  </ul>
                  <a href={d.primaryCta?.href ?? '#'} class="btn btn--primary">{p.cta ?? d.primaryCta?.text ?? '开始使用'}</a>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'testimonials':
      return (
        <section class={bgClass(d.bg)}>
          <div class="container">
            <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>
            <div class="grid grid-3" style={{ marginTop: 48 }}>
              {(d.testimonials ?? []).map((t, i) => (
                <div class="testimonial" key={i}>
                  <div class="testimonial-stars">★★★★★</div>
                  <p class="testimonial-quote">"{t.quote}"</p>
                  <div class="testimonial-author">
                    <div class="testimonial-avatar">{t.author?.[0] ?? '?'}</div>
                    <div>
                      <div class="testimonial-name">{t.author}</div>
                      <div class="testimonial-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'faq':
      return (
        <section class={bgClass(d.bg)}>
          <div class="container" style={{ maxWidth: 800 }}>
            <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>
            <div style={{ marginTop: 40 }}>
              {(d.faqs ?? []).map((f, i) => (
                <details class="faq-item" key={i}>
                  <summary class="faq-q">{f.q} <span>+</span></summary>
                  <div class="faq-a">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      );

    case 'team':
      return (
        <section class={bgClass(d.bg)}>
          <div class="container">
            <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>
            {d.subtitle && <p class="lead" style={{ textAlign: 'center' }}>{d.subtitle}</p>}
            <div class="grid grid-4" style={{ marginTop: 48 }}>
              {(d.team ?? []).map((t, i) => (
                <div class="team-card" key={i}>
                  <div class="team-avatar">
                    {t.avatar ? <img src={t.avatar} alt={t.name} /> : <span>{t.name?.[0] ?? '?'}</span>}
                  </div>
                  <div class="team-name">{t.name}</div>
                  <div class="team-role">{t.role}</div>
                  {t.bio && <div class="team-bio">{t.bio}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'blog_list':
      return (
        <section class={bgClass(d.bg)}>
          <div class="container">
            <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>
            <div class="grid grid-3" style={{ marginTop: 48 }}>
              {(d.posts ?? []).map((p, i) => (
                <a class="post-card" href={p.href ?? '#'} key={i}>
                  {p.image ? <img src={p.image} alt={p.title} class="post-img" /> : <div class="post-noimg" />}
                  <div class="post-meta">{p.date}</div>
                  <h3 class="post-title">{p.title}</h3>
                  {p.excerpt && <p class="post-excerpt">{p.excerpt}</p>}
                </a>
              ))}
            </div>
          </div>
        </section>
      );

    case 'video_embed':
      return (
        <section class={bgClass(d.bg)}>
          <div class="container">
            {d.title && <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>}
            <div class="video-wrap" style={{ marginTop: 40 }}>
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

    case 'contact_form':
      return (
        <section class={bgClass(d.bg)}>
          <div class="container">
            <h2 class="h2" style={{ textAlign: 'center' }}>{d.title}</h2>
            {d.subtitle && <p class="lead" style={{ textAlign: 'center' }}>{d.subtitle}</p>}
            <form
              class="contact-form"
              action="/api/public/submit-form"
              method="POST"
              style={{ marginTop: 40 }}
            >
              <div class="field">
                <input name="name" placeholder="您的称呼" required />
                <input name="email" type="email" placeholder="邮箱" required />
              </div>
              <input name="company" placeholder="公司名称（选填）" />
              <textarea name="message" placeholder="想了解什么？"></textarea>
              <button type="submit" class="btn btn--primary">{d.form?.submit_label ?? '提交咨询'}</button>
            </form>
            {d.form?.note && <p class="contact-note">{d.form.note}</p>}
          </div>
        </section>
      );

    case 'cta_band':
      return (
        <section class="section">
          <div class="container">
            <div class="cta-band">
              <h2 class="h2">{d.title}</h2>
              {d.subtitle && <p class="lead">{d.subtitle}</p>}
              {d.cta && <a class="btn btn--lg" href={d.cta.href}>{d.cta.text}</a>}
            </div>
          </div>
        </section>
      );

    case 'divider':
      return <hr class="divider" style={{ margin: d.height === 'lg' ? '48px 0' : '24px 0' }} />;

    case 'spacer':
      return <div class={`spacer${d.height === 'lg' ? ' spacer--lg' : d.height === 'sm' ? ' spacer--sm' : ''}`} />;

    case 'rich_text':
    default:
      return (
        <section class={bgClass(d.bg)}>
          <div class="container">
            <div class="rich-content">
              {d.title && <h2 class="h2">{d.title}</h2>}
              <div innerHTML={d.body ?? ''} />
            </div>
          </div>
        </section>
      );
  }
}
