# cf-admin v3.0 需求文档：Shopify 式可视化编辑器 · 商业化组件库 · MoeMail 邮箱服务

> 版本：v3.0-draft
> 日期：2026-09-29
> 状态：待评审
> 关联：v2.0（可视化建站引擎）已上线；本版本在 v2 基础上做编辑器范式升级、组件商业化重设计，并融入 MoeMail 邮箱服务

---

## 一、背景与目标

### 1.1 现状（v2 已交付）

| 模块 | v2 现状 |
|---|---|
| 编辑器 | 三栏布局：左组件库 + 中 iframe 实时预览 + 右属性面板（SchemaForm：输入框/下拉/颜色/开关/对象/数组表格/JSON） |
| 组件 | 15 个 BlockSchema + BlockRenderer 商业化 CSS（渐变按钮、层次阴影、深色区块光晕、响应式断点） |
| 主题 | KV 存储 CSS 变量，3 套预设 + 自定义颜色，SSR 注入 |
| 部署 | Cloudflare Workers（SSR+API）+ Pages Functions 同域代理 + Admin SPA |

### 1.2 三大诉求与差距

| 诉求 | 当前差距 |
|---|---|
| **① 编辑器参考 Shopify Theme Editor** | 现编辑器是"组件列表 + 属性表单"，缺少 Shopify 式的**画布点选即配、图层（Layers）面板、模板选择、区块拖拽落位、撤销/重做、版本历史、保存/发布分离**等成熟交互 |
| **② 组件样式商业化** | 当前 CSS 是"商用级但模板化"：每个组件只有 1 种视觉形态、缺少变体（variant）、缺 hover/加载/空态等完整状态、缺组件级设计规范 |
| **③ 集成 MoeMail 邮箱服务** | 系统完全没有邮件能力；用户希望搭建邮箱服务：**永久/临时邮箱、接收邮件、发送邮件** |

### 1.3 目标

1. 编辑器交互对齐 Shopify Theme Editor 心智模型，非技术人员 10 分钟完成"建页→排版→换肤→发布"
2. 组件库达到可直接对外售卖的商业质感（变体、状态、动效、无障碍完整）
3. 官网/后台获得完整的邮箱服务：**永久邮箱 + 临时邮箱（1h/24h/3d/永久）+ 实时收件 + 发件**，与官网、CRM 数据打通

### 1.4 非目标（v3 不做）

- ❌ 类 Shopify **模板市场**（第三方上传主题）——v3.1
- ❌ 邮件 IMAP/SMTP 自有协议栈（收发全走 Cloudflare Email Routing + Resend，不自建 MTA）——永远不做
- ❌ 邮件营销/群发工具（Mailchimp 式）——v4
- ❌ 多租户 SaaS 计费——单站为主

---

## 二、总体架构变化

```
cf-admin (Monorepo)
├── apps/
│   ├── api/            # Hono Workers：官网 SSR + API 网关（现有）
│   ├── admin/          # React SPA：管理后台（现有）
│   └── mail/           # 【新增】MoeMail 派生应用（Next.js，独立部署 mail.<domain>）
├── packages/
│   ├── db/             # Drizzle Schema（现有 + 邮件相关表）
│   ├── editor-core/    # 【新增】编辑器共享内核（画布/图层/拖拽/设置面板，React）
│   └── ui/             # 【新增】商业化组件库（React 组件 + variant + 设计 token）
└── workers/
    └── email-receiver/ # 【新增】Cloudflare Email Worker：收信 → D1（沿用 moemail 方案）
```

集成策略（详见第五部分）：**MoeMail 以独立 Next.js 应用形态引入**（复用其 Email Worker + D1 + Resend 发件链路），通过子域 + 统一登录态与 cf-admin 融合，官网新增"邮箱服务"入口与页面区块。

---

## 三、Part A：官网编辑器（Shopify Theme Editor 范式）

### 3.1 对标参考：Shopify Theme Editor 核心交互

