/**
 * Block Schema：配置引擎的类型定义。
 * 每个 Block 类型声明自己的字段结构，后台按 schema 自动渲染表单。
 *
 * 字段类型：
 *  - text       → 单行输入框
 *  - textarea   → 多行文本域
 *  - select     → 下拉选择
 *  - color      → 颜色选择器
 *  - bool       → 开关
 *  - number     → 数字输入
 *  - object     → 分组对象（嵌套字段，折叠展示）
 *  - array      → 对象数组，渲染为可编辑表格（列=字段，行=对象，支持增删/排序）
 *  - json       → 高级：裸 JSON 编辑（兜底）
 */

export type FieldValue = string | number | boolean | null | undefined;
export type JsonObject = Record<string, any>;

export interface SelectOption { value: string; label: string }

export interface TextField { type: 'text'; key: string; label: string; placeholder?: string; group?: string; description?: string }
export interface TextareaField { type: 'textarea'; key: string; label: string; rows?: number; placeholder?: string; group?: string; description?: string }
export interface SelectField { type: 'select'; key: string; label: string; options: SelectOption[]; group?: string; description?: string }
export interface ColorField { type: 'color'; key: string; label: string; group?: string; description?: string }
export interface BoolField { type: 'bool'; key: string; label: string; group?: string; description?: string }
export interface NumberField { type: 'number'; key: string; label: string; min?: number; max?: number; group?: string; description?: string }
export interface ObjectField { type: 'object'; key: string; label: string; fields: FieldDef[]; group?: string; description?: string }
export interface ArrayField { type: 'array'; key: string; label: string; fields: FieldDef[]; addLabel?: string; columnWidth?: string; group?: string; description?: string }
export interface JsonField { type: 'json'; key: string; label: string; rows?: number; group?: string; description?: string }

export type FieldDef =
  | TextField | TextareaField | SelectField | ColorField
  | BoolField | NumberField | ObjectField | ArrayField | JsonField;

export interface BlockSchema {
  type: string;
  label: string;
  /** 组件在组件库的展示名称 */
  group: '布局' | '内容' | '转化' | '媒体' | '基础';
  /** 默认数据（新建组件时填充） */
  defaults: () => JsonObject;
  /** 字段定义（驱动表单） */
  fields: FieldDef[];
}

/** 变体定义：每个组件类型的可选视觉形态（v3 商业化） */
export type BlockVariant = { value: string; label: string };

/** 变体映射：type → 可选变体（首个为默认） */
export const VARIANTS: Record<string, BlockVariant[]> = {
  hero: [
    { value: 'gradient', label: '渐变光晕' },
    { value: 'dark', label: '深色星空' },
    { value: 'light', label: '浅色清爽' },
    { value: 'image', label: '图片背景' },
  ],
  features: [
    { value: 'icon', label: '图标卡片' },
    { value: 'number', label: '序号卡片' },
  ],
  stats: [
    { value: 'dark', label: '深色底' },
    { value: 'light', label: '浅色底' },
    { value: 'line', label: '分割线' },
  ],
  pricing_table: [
    { value: 'three', label: '三档（推荐居中）' },
    { value: 'two', label: '两档' },
    { value: 'four', label: '四档' },
  ],
  testimonials: [
    { value: 'grid', label: '三卡网格' },
    { value: 'single', label: '单卡大引用' },
  ],
  faq: [
    { value: 'single', label: '单列手风琴' },
    { value: 'two', label: '双列网格' },
  ],
  cta_band: [
    { value: 'gradient', label: '渐变横幅' },
    { value: 'dark', label: '深色横幅' },
    { value: 'image', label: '图片横幅' },
  ],
  contact_form: [
    { value: 'center', label: '居中表单' },
    { value: 'split', label: '左右分栏' },
  ],
  team: [
    { value: 'four', label: '四列网格' },
    { value: 'two', label: '两列大卡' },
  ],
  blog_list: [
    { value: 'grid', label: '卡片网格' },
    { value: 'feature', label: '头条 + 列表' },
  ],
  logo_cloud: [
    { value: 'row', label: '单行排列' },
    { value: 'grid', label: '网格排列' },
  ],
  video_embed: [
    { value: 'boxed', label: '圆角容器' },
    { value: 'full', label: '通栏播放' },
  ],
  rich_text: [
    { value: 'center', label: '居中排版' },
    { value: 'left', label: '左对齐' },
  ],
  divider: [
    { value: 'solid', label: '实线' },
    { value: 'dashed', label: '虚线' },
    { value: 'gradient', label: '渐变线' },
  ],
  spacer: [],
  header_nav: [
    { value: 'split', label: '左右分栏' },
    { value: 'center', label: '居中布局' },
    { value: 'minimal', label: '极简单行' },
    { value: 'overlay', label: '透明悬浮' },
  ],
  site_footer: [
    { value: 'multi', label: '多列导航' },
    { value: 'stack', label: '居中堆叠' },
    { value: 'split', label: '左右分栏' },
    { value: 'minimal', label: '极简单行' },
  ],
};

