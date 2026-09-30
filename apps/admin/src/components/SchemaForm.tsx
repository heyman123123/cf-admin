/**
 * SchemaForm：根据 BlockSchema 自动渲染配置表单。
 * 支持：输入框 / 文本域 / 下拉 / 颜色 / 开关 / 数字 / 对象分组 / 数组表格 / JSON。
 * v3 新增：字段分组折叠（grouped）+ 字段说明（description）。
 */
import React from 'react';
import type { FieldDef, JsonObject } from '../lib/blocks';

const inputCls =
  'w-full border border-gray-200 rounded-lg bg-white px-2.5 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:shadow-none transition';
const labelCls = 'text-xs font-medium text-gray-600 block mb-1.5';

function FieldLabel({ children, desc }: { children: React.ReactNode; desc?: string }) {
  return (
    <>
      <span className={labelCls}>{children}</span>
      {desc && <p className="text-[11px] text-gray-400 mt-0.5 mb-1.5 leading-relaxed">{desc}</p>}
    </>
  );
}

/* ---------------- 数组表格（可编辑） ---------------- */

function ArrayTable({ field, value, onChange }: {
  field: Extract<FieldDef, { type: 'array' }>;
  value: JsonObject[] | undefined;
  onChange: (v: JsonObject[]) => void;
}) {
  const rows = Array.isArray(value) ? value : [];
  const setRow = (i: number, patch: JsonObject) => {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const addRow = () => onChange([...rows, {}]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const moveRow = (i: number, dir: -1 | 1) => {
    const next = [...rows];
    const [item] = next.splice(i, 1);
    next.splice(i + dir, 0, item);
    onChange(next);
  };

  return (
    <div className="mb-4">
      <FieldLabel desc={(field as any).description}>{field.label}</FieldLabel>
      {rows.length === 0 ? (
        <div className="text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50/50">暂无数据</div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                {field.fields.map((f) => (
                  <th key={f.key} className="text-left px-2.5 py-2 font-semibold text-gray-500 whitespace-nowrap border-b border-gray-200">
                    {(f as any).label}
                  </th>
                ))}
                <th className="px-2 py-2 w-24 text-right border-b border-gray-200">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-gray-100 first:border-t-0 hover:bg-blue-50/40 transition-colors">
                  {field.fields.map((f) => (
                    <td key={f.key} className="px-2 py-1.5">
                      <CellEditor field={f} value={row[f.key]} onChange={(v) => setRow(i, { [f.key]: v })} compact />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right whitespace-nowrap">
                    <button title="上移" onClick={() => moveRow(i, -1)} disabled={i === 0} className="text-gray-400 hover:text-blue-600 disabled:opacity-30 px-1">↑</button>
                    <button title="下移" onClick={() => moveRow(i, 1)} disabled={i === rows.length - 1} className="text-gray-400 hover:text-blue-600 disabled:opacity-30 px-1">↓</button>
                    <button title="删除" onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 px-1">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={addRow} className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
        <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 inline-flex items-center justify-center text-[10px] leading-none">+</span>
        {field.addLabel ?? '添加'}
      </button>
    </div>
  );
}

/* ---------------- 单元格编辑器（数组表格里用的紧凑版） ---------------- */

function CellEditor({ field, value, onChange, compact }: {
  field: FieldDef;
  value: any;
  onChange: (v: any) => void;
  compact?: boolean;
}) {
  const cls = compact
    ? 'w-full border border-gray-200 rounded-md px-1.5 py-1 text-xs bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition'
    : inputCls;
  switch (field.type) {
    case 'text':
      return <input className={cls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={(field as any).placeholder} />;
    case 'textarea':
      return <textarea className={cls + ' min-w-[160px]'} rows={(field as any).rows ?? 3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'select':
      return (
        <select className={cls} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {(field as any).options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case 'color':
      return <input type="color" className="w-10 h-7 border rounded cursor-pointer" value={value ?? '#000000'} onChange={(e) => onChange(e.target.value)} />;
    case 'bool':
      return (
        <label className="inline-flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="accent-blue-600" />
          <span className="text-xs text-gray-500">{(field as any).label}</span>
        </label>
      );
    case 'number':
      return <input type="number" className={cls} value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))} />;
    case 'json':
      return <textarea className={cls + ' font-mono min-w-[200px]'} rows={(field as any).rows ?? 4} value={typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)} onChange={(e) => { try { onChange(JSON.parse(e.target.value)); } catch { /* 边输入边解析会失败，等完整 JSON 再更新 */ } }} />;
    default:
      return null;
  }
}

/* ---------------- 分组折叠面板 ---------------- */

const GROUP_LABEL: Record<string, string> = {
  content: '内容',
  style: '样式',
  spacing: '间距',
  advanced: '高级',
};

function GroupPanel({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden mb-2.5 bg-white shadow-sm ${open ? '' : ''}`}>
      <button type="button" onClick={onToggle} className="w-full flex justify-between items-center px-3.5 py-2.5 bg-gray-50/80 hover:bg-gray-100 transition-colors text-left">
        <span className="text-xs font-bold text-gray-700">{title}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div className="p-3.5 border-t border-gray-100">{children}</div>}
    </div>
  );
}

/* ---------------- 完整表单 ---------------- */

export function SchemaForm({ fields, value, onChange, grouped }: {
  fields: FieldDef[];
  value: JsonObject;
  onChange: (v: JsonObject) => void;
  /** v3：按字段 group 分组折叠展示 */
  grouped?: boolean;
}) {
  const set = (key: string, v: any) => onChange({ ...value, [key]: v });

  const renderField = (field: FieldDef) => {
    switch (field.type) {
      case 'object':
        return (
          <div key={field.key} className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/70 mb-3">
            <FieldLabel desc={(field as any).description}>{field.label}</FieldLabel>
            <SchemaForm
              fields={field.fields}
              value={value[field.key] ?? {}}
              onChange={(v) => set(field.key, v)}
            />
          </div>
        );
      case 'array':
        return (
          <ArrayTable key={field.key} field={field} value={value[field.key]} onChange={(v) => set(field.key, v)} />
        );
      default:
        return (
          <div key={field.key} className="mb-3">
            <FieldLabel desc={(field as any).description}>{(field as any).label}</FieldLabel>
            <CellEditor field={field} value={value[field.key]} onChange={(v) => set(field.key, v)} />
          </div>
        );
    }
  };

  // v3 分组模式：按 fields 中的 group 归类；未标注的归入"内容"
  if (grouped) {
    const groups = new Map<string, FieldDef[]>();
    for (const f of fields) {
      const g = (f as any).group ?? 'content';
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(f);
    }
    const [open, setOpen] = React.useState<Record<string, boolean>>({ content: true });
    const toggle = (g: string) => setOpen((o) => ({ ...o, [g]: !o[g] }));
    return (
      <div className="space-y-0">
        {Array.from(groups.entries()).map(([g, fs]) => (
          <GroupPanel key={g} title={GROUP_LABEL[g] ?? g} open={open[g] ?? false} onToggle={() => toggle(g)}>
            {fs.map(renderField)}
          </GroupPanel>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {fields.map(renderField)}
    </div>
  );
}