| Shopify Theme Editor 元素 | cf-admin v3 对应实现 | 说明 |
|---|---|---|
| **主题模板选择器**（顶部：Home / Product / Blog） | **模板选择器**：首页 / 落地页 / 文章页 / 自定义 | 切换模板即切换可编辑区域，模板决定默认区块骨架 |
| **左侧 Sections & Blocks 列表**（可拖拽、可隐藏、可删除） | **左侧图层（Layers）面板**：按顺序列出页面所有区块，支持拖拽排序、眼睛图标显隐、删除、复制 | 取代 v2"组件库"单一列表 |
| **右侧 Section settings / Block settings**（按分组折叠、每项带说明文字） | **右侧设置面板**：选中区块后按 Schema 渲染；分组折叠（内容 / 样式 / 间距 / 高级） | 复用并升级 SchemaForm |
| **中央预览画布**（实时渲染、点击区块即选中、顶部设备切换 Desktop/Mobile） | **中央画布**：iframe srcDoc 实时渲染，点击落点即选中；设备切换 1280 / 768 / 375 | v2 已有雏形，补齐"点选即配" |
| **顶栏 Save / Publish / Undo / Redo** | **顶栏**：撤销 / 重做 / 草稿自动保存状态 / 预览（带 token）/ 保存草稿 / 发布（清缓存） | 新增撤销重做栈与发布确认 |
| **主题文件树（theme.liquid / assets）** | **主题面板（独立 /theme 路由，v2 已有）**：颜色 / 字体 / 圆角 / 容器宽度 / 间距比例 | v2 主题系统升级为"主题编辑器" |
| **区块添加（Add section / Add block）** | **组件库抽屉**：从左侧/顶部"+"打开，按分组（转化/内容/媒体/基础/布局）插入；插入后自动滚动到落点并选中 | 保留 v2 组件库数据源（blocks.ts） |

