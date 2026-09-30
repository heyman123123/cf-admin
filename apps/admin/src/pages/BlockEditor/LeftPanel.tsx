/**
 * 编辑器左栏：Tab 栏 + 「页面区块」「全局布局」两个 tab。
 * v3.5：从 BlockEditor.tsx 拆出（「样式和主题」tab 见 ThemeTab.tsx）。
 * v3.6：左栏加宽（340px）+ Tab 紧凑化防溢出。
 * v3.7：全局布局 tab 内直接展示 Header/Footer 区块列表（不再跳转到「页面区块」tab）。
 * v3.10：样式和主题 tab 内容并入左栏内部（不再右侧展开）。
 */
import { SCHEMA_MAP } from '../../lib/blocks';
import { metaOf, type Draft } from '../../lib/blockPreview';
import { Icon } from '../../lib/editorParts';
import ThemeTab from './ThemeTab';

export type Tab = 'blocks' | 'layout' | 'theme';

export default function LeftPanel({ tab, setTab, layersOpen, setLayersOpen, shownBlocks, selected, setSelected, onSelectFromList, hidden, toggleHidden, duplicate, remove, reorder, dragFrom, setDragFrom, dragOver, setDragOver, openPop, isLayout, layoutPart, layoutBlocks, switchTarget, showHeader, showFooter, savePageFlags, themePresets, theme, setTheme, applyPreset, saveTheme, themeSaved }: {
  tab: Tab; setTab: (t: Tab) => void;
  layersOpen: boolean; setLayersOpen: React.Dispatch<React.SetStateAction<boolean>>;
  shownBlocks: Draft[];
  selected: number; setSelected: (n: number) => void;
  /** v3.8：从列表选中时同时让画布滚动定位到组件 */
  onSelectFromList: (i: number) => void;
  hidden: Set<number>; toggleHidden: (i: number) => void;
  duplicate: (i: number) => void; remove: (i: number) => void;
  reorder: (from: number, to: number) => void;
  dragFrom: number | null; setDragFrom: (n: number | null) => void;
  dragOver: number | null; setDragOver: React.Dispatch<React.SetStateAction<number | null>>;
  openPop: (e: React.MouseEvent<HTMLButtonElement>, i: number, pos: 'above' | 'below') => void;
  isLayout: boolean;
  layoutPart: 'header' | 'footer' | null;
  layoutBlocks: Record<'header' | 'footer', Draft[]>;
  switchTarget: (part: 'header' | 'footer' | null) => void;
  showHeader: number; showFooter: number;
  savePageFlags: (header: number, footer: number) => void;
  themePresets: { key: string; name: string; vars: Record<string, string> }[];
  theme: Record<string, string>;
  setTheme: (t: Record<string, string>) => void;
  applyPreset: (vars: Record<string, string>) => void;
  saveTheme: () => void;
  themeSaved: boolean;
}) {
  const schemaOf = (type: string) => SCHEMA_MAP[type] ?? SCHEMA_MAP.hero;

  /** 区块列表主体（页面区块 tab 与全局布局 tab 共用）：拖拽排序 / hover 添加上下 / 显隐 / 复制 / 删除 / 末尾添加 / 空态 */
  const blockList = (emptyText: string) => (
    <div className="flex-1 overflow-auto p-2.5 space-y-2 min-h-0">
      {shownBlocks.map((b, i) => {
        const isHidden = hidden.has(i);
        const isDragOver = dragOver === i && dragFrom !== i;
        const active = i === selected;
        const meta = metaOf(b.block_type);
        return (
          <div key={i}>
            {/* 上方添加（hover 浮现） */}
            <div className="relative h-0 z-20 -mb-0.5">
              <button
                title="在上方添加区块"
                onClick={(e) => openPop(e, i, 'above')}
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/30 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all flex items-center justify-center"
                style={{ opacity: undefined }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
              ><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14M12 5v14"/></svg></button>
            </div>

            <div
              draggable
              onDragStart={() => setDragFrom(i)}
              onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
              onDragLeave={() => setDragOver((v) => (v === i ? null : v))}
              onDrop={() => { if (dragFrom !== null) reorder(dragFrom, i); setDragFrom(null); setDragOver(null); }}
              onDragEnd={() => { setDragFrom(null); setDragOver(null); }}
              onClick={() => onSelectFromList(i)}
              className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] cursor-pointer border transition-all duration-150 ${isDragOver ? 'border-blue-400 bg-blue-50 shadow-inner' : active ? 'border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'} ${isHidden ? 'opacity-45' : ''}`}
            >
              <span className={`shrink-0 cursor-grab opacity-40 group-hover:opacity-100 ${active ? 'text-white' : 'text-slate-400'}`} title="拖拽排序">{Icon.grip}</span>
              <span className={`w-7 h-7 rounded-md bg-gradient-to-br ${meta.tint} flex items-center justify-center text-[13px] shrink-0 shadow-sm ${active ? 'ring-1 ring-white/40' : ''}`}>{meta.icon}</span>
              <span className="flex-1 truncate font-medium">{schemaOf(b.block_type).label}</span>
              <button title={isHidden ? '显示' : '隐藏'} onClick={(e) => { e.stopPropagation(); toggleHidden(i); }}
                className={`shrink-0 p-1 rounded transition ${active ? 'text-white/70 hover:text-white hover:bg-white/15' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>{isHidden ? Icon.eyeOff : Icon.eye}</button>
              <button title="复制" onClick={(e) => { e.stopPropagation(); duplicate(i); }}
                className={`shrink-0 p-1 rounded transition ${active ? 'text-white/70 hover:text-white hover:bg-white/15' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>{Icon.copy}</button>
              <button title="删除" onClick={(e) => { e.stopPropagation(); remove(i); }}
                className={`shrink-0 p-1 rounded transition ${active ? 'text-white/70 hover:text-white hover:bg-white/15' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}>{Icon.trash}</button>

              {/* 下方添加（hover 浮现） */}
              <button
                title="在下方添加区块"
                onClick={(e) => openPop(e, i, 'below')}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/30 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all flex items-center justify-center"
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
              ><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14M12 5v14"/></svg></button>
            </div>
          </div>
        );
      })}

      {/* 末尾添加（追加到末尾） */}
      {shownBlocks.length > 0 && (
        <div className="pt-2 border-t border-dashed border-slate-200">
          <button
            onClick={(e) => openPop(e, shownBlocks.length, 'below')}
            className="w-full py-2 rounded-lg border border-dashed border-slate-300 text-[12px] font-medium text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition flex items-center justify-center gap-1.5"
          ><span className="text-blue-500">{Icon.plus}</span>末尾添加区块</button>
        </div>
      )}

      {shownBlocks.length === 0 && (
        <div className="text-center py-10 px-4">
          <div className="text-2xl mb-1">🧩</div>
          <p className="text-xs text-slate-400 mb-3">{emptyText}</p>
          <button onClick={(e) => openPop(e, 0, 'below')}
            className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/25 transition">
            添加第一个区块
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="editor-left w-[340px] border-r border-slate-200 bg-white flex flex-col min-w-0 shrink-0">
      {/* Tab 栏 */}
      <div className="flex border-b border-slate-200 bg-slate-50/80 px-1.5 pt-1.5 gap-0.5 overflow-x-auto">
        <button
          onClick={() => setTab('blocks')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-t-lg text-[12px] font-semibold transition border border-b-0 whitespace-nowrap ${tab === 'blocks' ? 'bg-white text-blue-700 border-slate-200 shadow-[0_-2px_6px_rgba(15,23,42,.04)]' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
          页面区块
          {tab === 'blocks' && !isLayout && shownBlocks.length > 0 && <span className="text-[10px] font-bold text-blue-500 bg-blue-50 rounded-full px-1.5 py-px">{shownBlocks.length}</span>}
        </button>
        <button
          onClick={() => setTab('layout')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-t-lg text-[12px] font-semibold transition border border-b-0 whitespace-nowrap ${tab === 'layout' ? 'bg-white text-blue-700 border-slate-200 shadow-[0_-2px_6px_rgba(15,23,42,.04)]' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="7" x="3" y="3" rx="1"/><rect width="18" height="7" x="3" y="14" rx="1"/></svg>
          全局布局
        </button>
        <button
          onClick={() => setTab('theme')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-t-lg text-[12px] font-semibold transition border border-b-0 whitespace-nowrap ${tab === 'theme' ? 'bg-white text-blue-700 border-slate-200 shadow-[0_-2px_6px_rgba(15,23,42,.04)]' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.52-.67 1.67-1.33.17-.66-.08-1.17-.5-1.5-.4-.33-.83-1-.83-1.67a2 2 0 0 1 2-2h3.5c2.9 0 5.16-2.9 3.66-5.9C20.6 7.27 16.6 6 13.5 6c-.5 0-1.5-.5-1.5-1.5S13 2 12 2Z"/></svg>
          样式和主题
        </button>
      </div>

      {/* ---------- Tab：页面区块 ---------- */}
      {tab === 'blocks' && (
        <>
          <div className="px-4 py-3 border-b border-slate-200 bg-white space-y-3">
            <button type="button" onClick={() => setLayersOpen((o) => !o)} className="w-full flex items-center justify-between group">
              <span className="flex items-center gap-2 text-[13px] font-bold text-slate-800 tracking-tight">
                页面区块
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{shownBlocks.length}</span>
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`text-slate-400 transition-transform duration-200 ${layersOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {!isLayout && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  {/* 页头 Toggle 卡片 */}
                  <button type="button" onClick={() => savePageFlags(showHeader === 1 ? 0 : 1, showFooter)}
                    className={`flex items-center justify-between gap-1 px-2.5 py-2 rounded-xl border transition select-none ${
                      showHeader === 1
                        ? 'border-blue-500 bg-blue-50/80 shadow-sm shadow-blue-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 transition ${
                        showHeader === 1 ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>H</span>
                      <span className="text-[11.5px] font-semibold text-slate-700 leading-tight">显示页头</span>
                    </span>
                    <span className={`relative inline-flex w-8 h-[18px] rounded-full transition-colors duration-200 shrink-0 ${
                      showHeader === 1 ? 'bg-blue-500' : 'bg-slate-300'}`}>
                      <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all duration-200 ${
                        showHeader === 1 ? 'left-[18px]' : 'left-[2px]'}`} />
                    </span>
                  </button>
                  {/* 页脚 Toggle 卡片 */}
                  <button type="button" onClick={() => savePageFlags(showHeader, showFooter === 1 ? 0 : 1)}
                    className={`flex items-center justify-between gap-1 px-2.5 py-2 rounded-xl border transition select-none ${
                      showFooter === 1
                        ? 'border-blue-500 bg-blue-50/80 shadow-sm shadow-blue-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 transition ${
                        showFooter === 1 ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>F</span>
                      <span className="text-[11.5px] font-semibold text-slate-700 leading-tight">显示页脚</span>
                    </span>
                    <span className={`relative inline-flex w-8 h-[18px] rounded-full transition-colors duration-200 shrink-0 ${
                      showFooter === 1 ? 'bg-blue-500' : 'bg-slate-300'}`}>
                      <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all duration-200 ${
                        showFooter === 1 ? 'left-[18px]' : 'left-[2px]'}`} />
                    </span>
                  </button>
                </div>
                <p className="text-[10.5px] text-slate-400 leading-snug">切换「全局布局」中的页头/页脚在本页的显示（保存后对所有区块生效）。</p>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-0.5">拖拽排序 · 点击选中 · hover 添加上/下区块</p>
          </div>

          {layersOpen && blockList(isLayout ? `还没有${layoutPart === 'header' ? '页头' : '页脚'}区块` : '页面还没有区块')}
        </>
      )}

      {/* ---------- Tab：全局布局（Header / Footer） ---------- */}
      {tab === 'layout' && (
        layoutPart ? (
          /* 已在编辑页头/页脚：直接在 tab 内展示对应区块列表（不再跳转） */
          <div className="flex flex-col flex-1 min-h-0">
            <div className="px-4 py-3 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] font-bold text-slate-800 tracking-tight">
                  {layoutPart === 'header' ? '页头 Header' : '页脚 Footer'}
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{shownBlocks.length}</span>
                </span>
                <button onClick={() => switchTarget(null)}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  返回选择
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">拖拽排序 · 点击选中 · hover 添加上/下区块 · 保存后全站生效</p>
            </div>
            {blockList(`还没有${layoutPart === 'header' ? '页头' : '页脚'}区块`)}
          </div>
        ) : (
          /* 选择编辑页头还是页脚 */
          <div className="flex-1 overflow-auto p-3.5 min-h-0 space-y-4">
            <div>
              <h3 className="text-[13px] font-bold text-slate-800 tracking-tight mb-1">全局布局</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">编辑全站统一的页头与页脚，保存后对所有页面生效。每个页面可在「页面区块」tab 单独控制显隐。</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => switchTarget('header')}
                className="w-full text-left rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-300 hover:shadow-sm group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[14px] shadow-sm">H</span>
                    <div>
                      <div className="text-[12.5px] font-semibold text-slate-800">页头 Header</div>
                      <div className="text-[10.5px] text-slate-400">{layoutBlocks.header.length} 个区块 · 全站顶部</div>
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-blue-500 transition"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </button>

              <button
                onClick={() => switchTarget('footer')}
                className="w-full text-left rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-300 hover:shadow-sm group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-[14px] shadow-sm">F</span>
                    <div>
                      <div className="text-[12.5px] font-semibold text-slate-800">页脚 Footer</div>
                      <div className="text-[10.5px] text-slate-400">{layoutBlocks.footer.length} 个区块 · 全站底部</div>
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-blue-500 transition"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">编辑提示</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">选择「页头 Header」或「页脚 Footer」后，将在此 tab 内直接编辑对应区块；编辑完成后点顶栏「保存页头/页脚」。</p>
            </div>
          </div>
        )
      )}

      {/* ---------- Tab：样式和主题（并入左栏内部，不再右侧展开） ---------- */}
      {tab === 'theme' && (
        <ThemeTab
          themePresets={themePresets}
          theme={theme}
          setTheme={setTheme}
          applyPreset={applyPreset}
          saveTheme={saveTheme}
          themeSaved={themeSaved}
        />
      )}
    </div>
  );
}
