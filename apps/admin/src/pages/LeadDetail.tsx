import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type LeadItem, type ActivityItem } from '../lib/api';

const TYPE_LABEL: Record<string, string> = { call: '电话', email: '邮件', meeting: '拜访', note: '备注' };

export default function LeadDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [lead, setLead] = useState<LeadItem>();
  const [acts, setActs] = useState<ActivityItem[]>([]);
  const [note, setNote] = useState('');
  const [type, setType] = useState<'call' | 'email' | 'meeting' | 'note'>('note');

  const refresh = async () => {
    const [l, a] = await Promise.all([api.getLead(id!), api.listActivities(id!)]);
    setLead(l); setActs(a);
  };
  useEffect(() => { refresh(); }, [id]);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    await api.addActivity(id!, { activity_type: type, note });
    setNote(''); refresh();
  };
  const advance = async (status: string) => { await api.updateLead(id!, { status }); refresh(); };

  if (!lead) return <p>加载中…</p>;
  return (
    <div>
      <button onClick={() => nav(-1)} className="text-sm text-gray-500 mb-4">← 返回</button>
      <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{lead.name}</h1>
            <div className="text-gray-500 mt-1">{lead.company_name ?? '-'} · {lead.email} · {lead.phone ?? '-'}</div>
            <div className="text-sm text-gray-400 mt-1">来源：{lead.source}</div>
          </div>
          <div className="flex gap-2">
            {['contacting', 'qualified', 'won', 'lost'].map((s) => (
              <button key={s} onClick={() => advance(s)} className="text-xs px-3 py-1 border rounded hover:bg-gray-50">设为 {s}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <form onSubmit={addNote} className="col-span-1 bg-white rounded-lg p-6 shadow-sm h-fit">
          <h2 className="font-semibold mb-3">新增跟进</h2>
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full border rounded px-2 py-1 mb-3">
            <option value="call">电话</option><option value="email">邮件</option>
            <option value="meeting">拜访</option><option value="note">备注</option>
          </select>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} className="w-full border rounded px-2 py-1 mb-3" placeholder="跟进内容…" />
          <button className="w-full bg-brand text-white py-2 rounded text-sm">保存跟进</button>
        </form>
        <div className="col-span-2 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="font-semibold mb-4">跟进时间线</h2>
          <div className="space-y-4">
            {acts.map((a) => (
              <div key={a.id} className="flex gap-3">
                <div className="w-16 text-xs text-gray-400 pt-0.5">{new Date(a.created_at * 1000).toLocaleDateString()}</div>
                <div className="flex-1 border-l-2 border-gray-200 pl-3">
                  <div className="text-xs text-blue-600">{TYPE_LABEL[a.activity_type]} · {a.created_by}</div>
                  <div className="text-sm mt-0.5">{a.note}</div>
                </div>
              </div>
            ))}
            {acts.length === 0 && <p className="text-gray-400 text-sm">暂无跟进记录</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