### 3.2 编辑器布局（v3 画布式）

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 顶栏：‹ 返回页面列表 │ 模板: 首页▾ │ 撤销↶ 重做↷ │ 设备: ▢▢▢ │ 预览 │ 保存草稿 │ 发布 │
├───────────────┬───────────────────────────────────────┬──────────────────┤
│ 图层 (Layers)  │             画布 (Canvas)              │  设置 (Settings)  │
│ ▸ 全屏区块     │   ┌─────────────────────────────┐      │  Hero 首屏横幅    │
│   · Hero       │   │  (实时渲染, 点击选中,        │      │ ┌─ 内容 ─┐        │
│   · Features   │   │   选中区块显示蓝色描边+       │      │ │ 标题 □  │        │
│   · Pricing    │   │   悬浮操作条(↑↓ ⧉ ✕))      │      │ │ 副标题 □ │        │
│   · Contact    │   │                             │      │ ├─ 样式 ─┤        │
│ [+ 添加区块]    │   │                             │      │ │ 背景 ▾ │        │
│               │   └─────────────────────────────┘      │ ├─ 间距 ─┤        │
│               │                                        │ │ 上 □ 下 □ │      │
│               │                                        │ └────────┘        │
└───────────────┴───────────────────────────────────────┴──────────────────┘
```

### 3.3 画布与预览

1. **实时渲染**：iframe `srcDoc` 加载与线上一致的前台 HTML（复用 BlockRenderer + 主题 CSS + PREVIEW_CSS 子集），`postMessage` 双向通信
2. **点选即配**：点击画布任意区块 → 蓝色高亮描边 + 顶部悬浮操作条（上移/下移/复制/删除）→ 右侧设置面板同步
3. **设备预览**：桌面（1280）/ 平板（768）/ 手机（375）三档，375 下强制无横向滚动
4. **拖拽**：Layers 面板内上下拖拽排序（HTML5 DnD）；v3.1 支持画布内直接拖拽
5. **预览链接**：`?preview=<token>` 跳过缓存（复用 PREVIEW_TOKEN 机制）

### 3.4 设置面板（SchemaForm 升级为 Sections 风格）

| 能力 | 要求 |
|---|---|
| 分组折叠 | 每个 Schema 的 fields 增加 `group: 内容/样式/间距/高级`，面板按组折叠展示 |
| 字段说明 | 每个字段支持 `description` 小字说明（如"建议 6-12 个字符"） |
| 间距控制 | 统一提供 `paddingTop/paddingBottom` 数字输入（px），画布实时生效 |
| 响应式覆盖 | 支持"覆盖移动端"开关：桌面/平板/手机分别存值（对应 v2 ROADMAP 的 variants 结构） |
| 变体选择 | `variant` 下拉（每个组件 ≥3 个视觉变体，见 Part B） |
| 高级模式 | JSON 编辑器保留（v2 已有）作为兜底，默认隐藏 |

### 3.5 编辑状态与数据流

1. **撤销/重做**：50 步历史栈（快照：`blocks[] + theme + page meta`），顶栏按钮 + `Ctrl+Z / Ctrl+Shift+Z`
2. **自动保存**：变更后 3s 防抖存草稿（PUT `/api/admin/pages/:id/blocks`，is_published=0 不触发缓存清理）
3. **保存草稿 / 发布**：发布=写库（is_published=1）+ 主动清除该页面 URL 与 sitemap 缓存；发布前弹确认
4. **版本历史（P1）**：`page_revisions` 表（page_id + snapshot_json + created_at + operator），可回滚

---

## 四、Part B：商业化组件样式升级

### 4.1 设计规范（设计 Token 统一）

| Token | 规范 |
|---|---|
| 色板 | 主色/强调色/成功/警告/危险 + 各 8 级阶梯（50–950，对齐 Tailwind 命名）；语义色全部走 CSS 变量 |
| 字体 | 标题：Inter / 正文：系统栈；字号阶梯 12–72px（clamp 响应式） |
| 间距 | 4px 网格，区块级 96/64/48px，卡片内 32/24/16px |
| 圆角 | sm 8 / md 12 / lg 16 / xl 24 / full 999 |
| 阴影 | 3 层（sm/md/lg），hover 抬高一级 |
| 动效 | 入场 200–300ms ease-out；hover 位移 ≤4px；尊重 prefers-reduced-motion |
| 栅格 | 12 列，断点 640 / 768 / 1024 / 1280 / 1920 |

### 4.2 组件重设计清单（15 个全部升级）

| # | 组件 | v3 要求（变体 ≥3、完整状态、商业化质感） |
|---|---|---|
| 1 | Hero | 变体：渐变 / 深色 / 浅色 / **图片背景+遮罩**；支持角标、双按钮、视觉焦点图；移动端自动堆叠 |
| 2 | Logo Cloud | 变体：单行滚动 / 网格；logo 灰阶 hover 彩色；支持 SVG/文字 |
| 3 | Features | 变体：左图右文 / 图标卡 / 编号卡 / **大数字卡**；图标支持 emoji/SVG 上传 |
| 4 | Stats | 变体：浅色 / 深色 / 分割线；数字渐变文字 + 滚动动画（IntersectionObserver） |
| 5 | Pricing | 变体：三档 / 两档 / 四档；推荐卡渐变描边 + 角标；月付/年付切换（价格数组） |
| 6 | Testimonials | 变体：三卡 / 轮播 / 单卡大引用；星级、头像首字母渐变底 |
| 7 | FAQ | 变体：单列手风琴 / 双列；图标旋转动效；支持锚点 |
| 8 | CTA Band | 变体：渐变 / 深色 / 图片；大按钮 hover 微动效 |
| 9 | Contact Form | 变体：居中 / 左右分栏 / 深色；Turnstile 挂载；提交成功态动画 |
| 10 | Team | 变体：4 列 / 2 列大卡；头像渐变底、社交图标 |
| 11 | Blog List | 变体：3 卡 / 头条+列表；封面图占位渐变、日期徽章 |
| 12 | Video | 变体：嵌入 / mp4 / 封面图播放按钮；圆角阴影容器 |
| 13 | Rich Text | 排版规范：标题层级、引用块、列表、图片；行高 1.8 |
| 14 | Divider | 变体：实线 / 虚线 / 渐变 / 带文字（"以下内容"） |
| 15 | Spacer | 高度 24/48/96/160px 四档 |

### 4.3 组件通用要求（验收口径）

- **状态完整**：default / hover / focus-visible / disabled / loading（按钮）/ empty（列表类组件的空态）
- **响应式**：375/768/1280/1920 均不破版、无横向滚动
- **主题化**：不得写死色值，全部走 CSS 变量（--c-*）
- **可访问性**：对比度 WCAG AA、键盘可达、语义化标签
- **性能**：单个区块渲染 ≤5ms；组件库按 3 个 chunk 分包

### 4.4 示例规格：Pricing（商业化验收样板）

- 三档卡片，中间"最受欢迎"角标 + 渐变描边（v2 已有基础，升级）
- 月付/年付切换：切换时价格数字横移动画，年付显示"省 20%"徽章
- 每档 CTA hover：渐变加深 + 上浮 2px + 光晕
- 底部"需要企业版？联系我们"链接行
- 深色模式下：卡片深底 + 浅色文字 + 渐变边框保持

---

## 五、Part C：MoeMail 邮箱服务集成

### 5.1 MoeMail 能力盘点（依据上游项目实测文档）

| 能力 | 说明 |
|---|---|
| 收件 | Cloudflare **Email Routing → Email Worker（email-receiver-worker）** → D1 落库，自动轮询即时展示 |
| 临时邮箱 | 有效期 1h / 24h / 3d / **永久**；前缀自定义、域名多选 |
| 发件 | 基于 **Resend**：临时邮箱地址作为发件人，支持 HTML，发件记录入消息列表 |
| 自动清理 | 定时 Cleanup Worker 删除过期邮箱与邮件 |
| Webhook | 新邮件 POST 到用户配置 URL（X-Webhook-Event: new_message），非 2xx 重试 |
| 权限 | RBAC：皇帝（Emperor）/ 公爵（Duke）/ 骑士（Knight）/ 平民（Civilian），配置每日发件配额 |
| OpenAPI | X-API-Key 访问：创建邮箱、列表、读信、删信、分享链接等 |
| Agent 工具 | @moemail/cli（create/wait/read/send/delete）+ MCP 服务器（create_email / wait_for_email / read_message / send_email 等） |
| 其他 | 分享链接（邮箱/单封邮件）、PWA、多语言（中/英）、亮暗主题 |

### 5.2 集成方案（推荐：方案 A 独立子域 + 统一入口；方案 B 为远期深度融合）

#### 方案 A（v3 落地）：独立部署 + 统一融合
1. **引入方式**：将 moemail 作为 `apps/mail` 引入 Monorepo（Next.js，独立 Pages 项目）
   - 部署：`mail.<domain>`（Cloudflare Pages，子域），域名 DNS 托管在 Cloudflare
   - 数据库：**独立 D1（mail-db）** 或并入现有 `cf-admin-db`（二选一，见 5.4）
   - KV：`mail-config-kv`（存 DEFAULT_ROLE / EMAIL_DOMAINS / MAX_EMAILS / Resend 配置等）
2. **邮件路由**：Cloudflare Email Routing 开启 Catch-all → 转发到 `email-receiver-worker`（沿用 moemail wrangler.email.json 配置）
3. **统一入口与登录**：
   - cf-admin 侧栏新增"邮箱服务"入口（新页面/新 tab 指向 `mail.<domain>`）
   - 官网顶部导航新增"临时邮箱"入口；新增 **mail 区块类型**（官网页面可嵌入邮箱创建表单）
   - 登录态：v3 先独立（moemail 用 GitHub/Google OAuth），v3.1 用 cf-admin JWT 换发 moemail session（同一 Cloudflare 账号下的 KV 校验）实现单点登录
4. **发件配置**：皇帝角色在 moemail 个人中心配置 Resend API Key + 验证域名

#### 方案 B（v3.1+ 远期）：深度并入 cf-admin API
- Email Worker 收信后除落 mail 库外，**按收件人域名/前缀规则同步创建 CRM 线索**（如 `bd@domain` 收到询盘 → leads 自动建档，复用现有 Turnstile/Webhook 链路）
- moemail OpenAPI 挂到 cf-admin `/api/mail/*` 网关，统一鉴权与审计
- 邮件正文按规则打标签关联商机（Pipeline）

### 5.3 关键链路

**收件链路**：`发件人 → mail.domain (Email Routing) → email-receiver-worker → D1(mail) → 用户轮询/Webhook 即时可见`

**发件链路**：`用户（角色校验 + 每日配额）→ /api/mail/send → Resend API → 收件人；发送记录写入 messages（direction=outbound）`

### 5.4 数据模型（新增表，D1）

```sql
-- 邮箱账户（临时/永久统一）
CREATE TABLE email_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,            -- 关联 mail 用户（OAuth 账户）
  address TEXT NOT NULL UNIQUE,     -- test@mail.example.com
  domain TEXT NOT NULL,
  prefix TEXT NOT NULL,
  is_permanent INTEGER DEFAULT 0,   -- 0: 临时 1: 永久
  expires_at INTEGER,               -- 临时邮箱过期时间戳，NULL=永久
  created_at INTEGER NOT NULL
);

-- 邮件消息（收/发统一）
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,          -- inbound / outbound
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT,
  content TEXT,                     -- 纯文本
  html TEXT,                        -- HTML
  received_at INTEGER NOT NULL,     -- 收/发时间
  is_read INTEGER DEFAULT 0
);

-- 分享链接（邮箱/单封邮件）
CREATE TABLE shares (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,        -- email / message
  target_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER,               -- NULL=永久
  created_at INTEGER NOT NULL
);

-- API Key（OpenAPI 访问）
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL,           -- 只存哈希
  name TEXT,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER
);

-- 发件配额（每日）
CREATE TABLE send_quotas (
  user_id TEXT PRIMARY KEY,
  date TEXT NOT NULL,               -- YYYY-MM-DD
  sent_count INTEGER DEFAULT 0
);

-- 与 cf-admin 现有表的关系
-- leads.company_name / email 可关联 email_accounts.address（方案 B 打通）
```

### 5.5 功能需求清单

**P0（邮箱服务可用）**
- [ ] 引入 moemail 代码至 apps/mail，完成 wrangler/环境变量/路由配置
- [ ] Cloudflare Email Routing：开启 Catch-all → email-receiver-worker；多域名支持
- [ ] 创建邮箱：前缀自定义 + 域名选择 + 有效期（1h/24h/3d/永久）
- [ ] 收件列表：邮箱详情页展示收/发消息，未读标记，轮询即时刷新
- [ ] 自动清理：Cleanup Worker 定时删除过期邮箱/邮件
- [ ] RBAC：皇帝 / 公爵 / 骑士 / 平民角色 + 默认角色配置

**P1（发件与通知）**
- [ ] 发件：Resend 配置（皇帝可配）、每日配额（公爵 5/骑士 2/皇帝无限）、HTML 富文本
- [ ] Webhook 新邮件通知（含测试按钮）
- [ ] 分享链接：邮箱 / 单封邮件，永久或限时

**P2（开放与融合）**
- [ ] OpenAPI（X-API-Key）+ @moemail/cli + MCP 服务器接入
- [ ] cf-admin 官网新增 **mail 区块**（内嵌创建临时邮箱表单）
- [ ] 官网/后台统一入口 + 单点登录（v3.1）
- [ ] 收件 → CRM 线索自动建档（v3.1 方案 B）

### 5.6 安全与合规

- 反滥用：邮箱创建频率限制（Turnstile 或 KV 计数）、单用户邮箱数上限（MAX_EMAILS）、发件配额
- 密钥：Resend/API Key 只存哈希与密文，走 `wrangler secret`
- 合规：临时邮箱不用于敏感场景；发件遵守 Resend 服务条款与反垃圾规范（对应公司跨境收单业务场景需注意邮件触达合规，详见风险）

---

## 六、非功能需求

| 指标 | 目标 |
|---|---|
| 编辑器操作响应（选中/拖拽/配置） | ≤ 100ms 无卡顿，拖拽帧率 ≥ 60fps |
| 画布预览刷新（区块配置变更） | ≤ 300ms |
| 收件可见延迟（轮询/Webhook） | ≤ 5s（轮询 3s 周期） |
| 邮件创建（API） | ≤ 300ms P95 |
| 官网 TTFB | 维持 < 100ms（命中缓存）；mail 子域 P95 < 500ms |
| 375px 横向滚动 | 0（官网与 mail 均要求） |
| 可用性 | ≥ 99.9%（Cloudflare 免费层） |

---

## 七、里程碑

| 周 | 交付 |
|---|---|
| **W1** | 编辑器内核：Layers 面板 + 点选即配 + 设备切换 + 撤销/重做（editor-core） |
| **W2** | 设置面板升级（分组/描述/响应式覆盖/variant）+ 保存草稿与发布分离 + 版本历史（P1） |
| **W3** | 组件商业化：P0 8 个组件重设计（Hero/Features/Stats/Pricing/Testimonials/FAQ/CTA/Contact） |
| **W4** | 组件商业化：其余 7 个 + 设计 token 收敛 + 响应式验收 |
| **W5** | MoeMail 引入：apps/mail 部署 + Email Routing + D1 迁移 + 临时邮箱与收件 |
| **W6** | 发件（Resend）+ Webhook + RBAC 配置 + 统一入口 + 全链路压测上线 |

---

## 八、验收标准

- [ ] 后台新建页面：Layers 拖拽排序、点画布区块即出设置面板、撤销/重做 20 步有效
- [ ] 375px 画布预览与线上手机访问均无横向滚动；切换主题后所有组件颜色同步
- [ ] Pricing 组件月付/年付切换动效、推荐卡渐变描边、hover 态达标（对照 4.4 示例规格）
- [ ] 在 mail 子域创建永久邮箱与 1h 临时邮箱各一个，向临时邮箱发信，≤5s 内可见
- [ ] 用临时邮箱地址经 Resend 发信成功，收件人收到 HTML 邮件，发送记录在消息列表可见
- [ ] 公爵角色当日发第 6 封被拒绝并提示配额；皇帝可调整配额
- [ ] 官网页面插入 mail 区块，访客可直接创建临时邮箱并复制地址

---

## 九、风险与开放问题

| 项 | 说明 | 处理 |
|---|---|---|
| moemail 为 Next.js 应用 | 与现有 Hono SSR 栈不同，双前端 | 接受：独立 Pages 部署，共享 D1/KV 账号即可；如后续收敛再评估 |
| Resend 域名验证 | 发件需在 Resend 验证发件域名（SPF/DKIM） | 皇帝配置流程内置引导 |
| 邮件投递合规 | 跨境收单业务对邮件触达有合规要求 | 仅临时邮箱用户主动发信 + 配额 + 反垃圾；不做群发 |
| Email Routing 域名要求 | 收件域名必须 DNS 托管于 Cloudflare | 部署前置检查项 |
| 方案 A/B 取舍 | 深度融合（线索联动）成本高 | v3 先落地 A，B 以"邮件 → CRM 线索"单一场景试点 |

---

## 十、附：与 v2 的兼容策略

- blocks.ts 的 `fields` 增加 `group` / `description` / `variant` 为**可选字段**，旧 Schema 不破坏
- content_json 新增 `variants: { desktop/tablet/mobile }` 可选覆盖，旧数据按"无覆盖"渲染
- 新增 mail 区块类型直接追加到 BLOCK_SCHEMAS 末尾，SCHEMA_MAP 向后兼容
- 主题 KV 结构不变，只扩展字体/圆角/容器宽度 key（旧 key 默认值兼容）
