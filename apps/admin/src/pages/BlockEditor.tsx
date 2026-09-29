import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type BlockItem, type BlockDraft } from '../lib/api';

const BLOCK_TYPES = ['hero', 'features', 'testimonials', 'pricing_table', 'rich_text'];
type Draft = BlockDraft & { _id?: string };

export default function BlockEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [blocks, setBlocks] = useState<Draft[]>([]);

  useEffect(() => {
    api.listBlocks(id!).then((rows: BlockItem[]) => {
      setBlocks(rows.map((r) => ({ _id: r.id, block_type: r.block_type, sort_order: r.sort_order, content_json: JSON.parse(r.content_json) })));
    });
  }, [id]);

  const update = (idx: number, patch: Partial<Draft>) => {
    setBlocks((bs) => bs.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };
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
            <div className="flex gap-3 mb-3">
              <select value={b.block_type} onChange={(e) => update(i, { block_type: e.target.value })} className="border rounded px-2 py-1">
                {BLOCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" value={b.sort_order} onChange={(e) => update(i, { sort_order: Number(e.target.value) })} className="border rounded px-2 py-1 w-20" />
            </div>
            <textarea
              value={typeof b.content_json === 'string' ? b.content_json : JSON.stringify(b.content_json, null, 2)}
              onChange={(e) => { try { update(i, { content_json: JSON.parse(e.target.value) }); } catch {} }}
              rows={8} className="w-full font-mono text-xs border rounded p-2"
            />
          </div>
        ))}
      </div>
      <button onClick={() => setBlocks((bs) => [...bs, { block_type: 'rich_text', sort_order: bs.length, content_json: { title: '', body: '' } }])} className="mt-4 px-4 py-2 border border-dashed rounded">
        + 添加 Block
      </button>
      <div className="mt-6 text-sm text-gray-500">
        草稿预览：访问站点路径后追加 <code>?preview=&lt;PREVIEW_TOKEN&gt;</code> 即可绕过缓存查看草稿。
      </div>
    </div>
  );
}
