/**
 * Block 可视化编辑器（v2）
 * 三栏：组件库 + 属性面板（SchemaForm 驱动）+ 实时预览
 * 配置方式：输入框 / 下拉 / 颜色 / 开关 / 对象分组 / 数组表格
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type BlockItem } from '../lib/api';
import { BLOCK_SCHEMAS, BLOCK_GROUPS, SCHEMA_MAP, migrateContent } from '../lib/blocks';
import { SchemaForm } from '../components/SchemaForm';

type BlockData = Record<string, any>;
type Draft = { block_type: string; sort_order: number; content_json: BlockData };

/* ================= 商业化预览（与 API theme.ts 保持一致的样式子集） ================= */

function renderBlockPreview(b: Draft): string {
  const d = b.content_json;
  const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  switch (b.block_type) {
    case 'hero': {
      const heroBg = d.bg === 'dark' ? 'hero--dark' : d.bg === 'light' ? 'hero--light' : 'hero--gradient';
      const align = d.align === 'left' ? 'hero--left' : 'hero--center';
      return `<section class="hero ${heroBg} ${align}"><div class="container">
        ${d.badge ? `<span class="eyebrow hero-badge">${esc(d.badge)}</span>` : ''}
        <h1 class="h1">${esc(d.title)}</h1>
        ${d.subtitle ? `<p class="lead">${esc(d.subtitle)}</p>` : ''}
        ${(d.primaryCta || d.secondaryCta) ? `<div class="btn-row">${d.primaryCta ? `<a class="btn btn--primary btn--lg">${esc(d.primaryCta.text)}</a>` : ''}${d.secondaryCta ? `<a class="btn btn--ghost btn--lg">${esc(d.secondaryCta.text)}</a>` : ''}</div>` : ''}
        ${d.image ? `<img class="hero-img" src="${esc(d.image)}" style="max-width:800px;margin:48px auto 0">` : ''}
      </div></section>`;
    }
    case 'logo_cloud':
      return `<section class="section"><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}<div class="logo-cloud">${(d.logos ?? []).map((l: any) => `<span class="logo-item">${esc(typeof l === 'string' ? l : l.name)}</span>`).join('')}</div></div></section>`;
    case 'features':
      return `<section class="section"><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead" style="text-align:center">${esc(d.subtitle)}</p>` : ''}<div class="grid grid-3">${(d.bullets ?? []).map((f: any) => `<div class="card">${f.icon ? `<div class="card--icon">${esc(f.icon)}</div>` : ''}<h3>${esc(f.title)}</h3><p>${esc(f.desc)}</p></div>`).join('')}</div></div></section>`;
    case 'stats':
      return `<section class="section section--dark"><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}<div class="stats">${(d.stats ?? []).map((s: any) => `<div><div class="stat-num">${esc(s.num)}</div><div class="stat-label">${esc(s.label)}</div></div>`).join('')}</div></div></section>`;
    case 'pricing_table':
      return `<section class="section"><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead" style="text-align:center">${esc(d.subtitle)}</p>` : ''}<div class="grid grid-3" style="align-items:stretch">${(d.plans ?? []).map((p: any) => {
        const fl = Array.isArray(p.features) ? p.features : String(p.features ?? '').split('\n').filter(Boolean);
        return `<div class="pricing-card ${p.featured ? 'pricing-card--featured' : ''}">${p.featured ? `<span class="pricing-tag">最受欢迎</span>` : ''}<div class="pricing-name">${esc(p.name)}</div><div class="pricing-price">${esc(p.price)} <small>${esc(p.period ?? '/月')}</small></div><ul class="pricing-features">${fl.map((f: string) => `<li>${esc(f)}</li>`).join('')}</ul><a class="btn btn--primary">${esc(p.cta ?? '开始使用')}</a></div>`;
      }).join('')}</div></div></section>`;
    case 'testimonials':
      return `<section class="section section--soft"><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}<div class="grid grid-3">${(d.testimonials ?? []).map((t: any) => `<div class="testimonial"><div class="testimonial-stars">★★★★★</div><p class="testimonial-quote">"${esc(t.quote)}"</p><div class="testimonial-author"><div class="testimonial-avatar">${esc(t.author?.[0] ?? '?')}</div><div><div class="testimonial-name">${esc(t.author)}</div><div class="testimonial-role">${esc(t.role)}</div></div></div></div>`).join('')}</div></div></section>`;
    case 'faq':
      return `<section class="section"><div class="container" style="max-width:800px">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${(d.faqs ?? []).map((f: any) => `<details class="faq-item" open><summary class="faq-q">${esc(f.q)} <span>+</span></summary><div class="faq-a">${esc(f.a)}</div></details>`).join('')}</div></section>`;
    case 'team':
      return `<section class="section"><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}<div class="grid grid-4">${(d.team ?? []).map((t: any) => `<div class="team-card"><div class="team-avatar">${t.avatar ? `<img src="${esc(t.avatar)}">` : `<span>${esc(t.name?.[0] ?? '?')}</span>`}</div><div class="team-name">${esc(t.name)}</div><div class="team-role">${esc(t.role)}</div>${t.bio ? `<div class="team-bio">${esc(t.bio)}</div>` : ''}</div>`).join('')}</div></div></section>`;
    case 'blog_list':
      return `<section class="section"><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}<div class="grid grid-3">${(d.posts ?? []).map((p: any) => `<div class="post-card">${p.image ? `<img class="post-img" src="${esc(p.image)}">` : `<div class="post-noimg"></div>`}<div class="post-meta">${esc(p.date ?? '')}</div><h3 class="post-title">${esc(p.title)}</h3>${p.excerpt ? `<p class="post-excerpt">${esc(p.excerpt)}</p>` : ''}</div>`).join('')}</div></div></section>`;
    case 'video_embed':
      return `<section class="section"><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}<div class="video-wrap"><div class="video-placeholder">视频嵌入区</div></div></div></section>`;
    case 'cta_band':
      return `<section class="section"><div class="container"><div class="cta-band"><h2 class="h2">${esc(d.title)}</h2>${d.subtitle ? `<p class="lead">${esc(d.subtitle)}</p>` : ''}${d.cta ? `<a class="btn btn--lg">${esc(d.cta.text)}</a>` : ''}</div></div></section>`;
    case 'contact_form':
      return `<section class="section"><div class="container">${d.title ? `<h2 class="h2" style="text-align:center">${esc(d.title)}</h2>` : ''}${d.subtitle ? `<p class="lead" style="text-align:center">${esc(d.subtitle)}</p>` : ''}<div class="contact-form"><div class="field"><input placeholder="您的称呼"><input placeholder="邮箱"></div><input placeholder="公司名称（选填）"><textarea placeholder="想了解什么？"></textarea><button class="btn btn--primary">${esc(d.form?.submit_label ?? '提交咨询')}</button></div>${d.form?.note ? `<p class="contact-note">${esc(d.form.note)}</p>` : ''}</div></section>`;
    case 'divider':
      return `<hr class="divider" style="margin:${d.height === 'lg' ? 48 : 24}px 0">`;
    case 'spacer':
      return `<div style="height:${d.height === 'lg' ? 96 : d.height === 'sm' ? 24 : 48}px"></div>`;
    case 'rich_text':
    default:
      return `<section class="section"><div class="container"><div class="rich-content">${d.title ? `<h2 class="h2">${esc(d.title)}</h2>` : ''}<div>${d.body ?? ''}</div></div></div></section>`;
  }
}

const PREVIEW_CSS = `
:root{--c-primary:#2563eb;--c-primary-hover:#1d4ed8;--c-accent:#7c3aed;--c-bg:#fff;--c-bg-soft:#f8fafc;--c-text:#0f172a;--c-text-muted:#64748b;--c-border:#e2e8f0;--c-radius:16px;--c-shadow:0 4px 12px rgba(15,23,42,.06),0 12px 32px rgba(15,23,42,.08);--c-container:1200px}
*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;color:var(--c-text);line-height:1.6;-webkit-font-smoothing:antialiased}img{max-width:100%;display:block}a{color:var(--c-primary);text-decoration:none}
.container{max-width:var(--c-container);margin:0 auto;padding:0 24px}.section{padding:96px 0}.section--soft{background:var(--c-bg-soft)}.section--dark{background:#0b1220;color:#fff}.section--dark .lead{color:#94a3b8}
.eyebrow{display:inline-flex;align-items:center;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--c-primary);background:rgba(37,99,235,.08);padding:6px 14px;border-radius:999px;margin-bottom:20px}
.h1{font-size:clamp(40px,7vw,72px);line-height:1.05;font-weight:800;margin:0 0 24px;letter-spacing:-.03em}.h2{font-size:clamp(30px,4.5vw,46px);line-height:1.15;font-weight:800;margin:0 0 16px;letter-spacing:-.02em}.lead{font-size:clamp(16px,2vw,20px);color:var(--c-text-muted);margin:0 0 36px;line-height:1.7}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px;line-height:1;cursor:pointer;text-decoration:none}.btn--primary{background:linear-gradient(135deg,var(--c-primary),var(--c-accent));color:#fff;box-shadow:0 4px 16px rgba(37,99,235,.35)}.btn--ghost{background:transparent;color:inherit;border:1.5px solid var(--c-border)}.btn--lg{padding:16px 40px;font-size:18px}.btn-row{display:flex;gap:16px;flex-wrap:wrap;justify-content:center}
.grid{display:grid;gap:28px}.grid-3{grid-template-columns:repeat(3,1fr)}.grid-4{grid-template-columns:repeat(4,1fr)}
.hero{padding:140px 0 120px;text-align:center}.hero--gradient{background:radial-gradient(800px 400px at 20% 0%,rgba(37,99,235,.12),transparent 60%),radial-gradient(700px 400px at 80% 10%,rgba(124,58,237,.10),transparent 60%),linear-gradient(180deg,#f8fafc,#fff)}.hero--dark{background:#0b1220;color:#fff}.hero--light{background:linear-gradient(180deg,#f0f9ff,#fff)}.hero--center .lead{margin-left:auto;margin-right:auto;max-width:680px}.hero--left{text-align:left}.hero--left .btn-row{justify-content:flex-start}
.logo-cloud{display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin-top:40px}.logo-item{padding:10px 22px;border:1px solid var(--c-border);border-radius:10px;font-weight:700;color:var(--c-text-muted);font-size:15px;background:#fff}
.card{background:#fff;border:1px solid var(--c-border);border-radius:var(--c-radius);padding:32px;position:relative;overflow:hidden}.card::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--c-primary),var(--c-accent));opacity:0;transition:opacity .25s}.card:hover::after{opacity:1}.card--icon{width:52px;height:52px;display:flex;align-items:center;justify-content:center;font-size:26px;border-radius:12px;background:rgba(37,99,235,.08);margin-bottom:18px}.card h3{margin:0 0 10px;font-size:19px;font-weight:700}.card p{margin:0;color:var(--c-text-muted);font-size:15px;line-height:1.7}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:28px;text-align:center}.stat-num{font-size:clamp(40px,5vw,64px);font-weight:800;line-height:1;background:linear-gradient(120deg,var(--c-primary),var(--c-accent));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}.stat-label{color:var(--c-text-muted);margin-top:12px;font-size:15px;font-weight:500}
.pricing-card{background:#fff;border:1px solid var(--c-border);border-radius:20px;padding:36px;display:flex;flex-direction:column;position:relative}.pricing-card--featured{border:2px solid transparent;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(135deg,var(--c-primary),var(--c-accent)) border-box;box-shadow:var(--c-shadow)}.pricing-tag{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--c-primary),var(--c-accent));color:#fff;font-size:12px;font-weight:700;padding:5px 16px;border-radius:999px;white-space:nowrap}.pricing-name{font-size:14px;color:var(--c-text-muted);text-transform:uppercase;letter-spacing:.08em;font-weight:600}.pricing-price{font-size:48px;font-weight:800;margin:16px 0 4px}.pricing-price small{font-size:16px;font-weight:400;color:var(--c-text-muted)}.pricing-features{list-style:none;padding:0;margin:24px 0 32px;flex:1}.pricing-features li{padding:10px 0;border-top:1px solid var(--c-border);font-size:15px;display:flex;align-items:center;gap:10px}.pricing-features li::before{content:"✓";color:#fff;background:linear-gradient(135deg,var(--c-primary),var(--c-accent));width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}.pricing-card .btn{width:100%}
.testimonial{background:#fff;border:1px solid var(--c-border);border-radius:20px;padding:32px;position:relative}.testimonial::before{content:"“";position:absolute;top:12px;right:24px;font-size:72px;color:rgba(37,99,235,.15);font-family:Georgia,serif}.testimonial-stars{color:#f59e0b;font-size:15px;letter-spacing:2px;margin-bottom:14px}.testimonial-quote{font-size:16.5px;line-height:1.7;margin:0 0 24px}.testimonial-author{display:flex;align-items:center;gap:14px}.testimonial-avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--c-primary),var(--c-accent));display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0}.testimonial-name{font-weight:700;font-size:15px}.testimonial-role{font-size:13px;color:var(--c-text-muted)}
.faq-item{border-bottom:1px solid var(--c-border)}.faq-item:first-child{border-top:1px solid var(--c-border)}.faq-q{width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:24px 0;font-size:17px;font-weight:600;color:inherit;display:flex;justify-content:space-between;align-items:center}.faq-q span{width:28px;height:28px;border-radius:50%;background:rgba(37,99,235,.08);display:inline-flex;align-items:center;justify-content:center;font-size:16px;color:var(--c-primary);flex-shrink:0}.faq-a{padding:0 0 24px;color:var(--c-text-muted);font-size:15.5px;line-height:1.8}
.cta-band{background:radial-gradient(500px 300px at 15% 20%,rgba(255,255,255,.15),transparent 60%),radial-gradient(500px 300px at 85% 80%,rgba(255,255,255,.12),transparent 60%),linear-gradient(135deg,var(--c-primary),var(--c-accent));color:#fff;text-align:center;border-radius:24px;padding:80px 40px}.cta-band h2{color:#fff}.cta-band .lead{color:rgba(255,255,255,.85)}.cta-band .btn{background:#fff;color:var(--c-primary)}
.contact-form{display:grid;gap:18px;max-width:620px;margin:0 auto}.contact-form .field{display:grid;grid-template-columns:1fr 1fr;gap:18px}.contact-form input,.contact-form textarea{width:100%;padding:14px 18px;border:1.5px solid var(--c-border);border-radius:12px;font-size:15px;font-family:inherit}.contact-form textarea{min-height:130px;resize:vertical}.contact-form .btn{justify-self:center;min-width:200px}.contact-note{text-align:center;font-size:13px;color:var(--c-text-muted);margin-top:16px}
.team-card{text-align:center;padding:32px 20px}.team-avatar{width:104px;height:104px;border-radius:50%;margin:0 auto 18px;background:linear-gradient(135deg,var(--c-primary),var(--c-accent));display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;color:#fff;overflow:hidden}.team-avatar img{width:100%;height:100%;object-fit:cover}.team-name{font-weight:700;font-size:17px}.team-role{color:var(--c-text-muted);font-size:13px;margin-top:4px}.team-bio{color:var(--c-text-muted);font-size:14px;margin-top:12px}
.post-card{display:block;background:#fff;border:1px solid var(--c-border);border-radius:20px;overflow:hidden;text-decoration:none;color:inherit}.post-img{width:100%;height:200px;object-fit:cover}.post-noimg{height:200px;background:linear-gradient(135deg,rgba(37,99,235,.15),rgba(124,58,237,.12))}.post-meta{color:var(--c-text-muted);font-size:12.5px;padding:22px 24px 0}.post-title{margin:8px 24px 0;font-size:19px;font-weight:700}.post-excerpt{margin:10px 24px 24px;color:var(--c-text-muted);font-size:14.5px}
.video-wrap{max-width:840px;margin:0 auto;border-radius:20px;overflow:hidden;box-shadow:var(--c-shadow);background:#000}.video-placeholder{height:400px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f172a,#1e293b);color:#94a3b8}
.divider{border:none;height:1px;background:linear-gradient(90deg,transparent,var(--c-border),transparent)}.rich-content{max-width:780px;margin:0 auto;font-size:16.5px}.rich-content p{margin:0 0 20px;line-height:1.8;color:#334155}
@media(max-width:900px){.grid-3,.grid-4{grid-template-columns:repeat(2,1fr)}}@media(max-width:640px){.grid-3,.grid-4{grid-template-columns:1fr}.section{padding:48px 0}.hero{padding:72px 0 56px}.btn-row{flex-direction:column}.btn-row .btn{width:100%}.stats{grid-template-columns:repeat(2,1fr)}.contact-form .field{grid-template-columns:1fr}}
`;

/* ================= 编辑器主体 ================= */

export default function BlockEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [blocks, setBlocks] = useState<Draft[]>([]);
  const [selected, setSelected] = useState(0);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    api.listBlocks(id!).then((rows: BlockItem[]) => {
      setBlocks(rows.map((r) => ({
        block_type: r.blockType,
        sort_order: r.sortOrder,
        content_json: migrateContent(r.blockType, JSON.parse(r.contentJson)),
      })));
    });
  }, [id]);

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

  const remove = (i: number) => {
    setBlocks((bs) => bs.filter((_, idx) => idx !== i));
    setSelected(Math.max(0, i - 1));
  };

  const addBlock = (type: string) => {
    const schema = SCHEMA_MAP[type];
    if (!schema) return;
    setBlocks((bs) => [...bs, { block_type: type, sort_order: bs.length, content_json: schema.defaults() }]);
    setSelected(blocks.length);
  };

  const save = async (publish: boolean) => {
    await api.saveBlocks(id!, blocks);
    if (publish) await api.publishPage(id!);
    nav('/pages');
  };

  const previewHtml = useMemo(
    () => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${PREVIEW_CSS}</style></head><body>${blocks.map(renderBlockPreview).join('')}</body></html>`,
    [blocks],
  );

  const cur = blocks[selected];

  return (
    <div className="flex h-screen -m-6">
      {/* 左：组件库 */}
      <div className="w-60 border-r bg-gray-50 p-3 overflow-auto flex flex-col">
        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">页面区块 ({blocks.length})</h3>
        <div className="space-y-1 flex-1 overflow-auto">
          {blocks.map((b, i) => (
            <button key={i} onClick={() => setSelected(i)}
              className={`w-full text-left px-2 py-1.5 rounded text-sm truncate ${i === selected ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}>
              <span className="text-[10px] opacity-60 mr-1">{i + 1}</span>
              {schemaOf(b.block_type).label}
            </button>
          ))}
          {blocks.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">从下方添加组件</p>
          )}
        </div>
        <div className="border-t pt-3">
          {BLOCK_GROUPS.map((g) => (
            <div key={g} className="mb-2">
              <h4 className="text-[10px] text-gray-400 font-bold mb-1">{g}</h4>
              <div className="space-y-1">
                {BLOCK_SCHEMAS.filter((s) => s.group === g).map((s) => (
                  <button key={s.type} onClick={() => addBlock(s.type)}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-blue-100 hover:text-blue-700 text-gray-600 truncate">
                    + {s.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 中：属性面板 */}
      <div className="w-96 border-r p-4 overflow-auto bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-sm">组件配置</h3>
          <div className="flex gap-1">
            <button onClick={() => move(selected, -1)} disabled={!cur || selected === 0} className="px-2 py-1 border rounded text-xs disabled:opacity-30" title="上移">↑</button>
            <button onClick={() => move(selected, 1)} disabled={!cur || selected === blocks.length - 1} className="px-2 py-1 border rounded text-xs disabled:opacity-30" title="下移">↓</button>
            <button onClick={() => remove(selected)} disabled={!cur} className="px-2 py-1 border rounded text-xs text-red-500 disabled:opacity-30" title="删除">✕</button>
          </div>
        </div>
        {cur && (
          <>
            <select
              value={cur.block_type}
              onChange={(e) => {
                const schema = SCHEMA_MAP[e.target.value];
                if (!schema) return;
                update(selected, { block_type: e.target.value, content_json: schema.defaults() });
              }}
              className="w-full border rounded px-2 py-1.5 text-sm mb-4"
            >
              {BLOCK_SCHEMAS.map((s) => <option key={s.type} value={s.type}>{s.label}</option>)}
            </select>
            <SchemaForm
              fields={schemaOf(cur.block_type).fields}
              value={cur.content_json}
              onChange={(v) => update(selected, { content_json: v })}
            />
            <div className="mt-4 border-t pt-3">
              <p className="text-[11px] text-gray-400">数组/列表字段以表格形式编辑，支持增删行与上下排序；对象字段分组展示。</p>
            </div>
          </>
        )}
      </div>

      {/* 右：实时预览 */}
      <div className="flex-1 bg-gray-200 flex flex-col min-w-0">
        <div className="bg-white border-b px-4 py-2 flex justify-between items-center shrink-0">
          <div className="flex gap-1.5">
            <button onClick={() => setDevice('desktop')} className={`px-3 py-1 text-xs rounded ${device === 'desktop' ? 'bg-blue-600 text-white' : 'border bg-white'}`}>桌面</button>
            <button onClick={() => setDevice('mobile')} className={`px-3 py-1 text-xs rounded ${device === 'mobile' ? 'bg-blue-600 text-white' : 'border bg-white'}`}>手机 375px</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => save(false)} className="px-3 py-1 border rounded text-sm bg-white">存草稿</button>
            <button onClick={() => save(true)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">保存并发布</button>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-auto flex justify-center">
          <iframe
            title="preview"
            srcDoc={previewHtml}
            style={{
              width: device === 'mobile' ? 375 : '100%',
              maxWidth: '100%',
              border: 'none',
              borderRadius: 12,
              background: '#fff',
              boxShadow: '0 4px 24px rgba(15,23,42,.12)',
              transition: 'width .25s',
            }}
          />
        </div>
      </div>
    </div>
  );
}
