# cf-admin

**动态官网 + CRM 一体化系统，Cloudflare 原生 Serverless 架构。**

单仓库同时承载：对外营销官网（Hono JSX 边缘 SSR）+ 对内 CRM 管理后台（React SPA）+ 业务 API（Cloudflare Workers）+ 临时邮箱服务（MoeMail 能力对齐）。

<p align="center">
  <a href="#-在线体验">在线 Demo</a> ·
  <a href="#-快速开始">快速开始</a> ·
  <a href="#-技术栈">技术栈</a> ·
  <a href="#-API">API</a> ·
  <a href="#-邮件服务">邮件服务</a> ·
  <a href="#-使用手册">使用手册</a> ·
  <a href="./CONTRIBUTING.md">贡献指南</a>
</p>

---

## ✨ 特性

### 官网 CMS（v3 · Shopify Theme Editor 范式）
- **15 个商业化内容组件**：Hero / Features / Pricing / Testimonials / FAQ / Team / Blog List / Video / CTA Band / Contact Form / Logo Cloud / Rich Text / Divider / Spacer 等
- **视觉变体（Variant）**：每个组件 ≥3 种商业级变体（Hero：渐变光晕 / 深色星空 / 浅色清爽 / 图片背景；Pricing：三档推荐居中 / 两档 / 四档；Features：图标卡 / 序号卡；Stats：深底 / 浅底 / 分割线……），后台一键切换
- **画布式编辑器（Shopify Theme Editor 范式）**：
  - 左侧 **Layers 图层面板**：拖拽排序、眼睛显隐、复制、删除、分组组件库
  - 中间 **画布**：iframe 实时渲染，**点选即配**（点击画布区块自动选中并联动设置面板）
  - 右侧 **设置面板**：组件类型 / 视觉变体 / 区块间距（px）/ 字段分组折叠（内容 / 样式 / 高级）
  - **撤销 / 重做**：无限历史栈
  - **三档设备预览**：桌面 / 平板 768 / 手机 375，多分辨率自适应
  - **存草稿 / 发布分离**：草稿不生效，发布即清边缘 CDN 缓存
- **Schema 驱动配置引擎**：输入框 / 文本域 / 下拉 / 颜色 / 开关 / 数字 / 对象分组 / **可编辑表格** / JSON 兜底，无需手写 JSON
- **主题系统（v2）**：后台一键换肤（预设 3 套主题 + 自定义颜色），CSS 变量注入全站 SSR

### CRM 闭环
- 官网表单 → Turnstile 防刷 → 自动线索入库 → 飞书 / 企微 Webhook 推送
- 客户档案、跟进时间线（Timeline）、商机漏斗看板、线索 CSV 导出、数据看板

### 邮件服务（v3 · MoeMail 能力对齐）
- **临时 / 永久邮箱**：1 小时 / 24 小时 / 3 天 / 永久，过期自动清理
- **收件**：Cloudflare Email Routing Catch-all → Worker → D1，秒级入库
- **发件**：Resend API（需自行配置 Key + 域名 SPF/DKIM 验证）
- **单封邮件分享链接**：公开可读，无需登录
- 内置邮箱管理页（后台 → 邮箱服务）

### 工程化
- **同域 API 代理**：Admin 静态页 + Pages Functions 反向代理 `/api/*`，无跨域
- 零运维：全跑 Cloudflare Workers / D1 / R2 / KV
- 边缘性能：SSR TTFB < 100ms（命中缓存），R2 无 egress 费

## 🌐 在线体验

| | URL |
|---|---|
| 官网 Demo | https://cf-admin-api.itwebmomo.workers.dev |
| 管理后台 | https://cf-admin-admin.pages.dev |

> 管理账号由部署者配置：`wrangler secret put ADMIN_USERNAME` / `ADMIN_PASSWORD`

## 🧱 技术栈

