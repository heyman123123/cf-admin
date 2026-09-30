/**
 * Block 可视化编辑器（v3.6 · Shopify Theme Editor 范式 · 商业化 UI）
 * 布局：全局顶栏（编辑器级，跨三栏）+ 左 Layers/全局布局/主题 + 中画布（点选即配） + 右设置面板。
 * v3.5 特性：画布点击选中不跳顶、样式分组、全局 Header/Footer、版本历史、组件库缩略图。
 * v3.6：页面画布渲染全局 Header/Footer（可点击切到布局编辑）；组件库按编辑模式过滤；左栏加宽。
 * v3.7：显隐勾选即时生效（本地 state 同步，失败回滚）。
 */
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type BlockItem } from '../lib/api';
import { BLOCK_SCHEMAS, BLOCK_GROUPS, SCHEMA_MAP, migrateContent, getVariants, defaultVariant } from '../lib/blocks';
import { renderBlockPreview, themeCssLine, type Draft } from '../lib/blockPreview';
import { PREVIEW_CSS } from '../lib/blockPreviewCss';
import { useHistory, Icon } from '../lib/editorParts';
import TopBar, { type VersionRow } from './BlockEditor/TopBar';
import LeftPanel, { type Tab } from './BlockEditor/LeftPanel';
import ThemeTab from './BlockEditor/ThemeTab';
import SettingsPanel from './BlockEditor/SettingsPanel';
import Canvas from './BlockEditor/Canvas';
import Overlays from './BlockEditor/Overlays';

