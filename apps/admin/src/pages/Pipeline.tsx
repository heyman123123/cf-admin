import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type LeadItem } from '../lib/api';

const STAGES: { key: LeadItem['status']; label: string }[] = [
  { key: 'new', label: '初步接洽' },
  { key: 'contacting', label: '方案演示' },
  { key: 'qualified', label: '商务报价' },
  { key: 'won', label: '赢单' },
  { key: 'lost', label: '输单' },
];

export default function Pipeline() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  useEffect(() => { api.listLeads().then(setLeads); }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">商机漏斗</h1>
      <div className="grid grid-cols-5 gap-4">
        {STAGES.map((s) => {
          const items = leads.filter((l) => l.status === s.key);
          return (
            <div key={s.key} className="bg-gray-100 rounded-lg p-3">
              <div className="text-sm font-semibold mb-2 flex justify-between">
                <span>{s.label}</span><span className="text-gray-400">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((l) => (
                  <Link key={l.id} to={`/leads/${l.id}`} className="block bg-white p-3 rounded shadow-sm text-sm hover:shadow">
                    <div className="font-medium">{l.name}</div>
                    <div className="text-gray-400 text-xs">{l.company_name ?? l.email}</div>
                    {l.deal_value > 0 && <div className="text-green-600 text-xs mt-1">¥{l.deal_value}</div>}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
