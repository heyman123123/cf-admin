/**
 * SchemaForm：根据 BlockSchema 自动渲染配置表单。
 * 支持：输入框 / 文本域 / 下拉 / 颜色 / 开关 / 数字 / 对象分组 / 数组表格 / JSON。
 */
import React from 'react';
import type { FieldDef, JsonObject } from '../lib/blocks';

const inputCls = 'w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500';
const labelCls = 'text-xs font-medium text-gray-500 block mb-1';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className={labelCls}>{children}</span>;
}

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
      <FieldLabel>{field.label}</FieldLabel>
      {rows.length === 0 ? (
        <div className="text-xs text-gray-400 border border-dashed rounded p-3 text-center">暂无数据</div>
      ) : (
        <div className="border rounded overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                {field.fields.map((f) => (
                  <th key={f.key} className="text-left px-2 py-2 font-medium text-gray-500 whitespace-nowrap">
                    {(f as any).label}
                  </th>
                ))}
                <th className="px-2 py-2 w-24 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t align-top">
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
      <button onClick={addRow} className="mt-1.5 text-xs text-blue-600 hover:text-blue-700">
        {field.addLabel ?? '+ 添加'}
      </button>
    </div>
  );
}

function CellEditor({ field, value, onChange, compact }: {
  field: FieldDef;
  value: any;
  onChange: (v: any) => void;
  compact?: boolean;
}) {
  const cls = compact ? 'w-full border rounded px-1.5 py-1 text-xs' : inputCls;
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

export function SchemaForm({ fields, value, onChange }: {
  fields: FieldDef[];
  value: JsonObject;
  onChange: (v: JsonObject) => void;
}) {
  const set = (key: string, v: any) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-3">
      {fields.map((field) => {
        switch (field.type) {
          case 'object':
            return (
              <div key={field.key} className="border rounded p-3 bg-gray-50/60">
                <FieldLabel>{field.label}</FieldLabel>
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
              <div key={field.key}>
                <FieldLabel>{(field as any).label}</FieldLabel>
                <CellEditor field={field} value={value[field.key]} onChange={(v) => set(field.key, v)} />
              </div>
            );
        }
      })}
    </div>
  );
}
