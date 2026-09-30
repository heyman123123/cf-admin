/**
 * 左栏「样式和主题」tab：潘通色卡预设 + 自定义变量。
 * v3.5：从 BlockEditor.tsx 拆出。
 */
import { THEME_VAR_LABELS, DEFAULT_THEME_VARS } from '../../lib/blockPreview';
import { Icon } from '../../lib/editorParts';

export default function ThemeTab({ themePresets, theme, setTheme, applyPreset, saveTheme, themeSaved }: {
  themePresets: { key: string; name: string; vars: Record<string, string> }[];
  theme: Record<string, string>;
  setTheme: (t: Record<string, string>) => void;
  applyPreset: (vars: Record<string, string>) => void;
  saveTheme: () => void;
  themeSaved: boolean;
}) {
  return (
    <div className="flex-1 overflow-auto p-3.5 min-h-0 space-y-5">
      {/* 保存栏 */}
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-slate-800 tracking-tight">样式和主题</h3>
        <button onClick={saveTheme}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition ${themeSaved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-md shadow-blue-600/20'}`}>
          {themeSaved ? '已保存 ✓' : '保存主题'}
        </button>
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">主题为全局设置：保存后所有页面立即生效（旧缓存自动失效），画布实时预览。</p>

      {/* 潘通色卡预设 */}
      <div>
        <span className="text-xs font-semibold text-slate-700 block mb-2">潘通色卡预设</span>
        <div className="grid grid-cols-2 gap-2">
          {themePresets.map((p) => {
            const active = Object.keys(p.vars).every((k) => theme[k] === p.vars[k]) && Object.keys(p.vars).length > 0;
            return (
              <button key={p.key} onClick={() => applyPreset(p.vars)}
                className={`group text-left rounded-xl border p-2 transition-all ${active ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/60' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'}`}>
                <span className="block h-8 rounded-lg mb-1.5 relative overflow-hidden"
                  style={{ background: `linear-gradient(120deg, ${p.vars['--c-primary'] ?? '#2563eb'}, ${p.vars['--c-accent'] ?? '#7c3aed'})` }}>
                  {active && <span className="absolute inset-0 flex items-center justify-center text-white bg-black/15">{Icon.check}</span>}
                </span>
                <span className="block text-[11px] font-semibold text-slate-700 truncate">{p.name}</span>
                <span className="block text-[10px] text-slate-400 truncate mt-0.5">
                  {p.vars['--c-primary'] ?? ''} · {p.vars['--c-accent'] ?? ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 自定义变量 */}
      <div>
        <span className="text-xs font-semibold text-slate-700 block mb-2">自定义变量</span>
        <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
          {Object.entries(THEME_VAR_LABELS).map(([k, label]) => {
            const isColor = k.startsWith('--c-') && k !== '--c-radius';
            return (
              <div key={k} className="flex items-center gap-2.5 px-3 py-2.5">
                <span className="w-16 shrink-0 text-[11px] text-slate-500">{label as string}</span>
                {isColor && (
                  <input type="color" value={theme[k] ?? DEFAULT_THEME_VARS[k] ?? '#000000'}
                    onChange={(e) => setTheme({ ...theme, [k]: e.target.value })}
                    className="w-8 h-7 rounded border border-slate-200 bg-white cursor-pointer shrink-0 p-0.5" />
                )}
                <input
                  value={theme[k] ?? DEFAULT_THEME_VARS[k] ?? ''}
                  onChange={(e) => setTheme({ ...theme, [k]: e.target.value })}
                  className={`flex-1 min-w-0 border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition ${k === '--c-radius' ? '' : 'font-mono'}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
