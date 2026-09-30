import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type PageItem, type PageVersion } from '../lib/api';

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : 'https://cf-admin-api.itwebmomo.workers.dev';

export default function Pages() {
  const [rows, setRows] = useState<PageItem[]>([]);
  const nav = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [hist, setHist] = useState<{ page: PageItem; versions: PageVersion[] } | null>(null);

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

  const openHist = async (p: PageItem) => {
    const versions = await api.listPageVersions(p.id);
    setHist({ page: p, versions });
  };

  const restore = async (p: PageItem, vid: string) => {
    if (!confirm('确定恢复到该版本？恢复后为草稿状态，不会自动发布。')) return;
    await api.restoreVersion(p.id, vid);
    openHist(p);
    load();
  };

  /** 三态：已发布（有线上版本）/ 草稿（有内容未发布）/ 从未发布 */
  const stateOf = (p: PageItem) => {
    if ((p.publishedCount ?? 0) > 0) return 'published';
    if ((p.versionCount ?? 0) > 0) return 'draft';
    return 'never';
  };

  const stateBadge = (p: PageItem) => {
    const s = stateOf(p);
    if (s === 'published')
      return (
        <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          已发布
          {p.publishedAt ? <span className="text-green-500 font-normal">· {new Date(p.publishedAt * 1000).toLocaleString()}</span> : null}
        </span>
      );
    if (s === 'draft')
      return (
        <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          草稿 · 未上线
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 text-[11px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        从未发布
      </span>
    );
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
              <th className="text-left px-4 py-3">版本</th>
              <th className="text-left px-4 py-3">更新时间</th>
              <th className="text-left px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{r.slug}</td>
                <td className="px-4 py-3">{r.title}</td>
                <td className="px-4 py-3">{stateBadge(r)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {(r.versionCount ?? 0) > 0
                    ? <>共 {r.versionCount} 个版本{stateOf(r) === 'published' ? ` · 线上 v${r.publishedCount}` : ''}</>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.updatedAt * 1000).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 text-xs">
                    <button onClick={() => nav(`/pages/${r.id}/blocks`)} className="text-blue-600 hover:underline font-medium">重新编辑</button>
                    {stateOf(r) !== 'published' && <button onClick={() => publish(r)} className="text-green-600 hover:underline">发布</button>}
                    <button onClick={() => openHist(r)} className="text-gray-600 hover:underline">历史</button>
                    <button onClick={() => window.open(`${API_BASE}${r.slug}?preview=${'preview-8f3k2m9x'}`, '_blank')} className="text-gray-600 hover:underline">预览</button>
                    <button onClick={() => clone(r)} className="text-gray-600 hover:underline">复制</button>
                    <button onClick={() => remove(r)} className="text-red-500 hover:underline">删除</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无页面，点右上角新建。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 版本历史弹层 */}
      {hist && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setHist(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[92vw] max-h-[76vh] overflow-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_64px_rgba(15,23,42,.3)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[14px] font-bold text-slate-800">历史版本 · {hist.page.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  <span className="font-mono">{hist.page.slug}</span> · {stateOf(hist.page) === 'published' ? '当前线上已发布' : '当前未上线（草稿）'} · 共 {hist.versions.length} 条
                </p>
              </div>
              <button onClick={() => setHist(null)} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">✕</button>
            </div>
            {hist.versions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">暂无版本记录。在编辑器中「存草稿」或「发布」后才会生成版本。</p>
            ) : (
              <div className="space-y-2">
                {hist.versions.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 hover:border-blue-300 transition">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${v.status === 'published' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                      v{v.version}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-slate-700">版本 {v.version}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-px rounded-full ${v.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {v.status === 'published' ? '已发布（线上）' : '草稿'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(v.created_at * 1000).toLocaleString()}
                        {v.created_by ? ` · ${v.created_by}` : ''}
                      </div>
                    </div>
                    <button onClick={() => restore(hist.page, v.id)}
                      className="shrink-0 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 text-[11px] font-semibold hover:bg-blue-50 transition">
                      恢复到草稿
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
