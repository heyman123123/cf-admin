import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Login() {
  const nav = useNavigate();
  const [username, setU] = useState('admin');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.login(username, password);
      nav('/dashboard');
    } catch {
      setErr('用户名或密码错误');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={submit} className="bg-white p-8 rounded-lg shadow-sm w-96">
        <h1 className="text-xl font-bold mb-6">cf-admin 登录</h1>
        {err && <div className="text-red-500 text-sm mb-3">{err}</div>}
        <label className="block text-sm mb-2">用户名</label>
        <input className="w-full border rounded px-3 py-2 mb-4" value={username} onChange={(e) => setU(e.target.value)} />
        <label className="block text-sm mb-2">密码</label>
        <input type="password" className="w-full border rounded px-3 py-2 mb-6" value={password} onChange={(e) => setP(e.target.value)} />
        <button className="w-full bg-brand text-white py-2 rounded">登录</button>
      </form>
    </div>
  );
}
