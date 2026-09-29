import { NavLink, Outlet } from 'react-router-dom';

const nav = [
  { to: '/dashboard', label: '数据看板' },
  { to: '/leads', label: '线索 / 客户' },
  { to: '/pages', label: '官网页面' },
];

export default function Layout() {
  return (
    <div className="flex h-full">
      <aside className="w-56 bg-brand text-white flex flex-col">
        <div className="px-5 py-5 text-lg font-bold border-b border-white/10">cf-admin</div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 text-xs text-white/50">Cloudflare 原生</div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
