/**
 * 编辑器中间画布：iframe 预览（点选描边由消息驱动，不重建 srcDoc）。
 * v3.5：从 BlockEditor.tsx 拆出。
 */
export default function Canvas({ previewHtml, device, deviceWidth, iframeRef }: {
  previewHtml: string;
  device: 'desktop' | 'tablet' | 'mobile';
  deviceWidth: string | number;
  iframeRef: React.Ref<HTMLIFrameElement>;
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0 order-1">
      {/* 画布区：点阵背景（无独立顶栏，顶栏属于整个编辑器） */}
      <div className="flex-1 p-4 overflow-auto flex justify-center items-start"
        style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundColor: '#eef2f7' }}>
        <iframe
          ref={iframeRef}
          title="preview"
          srcDoc={previewHtml}
          style={{
            width: deviceWidth,
            maxWidth: '100%',
            height: '100%',
            minHeight: 520,
            border: 'none',
            borderRadius: 16,
            background: '#fff',
            boxShadow: device === 'mobile' ? '0 0 0 1px #e2e8f0, 0 24px 48px rgba(15,23,42,.18)' : '0 12px 40px rgba(15,23,42,.16)',
            transition: 'width .3s ease, box-shadow .3s ease',
          }}
        />
      </div>
    </div>
  );
}
