/**
 * 编辑器右栏：区块设置（组件类型 + 样式分组 + SchemaForm 内容）。
 * v3.5：从 BlockEditor.tsx 拆出。
 */
import { BLOCK_SCHEMAS, SCHEMA_MAP } from '../../lib/blocks';
import type { Draft } from '../../lib/blockPreview';
import { Icon } from '../../lib/editorParts';
import { SchemaForm } from '../../components/SchemaForm';

export default function SettingsPanel({ cur, selected, count, move, duplicate, remove, changeType, variants, update }: {
  cur: Draft | undefined;
  selected: number;
  count: number;
  move: (i: number, dir: -1 | 1) => void;
  duplicate: (i: number) => void;
  remove: (i: number) => void;
  changeType: (i: number, type: string) => void;
  variants: { value: string; label: string }[];
  update: (i: number, patch: Partial<Draft>) => void;
}) {
  const schemaOf = (type: string) => SCHEMA_MAP[type] ?? BLOCK_SCHEMAS[0];
  return (
    <div className="w-96 border-r border-slate-200 bg-white flex flex-col min-w-0 order-2">
      <div className="px-4 py-3.5 border-b border-slate-200 flex justify-between items-center shrink-0">
        <h3 className="text-[13px] font-bold text-slate-800 tracking-tight">区块设置</h3>
        {cur && (
          <div className="flex gap-1">
            <button onClick={() => move(selected, -1)} disabled={selected === 0} title="上移"
              className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition">{Icon.up}</button>
            <button onClick={() => move(selected, 1)} disabled={selected === count - 1} title="下移"
              className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition">{Icon.down}</button>
            <button onClick={() => duplicate(selected)} disabled={!cur} title="复制"
              className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 transition">{Icon.copy}</button>
            <button onClick={() => remove(selected)} disabled={!cur} title="删除"
              className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-red-400 hover:text-red-600 disabled:opacity-30 transition">{Icon.trash}</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {cur ? (
          <>
            {/* 组件类型 */}
            <div className="mb-3.5">
              <span className="text-xs font-medium text-slate-600 block mb-1.5">组件类型</span>
              <div className="relative">
                <select
                  value={cur.block_type}
                  onChange={(e) => changeType(selected, e.target.value)}
                  className="w-full border border-slate-200 rounded-lg bg-white px-2.5 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer"
                >
                  {BLOCK_SCHEMAS.map((s) => <option key={s.type} value={s.type}>{s.label}</option>)}
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{Icon.down}</span>
              </div>
            </div>

            {/* ===== 样式分组（v3.5：所有样式统一在此配置） ===== */}
            <div className="mb-3.5">
              <span className="text-xs font-medium text-slate-600 block mb-1.5">样式</span>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {/* 视觉变体 */}
                {variants.length > 0 && (
                  <div className="p-3">
                    <span className="text-[11px] text-slate-500 block mb-2">视觉变体</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {variants.map((v) => {
                        const on = (cur.content_json.variant ?? variants[0].value) === v.value;
                        return (
                          <button key={v.value} onClick={() => update(selected, { content_json: { ...cur.content_json, variant: v.value } })}
                            className={`flex items-center gap-1.5 px-2.5 py-2 text-[11px] rounded-lg border transition ${on ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-200' : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-slate-50'}`}>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${on ? 'bg-blue-500' : 'bg-slate-300'}`} />
                            <span className="flex-1 truncate text-left">{v.label}</span>
                            {on && <span className="text-blue-600 shrink-0">{Icon.check}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 对齐方式（Hero / 富文本等支持左右排版） */}
                <div className="p-3">
                  <span className="text-[11px] text-slate-500 block mb-2">对齐方式</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[['center', '居中'], ['left', '左对齐']].map(([val, label]) => {
                      const on = (cur.content_json.align ?? 'center') === val;
                      return (
                        <button key={val} onClick={() => update(selected, { content_json: { ...cur.content_json, align: val } })}
                          className={`flex items-center justify-center gap-1.5 px-2.5 py-2 text-[11px] rounded-lg border transition ${on ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-200' : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-slate-50'}`}>
                            {on && <span className="text-blue-600 shrink-0">{Icon.check}</span>}
                            <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 区块间距 */}
                <div className="p-3">
                  <span className="text-[11px] text-slate-500 block mb-2">区块间距 (px)</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10.5px] text-slate-400 block mb-1">上边距</span>
                      <div className="relative">
                        <input type="number" className="w-full border border-slate-200 rounded-lg bg-white px-2.5 py-2 pr-8 text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                          value={cur.content_json.paddingTop ?? ''}
                          onChange={(e) => update(selected, { content_json: { ...cur.content_json, paddingTop: e.target.value === '' ? undefined : Number(e.target.value) } })} placeholder="默认" />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">px</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-slate-400 block mb-1">下边距</span>
                      <div className="relative">
                        <input type="number" className="w-full border border-slate-200 rounded-lg bg-white px-2.5 py-2 pr-8 text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                          value={cur.content_json.paddingBottom ?? ''}
                          onChange={(e) => update(selected, { content_json: { ...cur.content_json, paddingBottom: e.target.value === '' ? undefined : Number(e.target.value) } })} placeholder="默认" />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">px</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 颜色与圆角 */}
                <div className="p-3">
                  <span className="text-[11px] text-slate-500 block mb-2">颜色与圆角</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10.5px] text-slate-400 block mb-1">背景色</span>
                      <div className="flex gap-1.5 items-center">
                        <input type="color" value={cur.content_json.bgColor ?? '#ffffff'}
                          onChange={(e) => update(selected, { content_json: { ...cur.content_json, bgColor: e.target.value } })}
                          className="w-8 h-8 rounded border border-slate-200 bg-white cursor-pointer shrink-0 p-0.5" />
                        <input value={cur.content_json.bgColor ?? ''}
                          onChange={(e) => update(selected, { content_json: { ...cur.content_json, bgColor: e.target.value === '' ? undefined : e.target.value } })}
                          placeholder="默认" className="flex-1 min-w-0 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-mono focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-slate-400 block mb-1">文字色</span>
                      <div className="flex gap-1.5 items-center">
                        <input type="color" value={cur.content_json.textColor ?? '#0f172a'}
                          onChange={(e) => update(selected, { content_json: { ...cur.content_json, textColor: e.target.value } })}
                          className="w-8 h-8 rounded border border-slate-200 bg-white cursor-pointer shrink-0 p-0.5" />
                        <input value={cur.content_json.textColor ?? ''}
                          onChange={(e) => update(selected, { content_json: { ...cur.content_json, textColor: e.target.value === '' ? undefined : e.target.value } })}
                          placeholder="默认" className="flex-1 min-w-0 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-mono focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-slate-400 block mb-1">圆角 (px)</span>
                      <div className="relative">
                        <input type="number" className="w-full border border-slate-200 rounded-lg bg-white px-2.5 py-2 pr-8 text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                          value={cur.content_json.radius ?? ''}
                          onChange={(e) => update(selected, { content_json: { ...cur.content_json, radius: e.target.value === '' ? undefined : Number(e.target.value) } })} placeholder="默认" />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">px</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-slate-400 block mb-1">容器宽度</span>
                      <div className="relative">
                        <input type="number" className="w-full border border-slate-200 rounded-lg bg-white px-2.5 py-2 pr-8 text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                          value={cur.content_json.maxWidth ?? ''}
                          onChange={(e) => update(selected, { content_json: { ...cur.content_json, maxWidth: e.target.value === '' ? undefined : Number(e.target.value) } })} placeholder="默认" />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">px</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 字段表单（内容分组折叠） */}
            <SchemaForm
              grouped
              fields={schemaOf(cur.block_type).fields}
              value={cur.content_json}
              onChange={(v) => update(selected, { content_json: v })}
            />
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-3xl mb-3">👆</div>
            <p className="text-xs text-slate-400 leading-relaxed">点击左侧图层或画布中的区块<br />在这里配置它的内容与样式</p>
          </div>
        )}
      </div>
    </div>
  );
}
