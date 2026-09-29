import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const NAV_ITEMS = [
  { to: '/dashboard', label: '数据看板' },
  { to: '/leads', label: '线索 / 客户' },
  { to: '/pipeline', label: '商机漏斗' },
  { to: '/pages', label: '官网页面' },
  { to: '/media', label: '媒体资产' },
  { to: '/theme', label: '主题设置' },
  { to: '/mail', label: '邮箱服务' },
];

export default function Layout() {
  const navigate = useNavigate();
  const logout = async () => {
    await api.logout();
    navigate('/login');
  };
  return (
    <div className="flex h-full">
      <aside className="w-56 bg-brand text-white flex flex-col">
        <div className="px-5 py-5 text-lg font-bold border-b border-white/10">cf-admin</div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `block px-3 py-2 rounded-md text-sm ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="m-3 text-xs text-white/60 hover:text-white text-left">退出登录</button>
      </aside>
      <main className="flex-1 overflow-auto p-8"><Outlet /></main>
    </div>
  );
}
