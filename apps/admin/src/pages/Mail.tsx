/**
 * 邮箱服务（v3 · MoeMail 能力对齐）
 * 创建临时/永久邮箱 → 收件箱 → 读信/分享/删除；发件（需配置 RESEND_API_KEY）
 */
import { useEffect, useState } from 'react';
import { api, type MailAccount, type MailMessage } from '../lib/api';

const TTL_OPTIONS = [
  { value: '1h', label: '1 小时' },
  { value: '24h', label: '24 小时' },
  { value: '3d', label: '3 天' },
  { value: 'forever', label: '永久' },
];

function fmt(ts?: number | null) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString('zh-CN', { hour12: false });
}

export default function Mail() {
  const [domains, setDomains] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [selected, setSelected] = useState<MailAccount | null>(null);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [detail, setDetail] = useState<MailMessage | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const [local, setLocal] = useState('');
  const [ttl, setTtl] = useState('24h');
  const [msg, setMsg] = useState('');

  const [sendTo, setSendTo] = useState('');
  const [sendSubj, setSendSubj] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [sendErr, setSendErr] = useState('');

  const load = async () => {
    const [d, a] = await Promise.all([api.mailDomains(), api.mailAccounts()]);
    setDomains(d.domains);
    setAccounts(a.accounts);
  };

  useEffect(() => { load().catch((e) => setMsg(String(e))); }, []);

  const create = async () => {
    setMsg('');
    if (!local) return setMsg('请输入邮箱前缀');
    try {
      await api.mailCreateAccount({ address: `${local}@${domains[0] ?? 'mail.example.com'}`, ttl });
      setLocal('');
      await load();
    } catch (e) { setMsg(String(e)); }
  };

  const openAccount = async (acc: MailAccount) => {
    setSelected(acc);
    setDetail(null);
    setShareUrl('');
    try {
      const r = await api.mailMessages(acc.address, 'inbox');
      setMessages(r.messages);
    } catch (e) { setMsg(String(e)); }
  };

  const openMessage = async (m: MailMessage) => {
    setDetail(m);
    setShareUrl('');
    if (!m.readAt) { api.mailMarkRead(m.id).catch(() => undefined); setMessages((ms) => ms.map((x) => (x.id === m.id ? { ...x, readAt: Math.floor(Date.now() / 1000) } : x))); }
  };

  const share = async () => {
    if (!detail) return;
    try {
      const r = await api.mailShare(detail.id);
      setShareUrl(`${location.origin}${r.url}`);
    } catch (e) { setMsg(String(e)); }
  };

  const delMsg = async (m: MailMessage) => {
    try {
      await api.mailDeleteMessage(m.id);
      setMessages((ms) => ms.filter((x) => x.id !== m.id));
      if (detail?.id === m.id) setDetail(null);
    } catch (e) { setMsg(String(e)); }
  };

  const send = async () => {
    setSendErr('');
    if (!sendTo || !sendSubj || !sendBody) return setSendErr('收件人 / 主题 / 正文必填');
    try {
      await api.mailSend({ to: sendTo, subject: sendSubj, text: sendBody });
      setSendTo(''); setSendSubj(''); setSendBody('');
      setSendErr('发送成功 ✓');
      if (selected) openAccount(selected);
    } catch (e) {
      const s = String(e);
      setSendErr(s.includes('RESEND_API_KEY') ? '发件未启用：请在 Worker 环境变量配置 RESEND_API_KEY（Resend）+ RESEND_FROM，并完成域名 SPF/DKIM 验证' : s);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">邮箱服务</h1>
          <p className="text-sm text-gray-500 mt-1">临时 / 永久邮箱 · 收件 · 发件（MoeMail 能力对齐）· 允许域名：{domains.join(', ') || '加载中…'}</p>
        </div>
      </div>

      {msg && <div className="mb-4 p-3 rounded bg-amber-50 border border-amber-200 text-amber-700 text-sm">{msg}</div>}

      {/* 创建邮箱 */}
      <div className="bg-white border rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">邮箱前缀</label>
          <input value={local} onChange={(e) => setLocal(e.target.value.toLowerCase())} placeholder="demo"
            className="border rounded px-3 py-2 text-sm w-48" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">有效期</label>
          <select value={ttl} onChange={(e) => setTtl(e.target.value)} className="border rounded px-3 py-2 text-sm">
            {TTL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button onClick={create} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">创建邮箱</button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* 邮箱列表 */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 font-bold text-sm">邮箱账号</div>
          <div className="divide-y max-h-[560px] overflow-auto">
            {accounts.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">暂无邮箱，先创建一个</div>}
            {accounts.map((a) => (
              <div key={a.id} className={`px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 ${selected?.id === a.id ? 'bg-blue-50' : ''}`} onClick={() => openAccount(a)}>
                <div>
                  <div className="text-sm font-medium">{a.address}</div>
                  <div className="text-xs text-gray-400">
                    {a.expiresAt ? `有效期至 ${fmt(a.expiresAt)}` : '永久邮箱'} · {a.role}
                  </div>
                </div>
                <button className="text-xs text-red-400 hover:text-red-600" onClick={async (e) => { e.stopPropagation(); await api.mailDeleteAccount(a.id); setSelected((s) => (s?.id === a.id ? null : s)); load(); }}>
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 收件箱 */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 font-bold text-sm">
            收件箱 {selected ? <span className="text-gray-400 font-normal">· {selected.address}</span> : null}
          </div>
          <div className="divide-y max-h-[560px] overflow-auto">
            {!selected && <div className="p-6 text-center text-gray-400 text-sm">选择左侧邮箱查看收件</div>}
            {selected && messages.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">暂无邮件</div>}
            {messages.map((m) => (
              <div key={m.id} className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${m.readAt ? '' : 'bg-blue-50/60'} ${detail?.id === m.id ? 'border-l-4 border-blue-500' : ''}`} onClick={() => openMessage(m)}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm truncate ${m.readAt ? 'text-gray-500' : 'font-bold'}`}>{m.subject || '(无主题)'}</span>
                  <span className="text-[11px] text-gray-400 shrink-0 ml-2">{fmt(m.createdAt)}</span>
                </div>
                <div className="text-xs text-gray-400 truncate mt-0.5">{m.fromAddr}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 详情 / 发件 */}
        <div className="bg-white border rounded-xl overflow-hidden flex flex-col max-h-[640px]">
          <div className="px-4 py-3 border-b bg-gray-50 font-bold text-sm">
            {detail ? '邮件详情' : '写信发件'}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {detail ? (
              <div>
                <div className="text-lg font-bold mb-1">{detail.subject || '(无主题)'}</div>
                <div className="text-xs text-gray-400 mb-3">
                  发件人：{detail.fromAddr} · 收件人：{detail.toAddr} · {fmt(detail.createdAt)}
                </div>
                <div className="border rounded-lg p-3 bg-gray-50/60 text-sm whitespace-pre-wrap min-h-[140px]">{detail.bodyText || '（无正文）'}</div>
                {shareUrl && (
                  <div className="mt-3 text-xs bg-green-50 border border-green-200 rounded p-2 break-all">
                    分享链接（公开可读）：<a className="text-blue-600" href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</a>
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button onClick={share} className="px-3 py-1.5 border rounded text-xs">生成分享链接</button>
                  <button onClick={() => delMsg(detail)} className="px-3 py-1.5 border rounded text-xs text-red-500">删除</button>
                  <button onClick={() => setDetail(null)} className="px-3 py-1.5 border rounded text-xs">关闭</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">收件人</label>
                  <input value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="user@example.com" className="border rounded px-3 py-2 text-sm w-full" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">主题</label>
                  <input value={sendSubj} onChange={(e) => setSendSubj(e.target.value)} className="border rounded px-3 py-2 text-sm w-full" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">正文</label>
                  <textarea value={sendBody} onChange={(e) => setSendBody(e.target.value)} rows={6} className="border rounded px-3 py-2 text-sm w-full" />
                </div>
                <button onClick={send} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">发送</button>
                {sendErr && <div className="text-xs text-amber-600">{sendErr}</div>}
                <div className="text-[11px] text-gray-400 leading-relaxed">
                  发件通过 Resend 投递。首次使用需在 Worker 配置 <code className="bg-gray-100 px-1 rounded">RESEND_API_KEY</code> 与 <code className="bg-gray-100 px-1 rounded">RESEND_FROM</code>，并在 Resend 完成域名 SPF/DKIM 验证。收件需在 Cloudflare Email Routing 将 Catch-all 转发到 <code className="bg-gray-100 px-1 rounded">POST /api/mail/incoming</code>（携带 <code className="bg-gray-100 px-1 rounded">x-mail-secret</code> 头）。
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