export default function BlockEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const history = useHistory<Draft[]>([]);
  const { state: blocks, set: setBlocks, undo, redo, canUndo, canRedo } = history;

  const [selected, setSelected] = useState(0);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [layersOpen, setLayersOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('blocks');
  const [pop, setPop] = useState<{ i: number; pos: 'above' | 'below'; x: number; y: number } | null>(null);
  const [theme, setTheme] = useState<Record<string, string>>({});
  const [themePresets, setThemePresets] = useState<{ key: string; name: string; vars: Record<string, string> }[]>([]);
  const [themeSaved, setThemeSaved] = useState(false);

  // v3.5：组件库缩略图 / 全局布局 / 页面开关 / 版本历史 / iframe 滚动保持
  const [hoverType, setHoverType] = useState<string | null>(null);
  const [layoutPart, setLayoutPart] = useState<'header' | 'footer' | null>(null);
  const [layoutBlocks, setLayoutBlocks] = useState<Record<'header' | 'footer', Draft[]>>({ header: [], footer: [] });
  const [showHeader, setShowHeader] = useState(1);
  const [showFooter, setShowFooter] = useState(1);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [versionOpen, setVersionOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollTopRef = useRef(0);
  const isLayout = layoutPart !== null;
  const shownBlocks = isLayout ? layoutBlocks[layoutPart!] : blocks;

  const loadVersions = () => {
    api.listPageVersions(id!).then(setVersions).catch(() => undefined);
  };

  // 页面显隐开关（读取当前页设置）
  useEffect(() => {
    api.listPages().then((ps) => {
      const p = ps.find((x) => x.id === id);
      if (p) {
        setShowHeader(p.showHeader ?? 1);
        setShowFooter(p.showFooter ?? 1);
      }
    }).catch(() => undefined);
    loadVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 全局布局（Header/Footer）
  useEffect(() => {
    api.getLayout('header').then((r) => setLayoutBlocks((p) => ({ ...p, header: (r.blocks ?? []).map((b) => ({ block_type: b.block_type, sort_order: b.sort_order, content_json: migrateContent(b.block_type, b.content_json as any) })) }))).catch(() => undefined);
    api.getLayout('footer').then((r) => setLayoutBlocks((p) => ({ ...p, footer: (r.blocks ?? []).map((b) => ({ block_type: b.block_type, sort_order: b.sort_order, content_json: migrateContent(b.block_type, b.content_json as any) })) }))).catch(() => undefined);
  }, []);

  // 切换编辑目标（页面 / Header / Footer）时重置选中
  const switchTarget = (part: 'header' | 'footer' | null) => {
    setLayoutPart(part);
    setSelected(0);
    setHidden(new Set());
    setHoverType(null);
    setPop(null);
    setQuery('');
  };

  useEffect(() => {
    api.listBlocks(id!).then((rows: BlockItem[]) => {
      setBlocks(rows.map((r) => ({
        block_type: r.blockType,
        sort_order: r.sortOrder,
        content_json: migrateContent(r.blockType, JSON.parse(r.contentJson)),
      })), false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 加载主题（编辑器内「样式和主题」tab 使用）
  useEffect(() => {
    api.getTheme().then((r) => {
      setTheme(r.theme);
      setThemePresets(r.presets);
    }).catch(() => undefined);
  }, []);

  const applyPreset = (vars: Record<string, string>) => {
    setTheme(vars);
    setThemeSaved(false);
  };

  const saveTheme = async () => {
    try {
      await api.saveTheme(theme);
      setThemeSaved(true);
      setTimeout(() => setThemeSaved(false), 2000);
    } catch (e) {
      alert(String(e));
    }
  };

  // 点选即配：iframe 内点击区块 → postMessage → 选中（消息切换描边，不重建 iframe）
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'cf-block-click' && typeof e.data.ix === 'number') {
        setSelected(e.data.ix);
      } else if (e.data?.type === 'cf-layout-click' && (e.data.part === 'header' || e.data.part === 'footer')) {
        // v3.6：点击画布中的全局 Header/Footer → 切换到对应布局编辑
        switchTarget(e.data.part);
      } else if (e.data?.type === 'cf-scroll' && typeof e.data.top === 'number') {
        scrollTopRef.current = e.data.top;
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 选中变化 → 向 iframe 发消息切换描边（不重建 srcDoc，避免跳顶）
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'cf-select', ix: selected }, '*');
  }, [selected, isLayout, shownBlocks]);

  // Ctrl+Z / Ctrl+Shift+Z 快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo]);

  /** 双模式写入：页面模式走 history(可撤销)，布局模式走 layoutBlocks */
  const setShown = (fn: (bs: Draft[]) => Draft[]) => {
    if (isLayout) setLayoutBlocks((prev) => ({ ...prev, [layoutPart!]: fn(prev[layoutPart!]) }));
    else setBlocks(fn);
  };

  const update = (i: number, patch: Partial<Draft>) => {
    setShown((bs) => bs.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  };

  /** 打开组件库浮层：锚定左栏右边缘，垂直对齐触发按钮所在行 */
  const openPop = (e: ReactMouseEvent<HTMLButtonElement>, i: number, pos: 'above' | 'below') => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    const leftEdge = document.querySelector<HTMLElement>('.editor-left')?.getBoundingClientRect().right;
    const x = (leftEdge ?? r.right) + 10;
    setPop({ i, pos, x, y: Math.max(8, r.top - 12) });
  };

  const move = (i: number, dir: -1 | 1) => {
    setShown((bs) => {
      const next = [...bs];
      const [item] = next.splice(i, 1);
      next.splice(i + dir, 0, item);
      return next.map((b, idx) => ({ ...b, sort_order: idx }));
    });
    setSelected((s) => Math.max(0, Math.min(s + dir, shownBlocks.length - 1)));
  };

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= shownBlocks.length || to >= shownBlocks.length) return;
    setShown((bs) => {
      const next = [...bs];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next.map((b, idx) => ({ ...b, sort_order: idx }));
    });
    setSelected(to);
  };

  const duplicate = (i: number) => {
    setShown((bs) => {
      const copy = { ...bs[i], content_json: JSON.parse(JSON.stringify(bs[i].content_json)) };
      const next = [...bs];
      next.splice(i + 1, 0, copy);
      return next.map((b, idx) => ({ ...b, sort_order: idx }));
    });
    setSelected(Math.min(i + 1, shownBlocks.length));
  };

  const remove = (i: number) => {
    setShown((bs) => bs.filter((_, idx) => idx !== i).map((b, idx) => ({ ...b, sort_order: idx })));
    setHidden((h) => {
      const n = new Set<number>();
      h.forEach((v) => n.add(v > i ? v - 1 : v));
      return n;
    });
    setSelected(Math.max(0, i - 1));
  };

  const toggleHidden = (i: number) => {
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });
  };

  const addBlock = (type: string) => {
    const schema = SCHEMA_MAP[type];
    if (!schema) return;
    const block: Draft = { block_type: type, sort_order: shownBlocks.length, content_json: { ...schema.defaults(), variant: defaultVariant(type) } };
    setShown((bs) => [...bs, block]);
    setSelected(shownBlocks.length);
  };

  /** 在指定位置插入组件（Popover 使用）：above → 插到 i，below → 插到 i+1 */
  const addBlockAt = (type: string, target: { i: number; pos: 'above' | 'below' }) => {
    const schema = SCHEMA_MAP[type];
    if (!schema) return;
    const at = Math.max(0, Math.min(target.i + (target.pos === 'above' ? 0 : 1), shownBlocks.length));
    const block: Draft = { block_type: type, sort_order: at, content_json: { ...schema.defaults(), variant: defaultVariant(type) } };
    setShown((bs) => [...bs.slice(0, at), block, ...bs.slice(at)].map((b, idx) => ({ ...b, sort_order: idx })));
    setSelected(at);
    setPop(null);
    setQuery('');
  };

  const changeType = (i: number, type: string) => {
    const schema = SCHEMA_MAP[type];
    if (!schema) return;
    update(i, { block_type: type, content_json: { ...schema.defaults(), variant: defaultVariant(type) } });
  };

  const save = async (publish: boolean) => {
    setSaving('saving');
    try {
      if (isLayout) {
        await api.saveLayout(layoutPart!, layoutBlocks[layoutPart!]);
      } else {
        await api.saveBlocks(id!, blocks);
        if (publish) {
          await api.publishPage(id!);
          loadVersions();
        }
      }
      setSaving('saved');
      setTimeout(() => setSaving('idle'), 2000);
    } catch (e) {
      setSaving('idle');
      alert(String(e));
    }
  };

  // 页面级页头/页脚显隐开关（立即保存，本地 state 同步更新保证勾选即时生效）
  const savePageFlags = async (header: number, footer: number) => {
    setShowHeader(header);
    setShowFooter(footer);
    try {
      await api.updatePage(id!, { show_header: header, show_footer: footer });
      setSaving('saved');
      setTimeout(() => setSaving('idle'), 2000);
    } catch (e) {
      // 保存失败回滚勾选
      setShowHeader(showHeader);
      setShowFooter(showFooter);
      alert(String(e));
    }
  };

  // 从历史版本恢复到草稿
  const restore = async (vid: string) => {
    if (!confirm('确定恢复到该版本？当前未保存的编辑将被覆盖（不会自动发布）。')) return;
    try {
      await api.restoreVersion(id!, vid);
      const rows = await api.listBlocks(id!);
      setBlocks(rows.map((r) => ({
        block_type: r.blockType,
        sort_order: r.sortOrder,
        content_json: migrateContent(r.blockType, JSON.parse(r.contentJson)),
      })), false);
      loadVersions();
      setVersionOpen(false);
      setSaving('saved');
      setTimeout(() => setSaving('idle'), 2000);
    } catch (e) {
      alert(String(e));
    }
  };

  // 组件缩略图：hover 组件项时用默认内容渲染迷你预览
  const miniHtml = (type: string) => {
    const schema = SCHEMA_MAP[type];
    const body = renderBlockPreview({
      block_type: type,
      sort_order: 0,
      content_json: { ...schema.defaults(), variant: defaultVariant(type) },
    });
    return `<!doctype html><html><head><meta charset="utf-8"><style>${PREVIEW_CSS}:root{${themeCssLine(theme)}}</style></head><body style="margin:0">${body}</body></html>`;
  };

  // 画布 HTML：可见区块按序渲染；选中描边由 iframe 消息切换（不重建）
  // v3.6：页面模式画布同时渲染全局 Header/Footer（带"全局"标记，点击切到对应布局编辑）
  const previewHtml = useMemo(() => {
    const list = shownBlocks;
    const emptyText = isLayout
      ? `空${layoutPart === 'header' ? '页头' : '页脚'} · 从左侧添加区块`
      : '空页面 · 从左侧添加区块';
    const layoutOf = (bs: Draft[], part: 'header' | 'footer') => bs
      .map((b, i) => `<div class="cf-block cf-global" data-tag="全局 · ${part === 'header' ? '页头' : '页脚'}" onclick="event.stopPropagation();parent.postMessage({type:'cf-layout-click',part:'${part}'},'*')">${renderBlockPreview(b)}</div>`)
      .join('');
    const headerHtml = isLayout ? '' : layoutOf(layoutBlocks.header, 'header');
    const footerHtml = isLayout ? '' : layoutOf(layoutBlocks.footer, 'footer');
    const body = headerHtml
      + list
        .map((b, i) => (hidden.has(i) ? '' : `<div class="cf-block" data-ix="${i}" onclick="event.stopPropagation();parent.postMessage({type:'cf-block-click',ix:${i}},'*')">${renderBlockPreview(b)}</div>`))
        .join('')
      + footerHtml;
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${PREVIEW_CSS}:root{${themeCssLine(theme)}}</style></head><body style="margin:0">${body || `<div style="padding:80px;text-align:center;color:#94a3b8">${emptyText}</div>`}<script>
window.addEventListener('message',function(e){
  if(e.data&&e.data.type==='cf-select'){
    document.querySelectorAll('.cf-selected').forEach(function(el){el.classList.remove('cf-selected');});
    var el=document.querySelector('[data-ix="'+e.data.ix+'"]');
    if(el)el.classList.add('cf-selected');
  }
});
document.addEventListener('scroll',function(){parent.postMessage({type:'cf-scroll',top:(document.documentElement.scrollTop||document.body.scrollTop)},'*');},{passive:true});
window.scrollTo(0,${scrollTopRef.current});
</script></body></html>`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownBlocks, hidden, theme, isLayout, layoutPart, layoutBlocks]);

  const cur = shownBlocks[selected];
  const variants = cur ? getVariants(cur.block_type) : [];
  // v3.6：组件库按编辑模式过滤——页面模式隐藏全局布局组件；布局模式只显示布局+基础组件
  const libSchemas = BLOCK_SCHEMAS.filter((s) => (isLayout ? s.group === '布局' || s.group === '基础' : s.group !== '布局'));
  const ql = query.trim().toLowerCase();
  const visibleSchemas = ql ? libSchemas.filter((s) => s.label.toLowerCase().includes(ql) || s.type.toLowerCase().includes(ql)) : libSchemas;
  const groupsWithSchemas = BLOCK_GROUPS
    .map((g) => ({ g, list: visibleSchemas.filter((s) => s.group === g) }))
    .filter((x) => x.list.length > 0);

  const deviceWidth = device === 'mobile' ? 375 : device === 'tablet' ? 768 : '100%';

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden">
      {/* ======== 全局顶栏（属于整个编辑器，跨三栏） ======== */}
      <TopBar
        saving={saving}
        isLayout={isLayout}
        layoutPart={layoutPart}
        canUndo={canUndo}
        canRedo={canRedo}
        undo={undo}
        redo={redo}
        device={device}
        setDevice={setDevice}
        versions={versions}
        loadVersions={loadVersions}
        setVersionOpen={setVersionOpen}
        save={save}
        nav={nav}
      />

      {/* ======== 三栏主体 ======== */}
      <div className="flex flex-1 min-h-0">
        {/* 左：页面区块 / 全局布局 / 样式和主题（tab 切换） */}
        <LeftPanel
          tab={tab}
          setTab={setTab}
          layersOpen={layersOpen}
          setLayersOpen={setLayersOpen}
          shownBlocks={shownBlocks}
          selected={selected}
          setSelected={setSelected}
          hidden={hidden}
          toggleHidden={toggleHidden}
          duplicate={duplicate}
          remove={remove}
          reorder={reorder}
          dragFrom={dragFrom}
          setDragFrom={setDragFrom}
          dragOver={dragOver}
          setDragOver={setDragOver}
          openPop={openPop}
          isLayout={isLayout}
          layoutPart={layoutPart}
          layoutBlocks={layoutBlocks}
          switchTarget={switchTarget}
          showHeader={showHeader}
          showFooter={showFooter}
          savePageFlags={savePageFlags}
        />
        {tab === 'theme' && !isLayout && (
          <ThemeTab
            themePresets={themePresets}
            theme={theme}
            setTheme={setTheme}
            applyPreset={applyPreset}
            saveTheme={saveTheme}
            themeSaved={themeSaved}
          />
        )}

        {/* 右：设置面板（order-2 → 视觉最右） */}
        <SettingsPanel
          cur={cur}
          selected={selected}
          count={shownBlocks.length}
          move={move}
          duplicate={duplicate}
          remove={remove}
          changeType={changeType}
          variants={variants}
          update={update}
        />

        {/* 中：画布（order-1 → 视觉中间，无独立顶栏） */}
        <Canvas previewHtml={previewHtml} device={device} deviceWidth={deviceWidth} iframeRef={iframeRef} />
      </div>

      {/* 浮层：组件库 Popover + 版本历史弹层 */}
      <Overlays
        pop={pop}
        setPop={setPop}
        query={query}
        setQuery={setQuery}
        groupsWithSchemas={groupsWithSchemas}
        visibleSchemas={visibleSchemas}
        hoverType={hoverType}
        setHoverType={setHoverType}
        addBlockAt={addBlockAt}
        miniHtml={miniHtml}
        shownBlocks={shownBlocks}
        versionOpen={versionOpen}
        setVersionOpen={setVersionOpen}
        versions={versions}
        restore={restore}
      />
    </div>
  );
}
