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

- **动态官网 CMS**：Block 可视化编辑器（Hero / Features / Pricing / Testimonials），发布即清 CDN 缓存
- **CRM 闭环**：官网表单 → Turnstile 防刷 → 自动线索入库 → 飞书/企微 Webhook 推送
- **销售跟进**：客户档案、跟进时间线、商机漏斗看板
- **零运维**：全跑在 Cloudflare Workers / D1 / R2 / KV 上，无服务器
- **边缘性能**：SSR TTFB < 100ms，R2 无 egress 费
- **开箱即用**：pnpm install 后 5 分钟本地跑起来

## 🌐 在线体验

| | URL |
|---|---|
| 官网 Demo | https://cf-admin-api.itwebmomo.workers.dev |
| 管理后台 | https://cf-admin-admin.pages.dev |

> Demo 账号：`demo` / `demo123`（只读）

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

Admin 后台：
```bash
cd ../admin
VITE_API_URL=https://your-worker.workers.dev pnpm build
wrangler pages deploy dist --project-name=cf-admin-admin
```

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
- `POST /api/admin/auth/login`
- `GET/POST /api/admin/pages`
- `PUT /api/admin/pages/:id/blocks`
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
