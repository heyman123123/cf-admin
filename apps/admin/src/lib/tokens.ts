/**
 * v4.0 设计令牌（Design Tokens）：编辑器 UI 单一事实源。
 * 语义化命名，注入 index.css 的 :root，组件通过 CSS 变量或 tailwind 任意值消费。
 * 方案：深色侧栏 + 亮色画布（Framer / Webflow 范式）。
 */
export const TOKENS = {
  /** 编辑器框架（顶栏 / 左栏 / 右栏容器）：深色系 */
  editorBg: '#0d1117',
  panelBg: '#11161d',
  surface: '#1a2029',
  surfaceHover: '#242c38',
  surfaceActive: '#2b3648',
  /** 边框 / 分隔 */
  border: '#262e3a',
  borderStrong: '#33404f',
  /** 文字（深色底上） */
  textHi: '#f1f5f9',
  textMid: '#94a3b8',
  textLo: '#64748b',
  /** 强调色（延续品牌蓝紫渐变） */
  accent: '#3b82f6',
  accentHi: '#6366f1',
  accentSoft: 'rgba(59,130,246,.14)',
  /** 画布区（亮色） */
  canvasBg: '#eef2f7',
  canvasGrid: 'rgba(100,116,139,.18)',
  /** 表单卡片（右栏内容区）：亮色 */
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
  cardText: '#0f172a',
  cardTextMuted: '#64748b',
  /** 圆角档位 */
  radiusSm: '8px',
  radiusMd: '12px',
  radiusLg: '16px',
  radiusXl: '20px',
  /** 阴影层级 */
  shadowSm: '0 1px 2px rgba(0,0,0,.4)',
  shadowMd: '0 6px 18px rgba(0,0,0,.28)',
  shadowLg: '0 20px 48px rgba(0,0,0,.38)',
  /** 间距栅格（4px 基） */
  space1: '4px', space2: '8px', space3: '12px', space4: '16px', space5: '20px', space6: '24px', space8: '32px',
  /** 字号梯度 */
  fontXs: '10px', fontSm: '11px', fontMd: '12px', fontLg: '13px', fontXl: '14px', font2xl: '16px',
} as const;

/** 注入 :root 的 CSS 变量字符串（index.css 引入） */
export const TOKEN_CSS = `
:root {
  --editor-bg: ${TOKENS.editorBg};
  --panel-bg: ${TOKENS.panelBg};
  --surface: ${TOKENS.surface};
  --surface-hover: ${TOKENS.surfaceHover};
  --surface-active: ${TOKENS.surfaceActive};
  --border-strong: ${TOKENS.borderStrong};
  --border-dim: ${TOKENS.border};
  --text-hi: ${TOKENS.textHi};
  --text-mid: ${TOKENS.textMid};
  --text-lo: ${TOKENS.textLo};
  --accent: ${TOKENS.accent};
  --accent-hi: ${TOKENS.accentHi};
  --accent-soft: ${TOKENS.accentSoft};
  --canvas-bg: ${TOKENS.canvasBg};
  --canvas-grid: ${TOKENS.canvasGrid};
  --card-bg: ${TOKENS.cardBg};
  --card-border: ${TOKENS.cardBorder};
  --card-text: ${TOKENS.cardText};
  --card-text-muted: ${TOKENS.cardTextMuted};
  --r-sm: ${TOKENS.radiusSm};
  --r-md: ${TOKENS.radiusMd};
  --r-lg: ${TOKENS.radiusLg};
  --r-xl: ${TOKENS.radiusXl};
}
`;

/** 深色底文字工具类（配合 tailwind 使用） */
export const darkText = {
  hi: 'text-[var(--text-hi)]',
  mid: 'text-[var(--text-mid)]',
  lo: 'text-[var(--text-lo)]',
};