| 层 | 选型 |
|---|---|
| 运行时 | Cloudflare Workers + [Hono](https://hono.dev) |
| 数据库 | Cloudflare D1 (SQLite)（主库 + 独立邮件库） |
| 存储 | Cloudflare R2 (S3 兼容，无 egress) |
| 缓存 | Cache API + KV |
| 官网渲染 | Hono JSX SSR |
| 后台 | React 18 + Vite + TailwindCSS |
| 鉴权 | JWT + Bearer Token |
| 防刷 | Cloudflare Turnstile |
| 邮件 | Cloudflare Email Routing + Resend |

## 🚀 快速开始

```bash
git clone https://github.com/heyman123123/cf-admin.git
cd cf-admin
pnpm install

cp .dev.vars.example apps/api/.dev.vars
pnpm --filter api dev      # http://127.0.0.1:8787
pnpm --filter admin dev    # http://127.0.0.1:5173
```

### 首次部署到你自己的 Cloudflare 账号

```bash
cd apps/api

# 1. 创建资源（把返回的 database_id / kv id 填进 wrangler.toml）
wrangler d1 create cf-admin-db
wrangler d1 create cf-mail-db            # 邮件服务独立库
wrangler r2 bucket create cf-admin-assets
wrangler kv namespace create KV

# 2. 执行迁移（主库 + 邮件库各一套 migrations 目录）
wrangler d1 migrations apply cf-admin-db --remote
wrangler d1 migrations apply cf-mail-db --remote

# 3. 配置密钥
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_PASSWORD
wrangler secret put RESEND_API_KEY       # 邮件发件（可选）
wrangler secret put RESEND_FROM          # 发件人地址（可选）

# 4. 部署
wrangler deploy
```

Admin 后台（**同域代理**，无需 VITE_API_URL）：
```bash
cd ../admin
pnpm build                                  # 构建时不要设 VITE_API_URL
wrangler pages deploy dist --project-name=cf-admin-admin
```
`apps/admin/functions/[[path]].js`（Pages Functions）自动随部署编译：`/api/*` 反向代理到 Worker，其余路径先命中静态资源、再回退 SPA `index.html`。

## 📁 目录结构

```
.
├── apps/
│   ├── api/                # Hono Workers（官网 SSR + API + 邮件服务）
│   │   ├── migrations/     # 主库迁移（pages/leads/activities...）
│   │   ├── mail-migrations/# 邮件库迁移（email_accounts/messages/shares...）
│   │   └── src/
│   │       ├── routes/     # public / admin / auth / mail / media / stats / seo / site
│   │       ├── lib/        # auth / cache / turnstile / audit / webhook
│   │       └── pages/      # BlockRenderer（Hono JSX）+ theme
│   └── admin/              # React SPA
│       └── src/pages/      # Dashboard / Leads / Pipeline / Pages / BlockEditor(v3) / Media / Mail
└── packages/
    └── db/                 # Drizzle Schema
```

## 🔌 API

公开：
- `GET /` — 官网 SSR 页面
- `GET /robots.txt` / `GET /sitemap.xml`
- `POST /api/public/submit-form` — 官网表单（Turnstile 校验）

管理（需 Bearer token）：
- `POST /api/admin/auth/login`
- `GET/POST /api/admin/pages` / `PATCH/DELETE /api/admin/pages/:id`
- `PATCH /api/admin/pages/:id/publish` — 发布并清理边缘缓存
- `GET/PUT /api/admin/theme`
- `GET/PUT /api/admin/pages/:id/blocks`
- `GET /api/admin/leads` / `GET /api/admin/leads/export` (CSV)
- `POST /api/admin/leads/:id/activities`
- `POST /api/admin/media/upload` / `GET /api/admin/media/list`
- `GET /api/admin/stats/overview` / `GET /api/admin/audit-logs`
- `GET/POST/DELETE /api/admin/webhooks`

邮件服务：
- `GET /api/mail/domains` — 允许域名列表
- `GET /api/mail/accounts` / `POST /api/mail/accounts`（`{address, ttl: 1h|24h|3d|forever, role}`）/ `DELETE /api/mail/accounts/:id`
- `GET /api/mail/accounts/:address/messages?mailbox=inbox|sent`
- `GET /api/mail/messages/:id` / `PATCH /api/mail/messages/:id/read` / `DELETE /api/mail/messages/:id`
- `POST /api/mail/messages/:id/share` → 生成分享 token；`GET /api/mail/shared/:token`（公开）
- `POST /api/mail/send` — 发件（Resend）
- `POST /api/mail/incoming` — Email Routing 收件回调（`x-mail-secret` 校验，公开）

完整列表见 [Wiki](https://github.com/heyman123123/cf-admin/wiki)。

## 📬 邮件服务配置指南

### 1. 域名与发件（Resend）
1. 在 [resend.com](https://resend.com) 注册并添加域名，完成 **SPF / DKIM** 验证
2. 生成 API Key，写入 Worker 密钥：
   ```bash
   wrangler secret put RESEND_API_KEY
   wrangler secret put RESEND_FROM    # 例如 no-reply@yourdomain.com
   ```
3. 在 `wrangler.toml` 的 `[vars]` 中设置允许收件域名（多个用逗号分隔）：
   ```toml
   MAIL_DOMAINS = "mail.yourdomain.com,mail2.yourdomain.com"
   MAIL_INCOMING_SECRET = "mail-incoming-xxx"   # 建议改成随机值并放入 secrets
   ```

### 2. 收件（Email Routing）
> 注意：Email Routing 规则属于 **Zone 级**权限，且会修改域名 DNS —— 若账号下已有唯一域名，请勿在未授权时操作。

1. Cloudflare Dashboard → 你的域名 → **Email Routing** → 开启
2. Destination addresses 添加一个验证过的收件地址（先验证）
3. **Catch-all** 或自定义规则 → 转发到 **Worker**（`cf-admin-api`）
4. Worker 需在 Settings → Triggers 添加一条 **Email Routing 绑定**？—— 不需要，Email Routing 也可以转发到 **HTTP URL**：Dashboard 中把 Catch-all 转发目标设为 Worker 的 `https://<worker>.workers.dev/api/mail/incoming`，并在 Worker 端接收 multipart/form-data（`message` 字段为 RFC822 原文）。
   - Worker 收到请求后校验 header `x-mail-secret` 与 `MAIL_INCOMING_SECRET` 一致
   - 按 `To` 地址匹配 `email_accounts`，命中则写入 `inbox`，否则返回 404（Email Routing 会继续尝试其他规则）
5. 测试：给 `demo@mail.yourdomain.com` 发一封邮件 → 后台「邮箱服务」→ 点击该邮箱 → 收件箱查看

### 3. 清理过期邮箱
- 列表接口每次调用自动 `DELETE FROM email_accounts WHERE expires_at < now()`
- 可另配 Cron（`wrangler cron` 或外部定时器）定期 POST 触发

## 🎨 使用手册

### 官网页面管理
1. 后台 → **官网页面** → 「+ 新建页面」，填写路径（Slug）与标题
2. 点「编辑」进入 **BlockEditor（v3）**

### BlockEditor 操作（v3）
- **添加区块**：左侧底部组件库按分组点击「+」；新组件自带默认内容与默认变体
- **图层操作**：列表拖拽排序；眼睛 = 隐藏/显示（预览同步）；⧉ 复制；✕ 删除
- **点选即配**：直接点击画布中的区块 → 右侧设置面板联动
- **视觉变体**：设置面板顶部切换变体，画布即时刷新
- **区块间距**：设置「上边距 / 下边距 (px)」精细控制布局
- **设备预览**：顶栏切换 桌面 / 平板 768 / 手机 375，验证多分辨率自适应
- **撤销 / 重做**：顶栏按钮
- **存草稿**：仅保存，不影响线上；**发布**：保存并清理该页面边缘缓存，秒级生效

### 邮件服务
后台 → **邮箱服务**：
- 输入前缀 + 有效期（1h / 24h / 3d / 永久）→「创建邮箱」
- 点击左侧邮箱 → 收件箱 → 点击邮件阅读、生成分享链接、删除
- 右侧「写信发件」：填写收件人 / 主题 / 正文 → 发送（需已配置 Resend）

### 主题
后台 → **主题设置**：预设主题一键切换，或自定义 CSS 变量颜色。

## 🔒 安全

- 所有 `/api/admin/*` 走 JWT Bearer 鉴权
- 建议外层再挂 Cloudflare Zero Trust Access（`/admin/*`）
- 公开表单强制 Turnstile 防刷
- 审计日志记录所有写操作
- 邮件收件回调校验 `x-mail-secret`；分享链接 token 不可枚举

## 🔑 部署所需的 Cloudflare API Token 权限

| 级别 | 权限 | 用途 |
|---|---|---|
| Account | Workers Scripts (Edit) | 部署 Worker |
| Account | D1 (Edit) | 建库 / 迁移 |
| Account | R2 (Edit) | 存储桶 |
| Account | Workers KV Storage (Edit) | KV 命名空间 |
| Account | Pages (Edit) | 部署后台 |
| Account | Workers Tail (Read) | 日志 |
| Account | Email Routing Addresses (Edit) | 验证收件地址 |
| Zone | Workers Routes (Edit) | 自定义域路由 |
| Zone | Zone / Zone Settings (Edit) | DNS / 主题等 |
| Zone | Email Routing Addresses / Rules (Edit) | 收件路由配置（收件必需） |
| User | User Details / Memberships (Read) | 账号识别 |

> ⚠️ 创建后 Token 权限**不可修改**，需变更时重新创建新 Token。邮箱收件依赖 **Zone 级 Email Routing Rules** 权限。

## 🤝 贡献

欢迎 Issue / PR！见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 📄 License

[MIT](./LICENSE)
