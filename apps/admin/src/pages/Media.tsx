import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

export default function Media() {
  const [files, setFiles] = useState<{ key: string; url: string; size: number; uploaded: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const refresh = () => api.listMedia().then(setFiles);
  useEffect(() => { refresh(); }, []);
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    await api.uploadMedia(f); refresh();
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">媒体资产 (R2)</h1>
        <button onClick={() => inputRef.current?.click()} className="px-4 py-2 bg-brand text-white rounded">上传文件</button>
        <input ref={inputRef} type="file" hidden onChange={onPick} />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {files.map((f) => (
          <div key={f.key} className="bg-white rounded-lg p-3 shadow-sm">
            <img src={f.url} alt={f.key} className="w-full h-32 object-cover rounded bg-gray-100" />
            <div className="text-xs mt-2 text-gray-500 truncate">{f.key}</div>
            <div className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</div>
          </div>
        ))}
      </div>
    </div>
  );
}
