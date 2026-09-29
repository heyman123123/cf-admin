import { useEffect, useState } from 'react';
import { api, type LeadItem } from '../lib/api';

const STATUS_LABEL: Record<LeadItem['status'], string> = {
  new: '新线索',
  contacting: '跟进中',
  qualified: '已确认',
  lost: '已流失',
  won: '已赢单',
};

export default function Leads() {
  const [rows, setRows] = useState<LeadItem[]>([]);

  useEffect(() => {
    api.listLeads().then(setRows);
  }, []);

  const advance = async (lead: LeadItem) => {
    const order: LeadItem['status'][] = ['new', 'contacting', 'qualified', 'won'];
    const next = order[Math.min(order.indexOf(lead.status) + 1, order.length - 1)];
    await api.updateLead(lead.id, { status: next });
    setRows((rs) => rs.map((r) => (r.id === lead.id ? { ...r, status: next } : r)));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">线索 / 客户</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-4 py-3">客户</th>
              <th className="text-left px-4 py-3">公司</th>
              <th className="text-left px-4 py-3">来源</th>
              <th className="text-left px-4 py-3">状态</th>
              <th className="text-left px-4 py-3">创建时间</th>
              <th className="text-left px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-gray-400 text-xs">{r.email} · {r.phone ?? '-'}</div>
                </td>
                <td className="px-4 py-3">{r.company_name ?? '-'}</td>
                <td className="px-4 py-3">{r.source}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-xs">
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3">{new Date(r.created_at * 1000).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => advance(r)} className="text-blue-600 hover:underline text-xs">
                  推进阶段 →
                </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  暂无线索。提交一次官网表单试试。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
