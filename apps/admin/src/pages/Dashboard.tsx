import { useEffect, useState } from 'react';
import { api, type LeadItem } from '../lib/api';

export default function Dashboard() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listLeads().then((rows) => setLeads(rows)).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: '新线索', value: leads.filter((l) => l.status === 'new').length },
    { label: '跟进中', value: leads.filter((l) => l.status === 'contacting').length },
    { label: '已赢单', value: leads.filter((l) => l.status === 'won').length },
    { label: '总线索', value: leads.length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">数据看板</h1>
      {loading ? (
        <p className="text-gray-400">加载中…</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-lg p-5 shadow-sm">
              <div className="text-sm text-gray-500">{s.label}</div>
              <div className="text-3xl font-bold mt-1">{s.value}</div>
            </div>
          ))}
        </div>
      )}
      <p className="text-sm text-gray-400 mt-6">
        （近 30 天 PV / UV、渠道转化、漏斗图 待第 3 周接入）
      </p>
    </div>
  );
}
