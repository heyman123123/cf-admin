import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-500', contacting: 'bg-amber-500',
  qualified: 'bg-cyan-500', lost: 'bg-gray-400', won: 'bg-green-500',
};
const STATUS_LABEL: Record<string, string> = {
  new: '新线索', contacting: '跟进中', qualified: '已确认', lost: '已流失', won: '已赢单',
};

export default function Dashboard() {
  const [stats, setStats] = useState<{ total: number; new_last_30d: number; by_status: { status: string; c: number }[] }>();
  useEffect(() => { api.stats().then(setStats); }, []);
  if (!stats) return <p className="text-gray-400">加载中…</p>;
  const max = Math.max(1, ...stats.by_status.map((s) => s.c));
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">数据看板</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-5 shadow-sm"><div className="text-sm text-gray-500">总线索</div><div className="text-3xl font-bold mt-1">{stats.total}</div></div>
        <div className="bg-white rounded-lg p-5 shadow-sm"><div className="text-sm text-gray-500">近 30 天新增</div><div className="text-3xl font-bold mt-1">{stats.new_last_30d}</div></div>
        <div className="bg-white rounded-lg p-5 shadow-sm"><div className="text-sm text-gray-500">赢单率</div><div className="text-3xl font-bold mt-1">{stats.total ? Math.round(((stats.by_status.find((s) => s.status === 'won')?.c ?? 0) / stats.total) * 100) : 0}%</div></div>
      </div>
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="font-semibold mb-4">线索阶段分布</h2>
        <div className="space-y-3">
          {stats.by_status.map((s) => (
            <div key={s.status} className="flex items-center gap-3">
              <div className="w-20 text-sm text-gray-600">{STATUS_LABEL[s.status] ?? s.status}</div>
              <div className="flex-1 bg-gray-100 rounded h-5"><div className={`h-5 rounded ${STATUS_COLOR[s.status] ?? 'bg-gray-500'}`} style={{ width: `${(s.c / max) * 100}%` }} /></div>
              <div className="w-10 text-right text-sm">{s.c}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
