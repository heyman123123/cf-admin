# cf-admin

**动态官网 + CRM 一体化系统，Cloudflare 原生 Serverless 架构。**

单仓库同时承载：对外营销官网（Hono JSX 边缘 SSR）+ 对内 CRM 管理后台（React SPA）+ 业务 API（Cloudflare Workers）。

<p align="center">
  <a href="#-在线体验">在线 Demo</a> ·
  <a href="#-快速开始">快速开始</a> ·
  <a href="#-技术栈">技术栈</a> ·
  <a href="#-API">API</a> ·
  <a href="./CONTRIBUTING.md">贡献指南</a>
</p>

---

## ✨ 特性

- **动态官网 CMS（v2）**：15 个商业化内容组件（Hero / Features / Pricing / Testimonials / FAQ / Team / Blog List / Video / CTA / Contact 等），Schema 驱动可视化配置引擎——输入框、下拉、颜色、开关、对象、**可编辑表格**，无需写 JSON
- **主题系统（v2）**：后台一键换肤（预设 3 套主题 + 自定义颜色），CSS 变量注入全站 SSR，保存即全局生效
- **可视化 Block 编辑器**：三栏布局（组件库 + 属性面板 + 实时预览），桌面/手机 375px 切换，发布即清边缘 CDN 缓存
- **CRM 闭环**：官网表单 → Turnstile 防刷 → 自动线索入库 → 飞书/企微 Webhook 推送
- **销售跟进**：客户档案、跟进时间线、商机漏斗看板、线索 CSV 导出
- **零运维**：全跑在 Cloudflare Workers / D1 / R2 / KV 上，无服务器
- **边缘性能**：SSR TTFB < 100ms（命中缓存），R2 无 egress 费
- **同域 API 代理**：Admin 静态页 + Pages Functions 反向代理 `/api/*`，无跨域、无 CORS 烦恼
- **开箱即用**：pnpm install 后 5 分钟本地跑起来

## 🌐 在线体验

| | URL |
|---|---|
| 官网 Demo | https://cf-admin-api.itwebmomo.workers.dev |
| 管理后台 | https://cf-admin-admin.pages.dev |

> 管理账号由部署者配置：`wrangler secret put ADMIN_USERNAME` / `ADMIN_PASSWORD`（本地开发见 `apps/api/.dev.vars`）

## 🧱 技术栈

| 层 | 选型 |
|---|---|
| 运行时 | Cloudflare Workers + [Hono](https://hono.dev) |
| 数据库 | Cloudflare D1 (SQLite) + [Drizzle ORM](https://orm.drizzle.team) |
| 存储 | Cloudflare R2 (S3 兼容，无 egress) |
| 缓存 | Cache API + KV |
| 官网渲染 | Hono JSX SSR |
| 后台 | React 18 + Vite + TailwindCSS |
| 鉴权 | JWT + Bearer Token（跨域友好） |
| 防刷 | Cloudflare Turnstile |

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
wrangler d1 create cf-admin-db      # 把 database_id 填进 wrangler.toml
wrangler r2 bucket create cf-admin-assets
wrangler kv namespace create KV     # 把 id 填进 wrangler.toml
wrangler d1 migrations apply cf-admin-db --remote

wrangler secret put JWT_SECRET
wrangler secret put ADMIN_PASSWORD
wrangler deploy
```

Admin 后台（**同域代理**，无需 VITE_API_URL）：
```bash
cd ../admin
pnpm build                                  # 构建时不要设 VITE_API_URL，API 走同域 /api/*
wrangler pages deploy dist --project-name=cf-admin-admin
```
`apps/admin/functions/[[path]].js`（Pages Functions）会自动随部署编译：`/api/*` 请求反向代理到 Worker，其余路径先命中静态资源、再回退 SPA `index.html`，因此管理后台与 API 同域，浏览器无跨域限制。

## 📁 目录结构

```
.
├── apps/
│   ├── api/        # Hono Workers（官网 SSR + API 网关）
│   │   ├── migrations/   # Drizzle SQL migrations
│   │   └── src/
│   │       ├── routes/  # public / admin / auth / seo / media / stats
│   │       ├── lib/      # auth / cache / turnstile / audit / webhook
│   │       └── pages/   # BlockRenderer (Hono JSX)
│   └── admin/      # React SPA
│       └── src/pages/   # Dashboard / Leads / Pipeline / Pages / BlockEditor / Media
└── packages/
    └── db/         # Drizzle Schema
```

## 🔌 API

公开：
- `POST /api/public/submit-form` — 官网表单（Turnstile 校验）
- `GET /robots.txt` / `GET /sitemap.xml`

管理（需 Bearer token）：
- `POST /api/admin/auth/login`（返回 token）
- `GET/POST /api/admin/pages` / `PATCH/DELETE /api/admin/pages/:id`
- `PATCH /api/admin/pages/:id/publish` — 发布并清理边缘缓存
- `GET/PUT /api/admin/theme` — 主题系统（KV 存储，SSR 注入）
- `GET/PUT /api/admin/pages/:id/blocks` — 页面 Block 配置（Schema 驱动）
- `GET /api/admin/leads` / `GET /api/admin/leads/export` (CSV)
- `POST /api/admin/leads/:id/activities`
- `POST /api/admin/media/upload`
- `GET /api/admin/stats/overview`
- `GET /api/admin/audit-logs`
- `GET/POST/DELETE /api/admin/webhooks`

完整列表见 [Wiki](https://github.com/heyman123123/cf-admin/wiki)。

## 🔒 安全

- 所有 `/api/admin/*` 走 JWT Bearer 鉴权
- 建议外层再挂 Cloudflare Zero Trust Access
- 公开表单强制 Turnstile 防刷
- 审计日志记录所有写操作

## 🤝 贡献

欢迎 Issue / PR！见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 📄 License

[MIT](./LICENSE)
