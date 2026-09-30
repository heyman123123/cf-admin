/**
 * 编辑器浮层：组件库 Popover（hover 缩略图）+ 版本历史弹层。
 * v3.5：从 BlockEditor.tsx 拆出。
 */
import { SCHEMA_MAP } from '../../lib/blocks';
import { metaOf, type Draft } from '../../lib/blockPreview';
import { Icon } from '../../lib/editorParts';
import type { VersionRow } from './TopBar';

export default function Overlays({ pop, setPop, query, setQuery, groupsWithSchemas, visibleSchemas, hoverType, setHoverType, addBlockAt, miniHtml, shownBlocks, versionOpen, setVersionOpen, versions, restore }: {
  pop: { i: number; pos: 'above' | 'below'; x: number; y: number } | null;
  setPop: (p: { i: number; pos: 'above' | 'below'; x: number; y: number } | null) => void;
  query: string; setQuery: (q: string) => void;
  groupsWithSchemas: { g: string; list: { type: string; label: string; group: string }[] }[];
  visibleSchemas: { type: string; label: string; group: string }[];
  hoverType: string | null; setHoverType: (t: string | null) => void;
  addBlockAt: (type: string, target: { i: number; pos: 'above' | 'below' }) => void;
  miniHtml: (type: string) => string;
  shownBlocks: Draft[];
  versionOpen: boolean; setVersionOpen: (b: boolean) => void;
  versions: VersionRow[];
  restore: (vid: string) => void;
}) {
  const schemaOf = (type: string) => SCHEMA_MAP[type] ?? SCHEMA_MAP.hero;

  return (
    <>
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
                {pop.i >= shownBlocks.length ? ' · 追加到末尾' : ''}
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
                        onMouseEnter={() => setHoverType(s.type)}
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

            {/* hover 缩略图：默认内容迷你渲染 */}
            {hoverType && (() => {
              const s = schemaOf(hoverType);
              return (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0">
                  <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-500 flex justify-between items-center">
                    <span className="truncate">{s.label} · 预览</span>
                    <span className="text-slate-400 shrink-0">添加后可在右侧编辑</span>
                  </div>
                  <div className="relative" style={{ height: 130, overflow: 'hidden' }}>
                    <iframe
                      title={`mini-${hoverType}`}
                      srcDoc={miniHtml(hoverType)}
                      style={{ width: 1200, height: 520, border: 'none', transform: 'scale(0.25)', transformOrigin: 'top left', pointerEvents: 'none', background: '#fff' }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* ======== 版本历史弹层 ======== */}
      {versionOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setVersionOpen(false)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[92vw] max-h-[76vh] overflow-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_64px_rgba(15,23,42,.3)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[14px] font-bold text-slate-800">历史版本</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">每次「存草稿 / 发布」都会生成一个版本快照，可随时恢复到草稿。</p>
              </div>
              <button onClick={() => setVersionOpen(false)} title="关闭"
                className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">✕</button>
            </div>
            {versions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">暂无版本记录。首次「存草稿」或「发布」后才会生成。</p>
            ) : (
              <div className="space-y-2">
                {versions.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 hover:border-blue-300 transition">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${v.status === 'published' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                      v{v.version}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-slate-700">版本 {v.version}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-px rounded-full ${v.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {v.status === 'published' ? '已发布' : '草稿'}
                        </span>
                        {v.created_by && <span className="text-[10px] text-slate-400 truncate">{v.created_by}</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{new Date(v.created_at * 1000).toLocaleString()}</div>
                    </div>
                    <button onClick={() => restore(v.id)}
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
    </>
  );
}
