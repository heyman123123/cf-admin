import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const PRESET_VARS: Record<string, Record<string, string>> = {
  'default': { '--c-primary': '#2563eb', '--c-primary-hover': '#1d4ed8', '--c-accent': '#7c3aed' },
  'dark': { '--c-primary': '#22d3ee', '--c-primary-hover': '#06b6d4', '--c-accent': '#f472b6' },
  'orange': { '--c-primary': '#f97316', '--c-primary-hover': '#ea580c', '--c-accent': '#f59e0b' },
};

const LABELS: Record<string, string> = {
  '--c-primary': '主色',
  '--c-primary-hover': '主色悬停',
  '--c-accent': '强调色',
};

export default function Theme() {
  const [theme, setTheme] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getTheme().then((r) => setTheme(r.theme));
  }, []);

  const applyPreset = (name: string) => {
    setTheme(PRESET_VARS[name] ?? {});
    setSaved(false);
  };

  const save = async () => {
    await api.saveTheme(theme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">主题设置</h1>
        <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">
          {saved ? '已保存 ✓' : '保存主题'}
        </button>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
        <h2 className="font-bold mb-3">预设主题</h2>
        <div className="flex gap-3">
          {Object.keys(PRESET_VARS).map((name) => (
            <button key={name} onClick={() => applyPreset(name)}
              className="px-4 py-2 border rounded text-sm hover:bg-gray-50">
              {name === 'default' ? '科技蓝' : name === 'dark' ? '冷青' : '活力橙'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="font-bold mb-4">自定义颜色</h2>
        <div className="space-y-4">
          {Object.keys(LABELS).map((k) => (
            <div key={k} className="flex items-center gap-3">
              <span className="w-20 text-sm text-gray-600">{LABELS[k]}</span>
              <input
                type="color"
                value={theme[k] ?? PRESET_VARS.default[k]}
                onChange={(e) => setTheme((t) => ({ ...t, [k]: e.target.value }))}
                className="w-10 h-8 border rounded cursor-pointer"
              />
              <input
                className="border rounded px-2 py-1 text-sm font-mono flex-1"
                value={theme[k] ?? PRESET_VARS.default[k]}
                onChange={(e) => setTheme((t) => ({ ...t, [k]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          保存后全站（所有页面）立即生效，旧页面缓存会在下次访问时自动刷新。
        </p>
      </div>
    </div>
  );
}
