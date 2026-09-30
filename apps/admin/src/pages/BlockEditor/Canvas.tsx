/**
 * 编辑器中间画布：iframe 预览（点选描边由消息驱动，不重建 srcDoc）。
 * v3.5：从 BlockEditor.tsx 拆出。
 * v4.0：设备外框（mockup 顶栏 + 圆点 + 设备/宽度标注）+ 网格背景质感。
 */


export default function Canvas({ previewHtml, device, deviceWidth, iframeRef }: {
  previewHtml: string;
  device: 'desktop' | 'tablet' | 'mobile';
  deviceWidth: string | number;
  iframeRef: React.Ref<HTMLIFrameElement>;
}) {
  const deviceLabel = device === 'mobile' ? '手机' : device === 'tablet' ? '平板' : '桌面';
  const widthLabel = device === 'mobile' ? '375px' : device === 'tablet' ? '768px' : '自适应';
  const deviceRatio = device === 'mobile' ? '9:16' : device === 'tablet' ? '3:4' : '16:9';

  return (
    <div className="flex-1 flex flex-col min-w-0 order-1">
      {/* 画布区：网格背景（亮色，衬托深色侧栏） */}
      <div className="flex-1 p-5 overflow-auto flex justify-center items-start light-scroll"
        style={{
          backgroundImage:
            'linear-gradient(var(--canvas-grid) 1px, transparent 1px), linear-gradient(90deg, var(--canvas-grid) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundColor: 'var(--canvas-bg)',
        }}>
        {/* 设备外框（mockup） */}
        <div className="rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(15,23,42,.22)] ring-1 ring-black/5 shrink-0"
          style={{ width: deviceWidth, maxWidth: '100%', transition: 'width .3s ease' }}>
          {/* 设备顶栏：圆点 + 标注 */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#11161d]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </div>
            <span className="text-[10px] font-medium text-[#94a3b8] tracking-wide">{deviceLabel} · {widthLabel} · {deviceRatio}</span>
            <span className="w-10" />
          </div>
          <iframe
            ref={iframeRef}
            title="preview"
            srcDoc={previewHtml}
            style={{
              width: '100%',
              height: '100%',
              minHeight: 540,
              border: 'none',
              display: 'block',
              background: '#fff',
            }}
          />
        </div>
      </div>
    </div>
  );
}
