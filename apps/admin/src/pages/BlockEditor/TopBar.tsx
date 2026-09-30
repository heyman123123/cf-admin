/**
 * 编辑器全局顶栏（属于整个编辑器，跨三栏）。
 * v3.5：从 BlockEditor.tsx 拆出。
 */
import { Icon } from '../../lib/editorParts';

export type SaveState = 'idle' | 'saving' | 'saved';
export interface VersionRow { id: string; version: number; status: 'draft' | 'published'; created_at: number; created_by?: string | null }

export default function TopBar({ saving, isLayout, layoutPart, canUndo, canRedo, undo, redo, device, setDevice, versions, loadVersions, setVersionOpen, save, nav }: {
  saving: SaveState;
  isLayout: boolean;
  layoutPart: 'header' | 'footer' | null;
  canUndo: boolean; canRedo: boolean;
  undo: () => void; redo: () => void;
  device: 'desktop' | 'tablet' | 'mobile';
  setDevice: (d: 'desktop' | 'tablet' | 'mobile') => void;
  versions: VersionRow[];
  loadVersions: () => void;
  setVersionOpen: (b: boolean) => void;
  save: (publish: boolean) => void;
  nav: (p: string) => void;
}) {
  const deviceLabel = device === 'mobile' ? '375px' : device === 'tablet' ? '768px' : '自适应';
  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 flex-wrap z-20">
      {/* 左：返回 + 标题 + 状态 */}
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={() => nav('/pages')} className="flex items-center gap-1 text-[13px] text-slate-300 hover:text-white transition whitespace-nowrap">
          {Icon.back}<span>页面</span>
        </button>
        <span className="h-4 w-px bg-slate-700 shrink-0" />
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-semibold text-white truncate">
            {isLayout ? `全局布局 · ${layoutPart === 'header' ? '页头 Header' : '页脚 Footer'}` : '页面编辑器'}
          </span>
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${saving === 'saved' ? 'bg-emerald-500/15 text-emerald-400' : saving === 'saving' ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-700/60 text-slate-400'}`}>
            {saving === 'saved' ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />已保存</>
              : saving === 'saving' ? <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />保存中</>
              : <><span className="w-1.5 h-1.5 rounded-full bg-slate-500" />未保存</>}
          </span>
        </div>
      </div>

      {/* 中：撤销/重做 + 设备切换 */}
      <div className="flex items-center gap-3">
        {!isLayout && (
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
            <button onClick={undo} disabled={!canUndo} title="撤销 (Ctrl+Z)"
              className="w-7 h-7 inline-flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300 transition">{Icon.undo}</button>
            <button onClick={redo} disabled={!canRedo} title="重做 (Ctrl+Shift+Z)"
              className="w-7 h-7 inline-flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300 transition">{Icon.redo}</button>
          </div>
        )}

        <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg p-0.5">
          {([
            ['desktop', Icon.desktop, '桌面'],
            ['tablet', Icon.tablet, '平板 768'],
            ['mobile', Icon.phone, '手机 375'],
          ] as const).map(([d, ic, tip]) => (
            <button key={d} onClick={() => setDevice(d)} title={tip}
              className={`w-8 h-7 inline-flex items-center justify-center rounded-md transition ${device === d ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{ic}</button>
          ))}
        </div>
        <span className="hidden lg:inline text-[10px] text-slate-500 whitespace-nowrap w-12">{deviceLabel}</span>
      </div>

      {/* 右：历史版本 + 保存/发布 */}
      <div className="flex items-center gap-2">
        {!isLayout && (
          <button onClick={() => { loadVersions(); setVersionOpen(true); }} title="查看历史版本"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 text-[13px] font-medium text-slate-200 hover:border-slate-400 hover:text-white transition whitespace-nowrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 2.64-6.36"/><path d="M3 3v6h6"/></svg>
            历史版本
            {versions.length > 0 && <span className="text-[10px] font-bold bg-slate-700 text-slate-300 rounded-full px-1.5 py-px">{versions.length}</span>}
          </button>
        )}
        <button onClick={() => save(false)} disabled={saving === 'saving'}
          className="px-3.5 py-1.5 rounded-lg border border-slate-600 text-[13px] font-medium text-slate-200 hover:border-slate-400 hover:text-white disabled:opacity-50 transition whitespace-nowrap">
          {saving === 'saving' ? '保存中…' : isLayout ? `保存${layoutPart === 'header' ? '页头' : '页脚'}` : '存草稿'}
        </button>
        {!isLayout && (
          <button onClick={() => save(true)} disabled={saving === 'saving'}
            className="px-4 py-1.5 rounded-lg text-[13px] font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/25 disabled:opacity-50 transition whitespace-nowrap">
            发布
          </button>
        )}
      </div>
    </div>
  );
}