export function getVariants(type: string): BlockVariant[] {
  return VARIANTS[type] ?? [];
}

/** v3.8：按钮样式选项（数组表格 / 配置面板通用） */
export const BTN_STYLES = [
  { value: 'primary', label: '主色实心' },
  { value: 'ghost', label: '透明描边' },
  { value: 'outline', label: '白底描边' },
  { value: 'white', label: '白色实心' },
];

/** 首个变体作为默认 */
export function defaultVariant(type: string): string {
  return getVariants(type)[0]?.value ?? '';
}

/* ------------------------------------------------------------------ */

export const BLOCK_SCHEMAS: BlockSchema[] = [
  /* ================= Hero ================= */
  {
    type: 'hero',
    label: 'Hero 首屏横幅',
    group: '转化',
    defaults: () => ({
      badge: 'New · v2.0 发布',
      title: '在 30 分钟内上线你的官网',
      subtitle: '基于 Cloudflare 全栈 Serverless 的动态官网 + CRM 一体化系统，边缘毫秒级分发、零运维数据库。',
      align: 'center',
      bg: 'gradient',
      ctas: [
        { text: '开始使用', href: '#' },
        { text: '查看方案', href: '#' },
      ],
      image: '',
    }),
    fields: [
      { type: 'text', key: 'badge', label: '角标文案' },
      { type: 'text', key: 'title', label: '主标题' },
      { type: 'textarea', key: 'subtitle', label: '副标题', rows: 3 },
      { type: 'select', key: 'align', label: '对齐方式', options: [{ value: 'center', label: '居中' }, { value: 'left', label: '左对齐' }] },
      { type: 'select', key: 'bg', label: '背景风格', options: [{ value: 'gradient', label: '渐变' }, { value: 'dark', label: '深色' }, { value: 'light', label: '浅色' }] },
      {
        type: 'array', key: 'ctas', label: '按钮列表', addLabel: '+ 添加按钮',
        fields: [
          { type: 'text', key: 'text', label: '按钮文字' },
          { type: 'text', key: 'href', label: '链接' },
          { type: 'select', key: 'style', label: '按钮样式', options: BTN_STYLES },
        ],
      },
      { type: 'text', key: 'image', label: '背景图 URL（可选）' },
    ],
  },

  /* ================= Logo Cloud ================= */
  {
    type: 'logo_cloud',
    label: 'Logo 客户墙',
    group: '内容',
    defaults: () => ({
      title: '受到 200+ 团队信赖',
      logos: [{ name: 'ACME' }, { name: 'Globex' }, { name: 'Initech' }, { name: 'Umbrella' }, { name: 'Stark' }],
    }),
    fields: [
      { type: 'text', key: 'title', label: '标题' },
      {
        type: 'array', key: 'logos', label: 'Logo 列表', addLabel: '+ 添加 Logo',
        fields: [{ type: 'text', key: 'name', label: '品牌名称' }],
      },
    ],
  },

  /* ================= Features ================= */
  {
    type: 'features',
    label: '特性展示',
    group: '内容',
    defaults: () => ({
      title: '核心特性',
      subtitle: '我们为你的业务提供端到端的能力',
      bg: 'default',
      columns: 3,
      bullets: [
        { icon: '🚀', title: '毫秒级发布', desc: '保存即生效，边缘缓存主动失效' },
        { icon: '🛡️', title: '企业级安全', desc: 'Turnstile 防刷 + Access 零信任' },
        { icon: '📊', title: '数据闭环', desc: '官网线索自动入库 CRM' },
      ],
    }),
    fields: [
      { type: 'text', key: 'title', label: '标题' },
      { type: 'textarea', key: 'subtitle', label: '副标题', rows: 2 },
      { type: 'select', key: 'bg', label: '背景', options: [{ value: 'default', label: '白色' }, { value: 'soft', label: '浅灰' }, { value: 'dark', label: '深色' }] },
      { type: 'select', key: 'columns', label: '列数', options: [{ value: '2', label: '2 列' }, { value: '3', label: '3 列' }, { value: '4', label: '4 列' }] },
      {
        type: 'array', key: 'bullets', label: '特性列表', addLabel: '+ 添加特性',
        fields: [
          { type: 'text', key: 'icon', label: '图标（emoji）' },
          { type: 'text', key: 'title', label: '标题' },
          { type: 'textarea', key: 'desc', label: '描述', rows: 2 },
        ],
      },
    ],
  },

  /* ================= Stats ================= */
  {
    type: 'stats',
    label: '数据统计',
    group: '内容',
    defaults: () => ({
      title: '用数据说话',
      bg: 'dark',
      stats: [{ num: '10K+', label: '注册用户' }, { num: '99.9%', label: '可用性' }, { num: '<100ms', label: 'TTFB' }, { num: '200+', label: '企业客户' }],
    }),
    fields: [
      { type: 'text', key: 'title', label: '标题' },
      { type: 'select', key: 'bg', label: '背景', options: [{ value: 'default', label: '白色' }, { value: 'soft', label: '浅灰' }, { value: 'dark', label: '深色' }] },
      {
        type: 'array', key: 'stats', label: '统计项', addLabel: '+ 添加统计',
        fields: [
          { type: 'text', key: 'num', label: '数字（可带后缀）' },
          { type: 'text', key: 'label', label: '说明' },
        ],
      },
    ],
  },

  /* ================= Pricing ================= */
  {
    type: 'pricing_table',
    label: '价格方案',
    group: '转化',
    defaults: () => ({
      title: '简单透明的定价',
      subtitle: '随时升级或取消，无需签订长期合约',
      plans: [
        { name: '基础版', price: '¥0', period: '/月', features: ['1 个官网页面', '10 条线索/月', '社区支持'], featured: false, cta: '免费开始' },
        { name: '专业版', price: '¥299', period: '/月', features: ['无限页面', 'CRM 全功能', 'Webhook 推送', '优先支持'], featured: true, cta: '立即开始' },
        { name: '企业版', price: '¥999', period: '/月', features: ['专属域名', 'SSO 接入', 'SLA 保障', '专属客户经理'], featured: false, cta: '联系销售' },
      ],
    }),
    fields: [
      { type: 'text', key: 'title', label: '标题' },
      { type: 'textarea', key: 'subtitle', label: '副标题', rows: 2 },
      {
        type: 'array', key: 'plans', label: '价格方案', addLabel: '+ 添加方案', columnWidth: '220px',
        fields: [
          { type: 'text', key: 'name', label: '方案名' },
          { type: 'text', key: 'price', label: '价格' },
          { type: 'text', key: 'period', label: '周期' },
          { type: 'textarea', key: 'features', label: '功能（每行一个）', rows: 4 },
          { type: 'bool', key: 'featured', label: '推荐（高亮）' },
          { type: 'text', key: 'cta', label: '按钮文字' },
          { type: 'select', key: 'cta_style', label: '按钮样式', options: BTN_STYLES },
        ],
      },
    ],
  },

  /* ================= Testimonials ================= */
  {
    type: 'testimonials',
    label: '客户评价',
    group: '内容',
    defaults: () => ({
      title: '客户怎么说',
      testimonials: [
        { quote: '上线后官网和 CRM 完全打通，线索处理效率提升了 3 倍。', author: '李明', role: '某 SaaS 公司 CEO' },
        { quote: '过去改一个页面要等一周，现在 30 秒搞定。', author: '王芳', role: '市场总监' },
        { quote: '边缘缓存的性能真的惊艳，全球访问都很快。', author: '陈杰', role: 'CTO' },
      ],
    }),
    fields: [
      { type: 'text', key: 'title', label: '标题' },
      {
        type: 'array', key: 'testimonials', label: '评价列表', addLabel: '+ 添加评价',
        fields: [
          { type: 'textarea', key: 'quote', label: '评价内容', rows: 3 },
          { type: 'text', key: 'author', label: '姓名' },
          { type: 'text', key: 'role', label: '职位' },
        ],
      },
    ],
  },

  /* ================= FAQ ================= */
  {
    type: 'faq',
    label: '常见问题',
    group: '内容',
    defaults: () => ({
      title: '常见问题',
      faqs: [
        { q: '支持自定义域名吗？', a: '支持，绑定到 Cloudflare 即可。' },
        { q: '数据存在哪里？', a: 'Cloudflare D1，全球边缘节点自动同步。' },
      ],
    }),
    fields: [
      { type: 'text', key: 'title', label: '标题' },
      {
        type: 'array', key: 'faqs', label: '问答列表', addLabel: '+ 添加问答',
        fields: [
          { type: 'text', key: 'q', label: '问题' },
          { type: 'textarea', key: 'a', label: '答案', rows: 3 },
        ],
      },
    ],
  },

  /* ================= Team ================= */
  {
    type: 'team',
    label: '团队成员',
    group: '内容',
    defaults: () => ({
      title: '我们的团队',
      subtitle: '一群热爱技术的实干家',
      team: [
        { name: '张伟', role: '创始人 / CEO', bio: '前大厂技术负责人' },
        { name: '李娜', role: 'CTO', bio: '专注云原生架构' },
        { name: '王强', role: '产品负责人', bio: '十年 ToB 产品经验' },
      ],
    }),
    fields: [
      { type: 'text', key: 'title', label: '标题' },
      { type: 'text', key: 'subtitle', label: '副标题' },
      {
        type: 'array', key: 'team', label: '成员列表', addLabel: '+ 添加成员',
        fields: [
          { type: 'text', key: 'name', label: '姓名' },
          { type: 'text', key: 'role', label: '职位' },
          { type: 'text', key: 'avatar', label: '头像 URL（可选）' },
          { type: 'textarea', key: 'bio', label: '简介', rows: 2 },
        ],
      },
    ],
  },

  /* ================= Blog List ================= */
  {
    type: 'blog_list',
    label: '文章列表',
    group: '内容',
    defaults: () => ({
      title: '最新动态',
      posts: [
        { title: 'cf-admin v2.0 发布：可视化建站', date: '2026-09-20', excerpt: '拖拽式编辑器 + 15 个商业化组件。', image: '' },
        { title: '如何把官网线索自动导入 CRM', date: '2026-09-10', excerpt: 'Turnstile + Webhook 全链路解析。', image: '' },
      ],
    }),
    fields: [
      { type: 'text', key: 'title', label: '标题' },
      {
        type: 'array', key: 'posts', label: '文章列表', addLabel: '+ 添加文章',
        fields: [
          { type: 'text', key: 'title', label: '标题' },
          { type: 'text', key: 'date', label: '日期' },
          { type: 'text', key: 'image', label: '封面图 URL' },
          { type: 'textarea', key: 'excerpt', label: '摘要', rows: 2 },
        ],
      },
    ],
  },

  /* ================= Video ================= */
  {
    type: 'video_embed',
    label: '视频展示',
    group: '媒体',
    defaults: () => ({
      title: '产品演示',
      video: { embed: '', url: '', poster: '' },
    }),
    fields: [
      { type: 'text', key: 'title', label: '标题' },
      {
        type: 'object', key: 'video', label: '视频配置',
        fields: [
          { type: 'textarea', key: 'embed', label: '嵌入代码（iframe）', rows: 3 },
          { type: 'text', key: 'url', label: '或 MP4 直链' },
          { type: 'text', key: 'poster', label: '封面图 URL' },
        ],
      },
    ],
  },

  /* ================= CTA Band ================= */
  {
    type: 'cta_band',
    label: '行动号召横幅',
    group: '转化',
    defaults: () => ({
      title: '准备好开始了吗？',
      subtitle: '免费注册，5 分钟上线你的官网',
      ctas: [{ text: '立即注册', href: '#' }],
    }),
    fields: [
      { type: 'text', key: 'title', label: '标题' },
      { type: 'text', key: 'subtitle', label: '副标题' },
      {
        type: 'array', key: 'ctas', label: '按钮列表', addLabel: '+ 添加按钮',
        fields: [
          { type: 'text', key: 'text', label: '按钮文字' },
          { type: 'text', key: 'href', label: '链接' },
          { type: 'select', key: 'style', label: '按钮样式', options: BTN_STYLES },
        ],
      },
    ],
  },

  /* ================= Contact Form ================= */
  {
    type: 'contact_form',
    label: '联系表单',
    group: '转化',
    defaults: () => ({
      title: '联系我们',
      subtitle: '留下信息，我们会在 24 小时内回复',
      form: { submit_label: '提交咨询', note: '我们会保护你的隐私，不会向第三方分享。' },
    }),
    fields: [
      { type: 'text', key: 'title', label: '标题' },
      { type: 'text', key: 'subtitle', label: '副标题' },
      {
        type: 'object', key: 'form', label: '表单配置',
        fields: [
          { type: 'text', key: 'submit_label', label: '按钮文字' },
          { type: 'textarea', key: 'note', label: '底部提示', rows: 2 },
        ],
      },
    ],
  },

  /* ================= Rich Text ================= */
  {
    type: 'rich_text',
    label: '富文本',
    group: '内容',
    defaults: () => ({ title: '', body: '<p>在这里输入正文内容，支持 HTML 标签。</p>' }),
    fields: [
      { type: 'text', key: 'title', label: '标题' },
      { type: 'textarea', key: 'body', label: '内容（支持 HTML）', rows: 8 },
    ],
  },

  /* ================= Divider ================= */
  {
    type: 'divider',
    label: '分割线',
    group: '基础',
    defaults: () => ({ height: 'md' }),
    fields: [
      { type: 'select', key: 'height', label: '间距', options: [{ value: 'md', label: '中等' }, { value: 'lg', label: '大' }] },
    ],
  },

  /* ================= Spacer ================= */
  {
    type: 'spacer',
    label: '空白间距',
    group: '基础',
    defaults: () => ({ height: 'md' }),
    fields: [
      { type: 'select', key: 'height', label: '高度', options: [{ value: 'sm', label: '小 (24px)' }, { value: 'md', label: '中 (48px)' }, { value: 'lg', label: '大 (96px)' }] },
    ],
  },

  /* ================= Header 导航栏（v3.5 · 全局布局） ================= */
  {
    type: 'header_nav',
    label: '导航栏 Header',
    group: '布局',
    defaults: () => ({
      logo: 'LOGO',
      logoImage: '',
      links: [
        { label: '首页', href: '/' },
        { label: '产品', href: '/#products' },
        { label: '定价', href: '/#pricing' },
        { label: '关于', href: '/#about' },
      ],
      ctas: [{ text: '联系我们', href: '/#contact' }],
      sticky: true,
    }),
    fields: [
      { type: 'text', key: 'logo', label: 'Logo 文字' },
      { type: 'text', key: 'logoImage', label: 'Logo 图片 URL（可选，优先于文字）' },
      {
        type: 'array', key: 'links', label: '菜单项', addLabel: '+ 添加菜单',
        fields: [
          { type: 'text', key: 'label', label: '菜单文字' },
          { type: 'text', key: 'href', label: '链接' },
        ],
      },
      {
        type: 'array', key: 'ctas', label: '按钮列表', addLabel: '+ 添加按钮',
        fields: [
          { type: 'text', key: 'text', label: '按钮文字' },
          { type: 'text', key: 'href', label: '链接' },
          { type: 'select', key: 'style', label: '按钮样式', options: BTN_STYLES },
        ],
      },
      { type: 'bool', key: 'sticky', label: '滚动时固定在顶部' },
    ],
  },

  /* ================= Footer 页脚（v3.5 · 全局布局） ================= */
  {
    type: 'site_footer',
    label: '页脚 Footer',
    group: '布局',
    defaults: () => ({
      logo: 'cf-admin',
      description: '基于 Cloudflare 全栈的动态官网 + CRM 一体化开源系统。',
      columns: [
        { heading: '产品', links_text: '动态官网|#\nCRM 客户管理|#' },
        { heading: '资源', links_text: '文档|#\n开源仓库|#' },
      ],
      socials: [
        { icon: '𝕏', href: '#' },
        { icon: '🐙', href: '#' },
      ],
      bottomText: '© 2026 cf-admin · Cloudflare 全栈开源',
    }),
    fields: [
      { type: 'text', key: 'logo', label: '品牌名' },
      { type: 'textarea', key: 'description', label: '介绍文字', rows: 2 },
      {
        type: 'array', key: 'columns', label: '导航列', addLabel: '+ 添加列',
        fields: [
          { type: 'text', key: 'heading', label: '列标题' },
          { type: 'textarea', key: 'links_text', label: '链接（每行一条：文字|链接）', rows: 3 },
        ],
      },
      {
        type: 'array', key: 'socials', label: '社交图标', addLabel: '+ 添加图标',
        fields: [
          { type: 'text', key: 'icon', label: '图标（emoji/字符）' },
          { type: 'text', key: 'href', label: '链接' },
        ],
      },
      { type: 'text', key: 'bottomText', label: '版权行文字' },
    ],
  },
];

export const SCHEMA_MAP: Record<string, BlockSchema> = Object.fromEntries(
  BLOCK_SCHEMAS.map((s) => [s.type, s]),
);

/** 组件库分组展示 */
export const BLOCK_GROUPS = Array.from(new Set(BLOCK_SCHEMAS.map((s) => s.group)));

/** 兼容旧数据：cta → ctas 数组（hero/cta_band 按钮数组化，v3.3 迁移） */
export function migrateContent(type: string, data: JsonObject): JsonObject {
  if (type === 'hero' && !Array.isArray(data.ctas)) {
    const old: any[] = [data.primaryCta ?? data.cta, data.secondaryCta ?? data.cta_secondary]
      .filter((c) => c && typeof c === 'object' && c.text);
    if (old.length) {
      const { primaryCta, secondaryCta, cta, cta_secondary, ...rest } = data as Record<string, any>;
      return { ...rest, ctas: old };
    }
  }
  if (type === 'cta_band' && !Array.isArray(data.ctas)) {
    const cta = data.cta;
    if (cta && typeof cta === 'object' && cta.text) {
      const { cta: _cta, ...rest } = data as Record<string, any>;
      return { ...rest, ctas: [cta] };
    }
  }
  return data;
}
