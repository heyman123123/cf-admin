import { useEffect, useState } from 'react';
import { api, type PageItem } from '../lib/api';

export default function Pages() {
  const [rows, setRows] = useState<PageItem[]>([]);

  useEffect(() => {
    api.listPages().then(setRows);
  }, []);

  const publish = async (p: PageItem) => {
    await api.publishPage(p.id);
    setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, is_published: 1 } : r)));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">官网页面</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-4 py-3">路径</th>
              <th className="text-left px-4 py-3">标题</th>
              <th className="text-left px-4 py-3">状态</th>
              <th className="text-left px-4 py-3">更新时间</th>
              <th className="text-left px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3 font-mono text-xs">{r.slug}</td>
                <td className="px-4 py-3">{r.title}</td>
                <td className="px-4 py-3">
                  {r.is_published ? (
                    <span className="text-green-600 text-xs">已发布</span>
                  ) : (
                    <span className="text-amber-600 text-xs">草稿</span>
                  )}
                </td>
                <td className="px-4 py-3">{new Date(r.updated_at * 1000).toLocaleString()}</td>
                <td className="px-4 py-3">
                  {!r.is_published && (
                    <button onClick={() => publish(r)} className="text-blue-600 hover:underline text-xs">
                      发布并清缓存
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  暂无页面。可通过 Drizzle seed 或 API 创建。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
