/**
 * 根据 block_type 渲染不同的前台组件。
 * 新增 Block 类型时在此处注册即可。
 */
import type { PageBlock } from '@cf-admin/db';

interface BlockData {
  title?: string;
  subtitle?: string;
  body?: string;
  image?: string;
  bullets?: { title: string; desc: string }[];
  plans?: { name: string; price: string; features: string[] }[];
  testimonials?: { quote: string; author: string; role: string }[];
  cta?: { text: string; href: string };
}

function parse(b: PageBlock): BlockData {
  try {
    return JSON.parse(b.content_json) as BlockData;
  } catch {
    return {};
  }
}

export function BlockRenderer({ block }: { block: PageBlock }) {
  const data = parse(block);

  switch (block.block_type) {
    case 'hero':
      return (
        <section style={{ padding: '80px 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>{data.title}</h1>
          <p style={{ fontSize: '20px', color: '#666', marginBottom: '32px' }}>{data.subtitle}</p>
          {data.cta && (
            <a
              href={data.cta.href}
              style={{ background: '#111', color: '#fff', padding: '12px 28px', borderRadius: 6, textDecoration: 'none' }}
            >
              {data.cta.text}
            </a>
          )}
        </section>
      );

    case 'features':
      return (
        <section style={{ padding: '64px 24px', maxWidth: 1080, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>{data.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {data.bullets?.map((f) => (
              <div key={f.title} style={{ border: '1px solid #eee', padding: 24, borderRadius: 8 }}>
                <h3>{f.title}</h3>
                <p style={{ color: '#666' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case 'testimonials':
      return (
        <section style={{ padding: '64px 24px', background: '#fafafa' }}>
          <h2 style={{ textAlign: 'center', marginBottom: 40 }}>{data.title}</h2>
          <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 24, gridTemplateColumns: 'repeat(3,1fr)' }}>
            {data.testimonials?.map((t) => (
              <blockquote key={t.author} style={{ background: '#fff', padding: 20, borderRadius: 8, margin: 0 }}>
                <p>“{t.quote}”</p>
                <footer style={{ color: '#888', fontSize: 14 }}>
                  — {t.author}，{t.role}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      );

    case 'pricing_table':
      return (
        <section style={{ padding: '64px 24px', maxWidth: 1080, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: 40 }}>{data.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {data.plans?.map((p) => (
              <div key={p.name} style={{ border: '1px solid #eee', padding: 24, borderRadius: 8 }}>
                <h3>{p.name}</h3>
                <div style={{ fontSize: 32, fontWeight: 700, margin: '12px 0' }}>{p.price}</div>
                <ul style={{ paddingLeft: 20, color: '#555' }}>
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );

    case 'rich_text':
    default:
      return (
        <section style={{ padding: '40px 24px', maxWidth: 760, margin: '0 auto' }}>
          {data.title && <h2>{data.title}</h2>}
          <div style={{ lineHeight: 1.7, color: '#333' }}>{data.body}</div>
        </section>
      );
  }
}
