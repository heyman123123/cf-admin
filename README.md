# cf-admin

动态官网 + CRM 一体化系统，Cloudflare 原生 Serverless 架构。

> 单域部署：`/*` 对外官网（Hono JSX 边缘 SSR），`/admin/*` 管理后台（React SPA），API 统一挂在 `/api/*`。

## 技术栈

| 层 | 选型 |
|---|---|
| 运行时 | Cloudflare Workers + [Hono](https://hono.dev) |
| 数据库 | Cloudflare D1（SQLite）+ [Drizzle ORM](https://orm.drizzle.team) |
| 对象存储 | Cloudflare R2（S3 兼容，无 egress 费） |
| 缓存 | Cloudflare Cache API + KV |
| 官网渲染 | Hono JSX 边缘 SSR |
| 管理后台 | React 18 + Vite + TailwindCSS |
| 鉴权 | Cloudflare Access（外层）+ JWT（业务层） |
| 防刷 | Cloudflare Turnstile |

## 目录结构

```
.
├── apps/
│   ├── api/        # Hono Gateway + 官网 SSR（部署到 Workers）
│   └── admin/      # React 管理后台（部署到 Pages）
├── packages/
│   └── db/         # Drizzle Schema + migrations
├── wrangler.toml
└── pnpm-workspace.yaml
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 本地开发

```bash
# 复制环境变量样例
cp .dev.vars.example apps/api/.dev.vars

# 本地启动 Workers（API + 官网 SSR）
pnpm --filter api dev

# 另开终端，启动 Admin SPA
pnpm --filter admin dev
```

### 3. 创建 D1 数据库

```bash
cd apps/api
npx wrangler d1 create cf-admin-db
# 把输出的 database_id 填到 wrangler.toml

# 执行迁移
npx wrangler d1 migrations apply cf-admin-db --local
npx wrangler d1 migrations apply cf-admin-db --remote
```

### 4. 部署

```bash
# 部署 Workers（API + 官网）
pnpm --filter api deploy

# 部署 Admin 到 Pages
pnpm --filter admin build
npx wrangler pages deploy apps/admin/dist
```

## 关键设计

- **表单 → CRM 流水线**：Turnstile 校验 → 写 `form_submissions` 留痕 → 写 `leads` → `waitUntil()` 异步推送飞书/企业微信 Webhook。
- **秒级发布**：后台发布页面时调用 Cache API 主动 `delete` 对应 URL，下次请求即回源重建。
- **草稿预览**：后台 iframe 携带 `?preview=<token>` 参数，Worker 识别后跳过缓存。

## 路线图

- [x] 项目骨架 / Drizzle Schema / Hono 路由
- [x] 公开表单提交流水线
- [x] 官网动态 SSR + Cache 失效
- [ ] 管理后台 pages/blocks 可视化编辑
- [ ] 销售跟进时间线 / 商机漏斗
- [ ] 数据看板
- [ ] Cloudflare Access 生产配置
