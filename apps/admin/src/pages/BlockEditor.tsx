import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type BlockItem } from '../lib/api';

type BlockData = Record<string, any>;
type Draft = { block_type: string; sort_order: number; content_json: BlockData };

const BLOCK_TYPES = ['hero', 'features', 'testimonials', 'pricing_table', 'rich_text'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm mb-3">
      <span className="text-gray-500 block mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls = 'w-full border rounded px-2 py-1 text-sm';

/** 根据 block_type 渲染结构化表单 */
function BlockFields({ type, value, onChange }: {
  type: string;
  value: BlockData;
  onChange: (v: BlockData) => void;
}) {
  const set = (patch: BlockData) => onChange({ ...value, ...patch });

  switch (type) {
    case 'hero':
      return (
        <>
          <Field label="主标题"><input className={inputCls} value={value.title ?? ''} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="副标题"><input className={inputCls} value={value.subtitle ?? ''} onChange={(e) => set({ subtitle: e.target.value })} /></Field>
          <Field label="按钮文字"><input className={inputCls} value={value.cta?.text ?? ''} onChange={(e) => set({ cta: { ...value.cta, text: e.target.value } })} /></Field>
          <Field label="按钮链接"><input className={inputCls} value={value.cta?.href ?? ''} onChange={(e) => set({ cta: { ...value.cta, href: e.target.value } })} /></Field>
        </>
      );
    case 'features':
      return (
        <>
          <Field label="标题"><input className={inputCls} value={value.title ?? ''} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="特性列表 (JSON)">
            <textarea rows={5} className={inputCls + ' font-mono'} defaultValue={JSON.stringify(value.bullets ?? [], null, 2)}
              onBlur={(e) => { try { set({ bullets: JSON.parse(e.target.value) }); } catch {} }} />
          </Field>
        </>
      );
    case 'testimonials':
      return (
        <>
          <Field label="标题"><input className={inputCls} value={value.title ?? ''} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="评价列表 (JSON)">
            <textarea rows={5} className={inputCls + ' font-mono'} defaultValue={JSON.stringify(value.testimonials ?? [], null, 2)}
              onBlur={(e) => { try { set({ testimonials: JSON.parse(e.target.value) }); } catch {} }} />
          </Field>
        </>
      );
    case 'pricing_table':
      return (
        <>
          <Field label="标题"><input className={inputCls} value={value.title ?? ''} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="价格方案 (JSON)">
            <textarea rows={6} className={inputCls + ' font-mono'} defaultValue={JSON.stringify(value.plans ?? [], null, 2)}
              onBlur={(e) => { try { set({ plans: JSON.parse(e.target.value) }); } catch {} }} />
          </Field>
        </>
      );
    case 'rich_text':
    default:
      return (
        <>
          <Field label="标题"><input className={inputCls} value={value.title ?? ''} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="内容 (HTML)">
            <textarea rows={6} className={inputCls} value={value.body ?? ''} onChange={(e) => set({ body: e.target.value })} />
          </Field>
        </>
      );
  }
}

export default function BlockEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [blocks, setBlocks] = useState<Draft[]>([]);

  useEffect(() => {
    api.listBlocks(id!).then((rows: BlockItem[]) => {
      setBlocks(rows.map((r) => ({
        block_type: r.block_type,
        sort_order: r.sort_order,
        content_json: JSON.parse(r.content_json),
      })));
    });
  }, [id]);

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
  };

  const remove = (i: number) => setBlocks((bs) => bs.filter((_, idx) => idx !== i));

  const save = async (publish: boolean) => {
    await api.saveBlocks(id!, blocks);
    if (publish) await api.publishPage(id!);
    nav('/pages');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Block 编辑器</h1>
        <div className="flex gap-2">
          <button onClick={() => save(false)} className="px-4 py-2 border rounded">保存草稿</button>
          <button onClick={() => save(true)} className="px-4 py-2 bg-brand text-white rounded">保存并发布</button>
        </div>
      </div>

      <div className="space-y-4">
        {blocks.map((b, i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex gap-2 mb-3 items-center">
              <select value={b.block_type} onChange={(e) => update(i, { block_type: e.target.value, content_json: {} })}
                className="border rounded px-2 py-1 text-sm">
                {BLOCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => move(i, -1)} disabled={i === 0} className="px-2 py-1 border rounded text-sm">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="px-2 py-1 border rounded text-sm">↓</button>
              <button onClick={() => remove(i)} className="px-2 py-1 border rounded text-sm text-red-500 ml-auto">删除</button>
            </div>
            <BlockFields type={b.block_type} value={b.content_json} onChange={(v) => update(i, { content_json: v })} />
          </div>
        ))}
      </div>

      <button onClick={() => setBlocks((bs) => [...bs, { block_type: 'rich_text', sort_order: bs.length, content_json: { title: '', body: '' } }])}
        className="mt-4 px-4 py-2 border border-dashed rounded">
        + 添加 Block
      </button>
    </div>
  );
}
