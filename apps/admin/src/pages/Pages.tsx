import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type PageItem } from '../lib/api';

export default function Pages() {
  const [rows, setRows] = useState<PageItem[]>([]);
  const nav = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const load = () => api.listPages().then(setRows);
  useEffect(() => { load(); }, []);

  const publish = async (p: PageItem) => {
    await api.publishPage(p.id);
    load();
  };

  const remove = async (p: PageItem) => {
    if (!confirm(`确定删除页面 ${p.slug}？`)) return;
    await fetch(`/api/admin/pages/${p.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('cf_admin_token') ?? ''}` },
    });
    load();
  };

  const create = async () => {
    if (!newSlug || !newTitle) return;
    const r = await api.createPage({ slug: newSlug.startsWith('/') ? newSlug : `/${newSlug}`, title: newTitle });
    nav(`/pages/${r.id}/blocks`);
  };

  const clone = async (p: PageItem) => {
    const slug = prompt('新页面路径', `${p.slug}-copy`);
    if (!slug) return;
    const r = await api.createPage({ slug, title: `${p.title} (副本)` });
    // 复制 blocks
    const blocks = await api.listBlocks(p.id);
    await api.saveBlocks(r.id, blocks.map((b) => ({
      block_type: b.blockType,
      sort_order: b.sortOrder,
      content_json: JSON.parse(b.contentJson),
    })));
    nav(`/pages/${r.id}/blocks`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">官网页面</h1>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-blue-600 text-white rounded">+ 新建页面</button>
      </div>

      {showNew && (
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border">
          <h3 className="font-bold mb-3">新建页面</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input className="border rounded px-3 py-2 text-sm" placeholder="路径，如 /launch" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
            <input className="border rounded px-3 py-2 text-sm" placeholder="页面标题" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">创建并编辑</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 border rounded text-sm">取消</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-4 py-3">路径</th>
              <th className="text-left px-4 py-3">标题</th>
              <th className="text-left px-4 py-3">状态</th>
              <th className="text-left px-4 py-3">更新时间</th>
              <th className="text-left px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{r.slug}</td>
                <td className="px-4 py-3">{r.title}</td>
                <td className="px-4 py-3">
                  {r.isPublished ? (
                    <span className="text-green-600 text-xs">已发布</span>
                  ) : (
                    <span className="text-amber-600 text-xs">草稿</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.updatedAt * 1000).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 text-xs">
                    <button onClick={() => nav(`/pages/${r.id}/blocks`)} className="text-blue-600 hover:underline">编辑</button>
                    {!r.isPublished && <button onClick={() => publish(r)} className="text-green-600 hover:underline">发布</button>}
                    <button onClick={() => window.open(`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : 'https://cf-admin-api.itwebmomo.workers.dev'}${r.slug}?preview=${'preview-8f3k2m9x'}`, '_blank')} className="text-gray-600 hover:underline">预览</button>
                    <button onClick={() => clone(r)} className="text-gray-600 hover:underline">复制</button>
                    <button onClick={() => remove(r)} className="text-red-500 hover:underline">删除</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无页面，点右上角新建。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
