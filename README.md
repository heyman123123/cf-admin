# cf-admin

**动态官网 + CRM 一体化系统 · Cloudflare 原生 Serverless 架构**

一个仓库同时承载：对外营销官网（Hono JSX 边缘 SSR）+ 对内 CRM 管理后台（React SPA）+ 业务 API（Cloudflare Workers）。

---

## 目录

- [1. 它解决什么问题](#1-它解决什么问题)
- [2. 架构总览](#2-架构总览)
- [3. 技术栈](#3-技术栈)
- [4. 前置准备](#4-前置准备)
- [5. 5 分钟本地跑起来](#5-5-分钟本地跑起来)
- [6. 数据库初始化](#6-数据库初始化)
- [7. 部署到生产](#7-部署到生产)
- [8. 环境变量清单](#8-环境变量清单)
- [9. 业务使用手册](#9-业务使用手册)
- [10. API 一览](#10-api-一览)
- [11. 安全清单（上线前必过）](#11-安全清单上线前必过)
- [12. 常见问题](#12-常见问题)

---

## 1. 它解决什么问题

- **官网改个文案也要发版？** 后台改 Block JSON → 点发布 → Cache API 主动清缓存，下次访问即为新版。
- **官网表单线索散落在邮箱？** Turnstile 防刷 → 写入 `form_submissions` 留痕 → 自动建 CRM 线索 → `waitUntil()` 异步推飞书/企业微信。
- **销售跟进没有时间线？** Lead 详情页记录每一次电话/邮件/拜访，自动推进阶段，Pipeline 看板一眼看漏斗。
- **云服务器贵？** 全部跑在 Cloudflare Workers / D1 / R2 上，零服务器、R2 无 egress 费。

## 2. 架构总览

```
访客 ──► Cloudflare Edge (WAF/SSL/CDN)
              │
   ┌──────────┴──────────┐
   │ /* 官网 SSR          │ /admin/* (Cloudflare Access)
   ▼                     ▼
 Hono JSX SSR        React SPA (Pages)
   │                     │
   └──────────┬──────────┘
              ▼
      Hono API Gateway (Workers)
              │
   ┌──────────┼──────────┐
   ▼          ▼          ▼
  D1         R2         KV
```

| 路径 | 处理方 | 鉴权 |
|---|---|---|
| `/*` | Workers SSR + Cache API | 公开（表单走 Turnstile） |
| `/admin/*` | Cloudflare Pages React SPA | Cloudflare Access（外层）+ JWT Cookie（业务层） |
| `/api/public/*` | Hono 公开 API | Turnstile Token |
| `/api/admin/*` | Hono 管理 API | JWT HTTP-Only Cookie |

## 3. 技术栈

| 层 | 选型 |
|---|---|
| 运行时 | Cloudflare Workers + [Hono](https://hono.dev) |
| DB | Cloudflare D1（SQLite）+ [Drizzle ORM](https://orm.drizzle.team) |
| 存储 | Cloudflare R2（S3 兼容，无 egress 费） |
| 缓存 | Cache API + KV |
| 官网渲染 | Hono JSX（`hono/jsx/streaming` 的 `renderToString`） |
| 后台 | React 18 + Vite + TailwindCSS + React Router |
| 鉴权 | Cloudflare Access（外层）+ `hono/jwt`（业务层） |
| 防刷 | Cloudflare Turnstile |
| Monorepo | pnpm workspace |

## 4. 前置准备

1. 注册 Cloudflare 账号（免费额度足够起步）；
2. 安装 Node.js ≥ 20、pnpm ≥ 9；
3. 登录 Wrangler：

```bash
npm i -g wrangler
wrangler login
```

## 5. 5 分钟本地跑起来

```bash
git clone git@github.com:heyman123123/cf-admin.git
cd cf-admin
pnpm install

# 复制环境变量
cp .dev.vars.example apps/api/.dev.vars
# 编辑 apps/api/.dev.vars，至少改 JWT_SECRET / ADMIN_PASSWORD
```

本地需要的 Cloudflare 资源可以先**跳过**——`wrangler dev` 会自动起本地 D1/R2/KV 沙箱。

```bash
# 终端 1：启动 API + 官网 SSR
pnpm --filter api dev
# → http://127.0.0.1:8787

# 终端 2：启动 Admin
pnpm --filter admin dev
# → http://127.0.0.1:5173
```

打开：

- 官网：http://127.0.0.1:8787 （seed 数据自带一个 hero + features + pricing 首页）
- 后台：http://127.0.0.1:5173/login （默认账号见 `.dev.vars`）

## 6. 数据库初始化

```bash
cd apps/api

# 远程创建 D1（只做一次）
wrangler d1 create cf-admin-db
# 把输出的 database_id 填到 wrangler.toml 的 [[d1_databases]]

# 应用迁移（本地 / 远程）
wrangler d1 migrations apply cf-admin-db --local
wrangler d1 migrations apply cf-admin-db --remote
```

迁移文件：

| 文件 | 作用 |
|---|---|
| `migrations/0000_init.sql` | 5 张表：pages / page_blocks / leads / lead_activities / form_submissions |
| `migrations/0001_seed.sql` | 一条首页 + hero/features/pricing 三个演示 Block |

## 7. 部署到生产

### 7.1 部署 Workers（API + 官网）

```bash
cd apps/api

# 注入 secrets（不要写在 wrangler.toml）
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_PASSWORD
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put LARK_WEBHOOK_URL    # 可选
wrangler secret put WECOM_WEBHOOK_URL   # 可选

# 部署
wrangler deploy
```

### 7.2 创建 R2 bucket

```bash
wrangler r2 bucket create cf-admin-assets
# 开启公开访问：在 R2 控制台 → Settings → 绑定一个 dev 域
# 把得到的 https://pub-xxx.r2.dev 填到 wrangler.toml 的 R2_PUBLIC_URL
```

### 7.3 部署 Admin SPA

```bash
cd apps/admin
pnpm build
wrangler pages deploy dist --project-name=cf-admin-admin
```

### 7.4 绑定自定义域 + Cloudflare Access

1. 在 Workers 控制台把 `your-domain.com` 绑到 `cf-admin-api`；
2. Pages 项目绑 `admin.your-domain.com`；
3. **关键**：在 Zero Trust → Access → 把 `/admin/*` 和 `/api/admin/*` 加进一个 Access Application，只允许公司邮箱登录；
4. 这样即使 JWT 被绕过，外层还有一道 SSO。

### 7.5 官网表单接 Turnstile

1. Cloudflare 控制台 → Turnstile → New Site；
2. Site Key 填到前台表单；Secret Key 用 `wrangler secret put TURNSTILE_SECRET_KEY`；
3. 前台表单示例见下文「业务使用手册」。

## 8. 环境变量清单

| 变量 | 位置 | 说明 |
|---|---|---|
| `JWT_SECRET` | secret | JWT 签名密钥，随便一长串随机字符串 |
| `ADMIN_USERNAME` | vars | 默认管理员账号（建议 admin） |
| `ADMIN_PASSWORD` | secret | 默认管理员密码 |
| `TURNSTILE_SECRET_KEY` | secret | Turnstile 服务端校验密钥 |
| `LARK_WEBHOOK_URL` | secret | 新线索飞书机器人 webhook（可选） |
| `WECOM_WEBHOOK_URL` | secret | 新线索企业微信机器人 webhook（可选） |
| `APP_URL` | vars | 站点公网 URL，用于发布后 purge 缓存 |
| `R2_PUBLIC_URL` | vars | R2 公开访问域 |
| `PREVIEW_TOKEN` | vars | 草稿预览 Token（访问 `?preview=<token>` 跳过缓存） |

## 9. 业务使用手册

### 9.1 发一个新页面

1. 进入 **官网页面 → 新建页面**，填 Slug（如 `/about`）、Title、Description；
2. 点页面进入 **Block 编辑器**；
3. 选择 Block 类型（`hero` / `features` / `testimonials` / `pricing_table` / `rich_text`）；
4. 在 JSON 编辑框里写内容，例如一个 hero：

```json
{
  "title": "我们的故事",
  "subtitle": "成立于 2020 年",
  "cta": { "text": "联系我们", "href": "/contact" }
}
```

5. 点 **保存并发布** → 自动清掉对应 URL 的边缘缓存；
6. 访问 `https://your-domain.com/about` 即可看到新页面。

### 9.2 预览未发布的草稿

后台保存草稿后，直接访问站点路径并带上预览 Token：

```
https://your-domain.com/about?preview=<PREVIEW_TOKEN>
```

该请求会跳过 Cache API 直接查 D1。

### 9.3 在官网加一个联系表单

在任意页面的 Block 里加一个 `rich_text`，body 里嵌入 HTML 表单：

```html
<form id="contact-form">
  <input name="name" placeholder="姓名" required />
  <input name="email" type="email" placeholder="邮箱" required />
  <input name="phone" placeholder="电话" />
  <textarea name="message" placeholder="需求描述"></textarea>
  <div class="cf-turnstile" data-sitekey="YOUR_TURNSTILE_SITE_KEY"></div>
  <button type="submit">提交</button>
</form>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<script>
  document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const token = fd.get('cf-turnstile-response');
    const r = await fetch('/api/public/submit-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_id: 'contact_form',
        token,
        name: fd.get('name'), email: fd.get('email'),
        phone: fd.get('phone'), company_name: fd.get('company'),
      }),
    });
    alert(r.ok ? '提交成功，我们会尽快联系您' : '提交失败');
  });
</script>
```

提交后：

- 自动在 **线索 / 客户** 列表里出现一条新记录；
- 如果配置了飞书/企微 Webhook，机器人会立刻收到消息。

### 9.4 销售跟进流程

1. **线索 / 客户** 列表点某条线索进入详情；
2. 「新增跟进」选类型（电话/邮件/拜访/备注），写内容 → 保存；
3. 系统自动把线索状态从 `new` 推到 `contacting`；
4. 跟进几次后，点右上按钮把状态切到 `qualified`（方案报价）/ `won`（赢单）/ `lost`（输单）；
5. **商机漏斗** 页面按 5 列看板查看当前所有线索分布。

### 9.5 上传图片到媒体库

进入 **媒体资产 → 上传文件**，选本地图片，上传完复制 URL 即可在 Block JSON 里用：

```json
{ "image": "https://pub-xxx.r2.dev/uploads/1727000000-xxx.png" }
```

## 10. API 一览

### 公开

| Method | Path | 说明 |
|---|---|---|
| GET | `/health` | 健康检查 |
| POST | `/api/public/submit-form` | 表单提交（Turnstile 校验） |

### 后台鉴权

| Method | Path | 说明 |
|---|---|---|
| POST | `/api/admin/auth/login` | body: `{username, password}`，写 Cookie |
| POST | `/api/admin/auth/logout` | 清除 Cookie |
| GET | `/api/admin/auth/me` | 当前登录用户 |

### Pages

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/admin/pages` | 页面列表 |
| POST | `/api/admin/pages` | 新建页面 |
| PATCH | `/api/admin/pages/:id/publish` | 发布并清缓存 |
| DELETE | `/api/admin/pages/:id` | 删除页面 |
| GET | `/api/admin/pages/:id/blocks` | 区块列表 |
| PUT | `/api/admin/pages/:id/blocks` | 整页覆盖保存区块 |

### Leads

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/admin/leads?status=` | 线索列表（可按状态过滤） |
| GET | `/api/admin/leads/:id` | 线索详情 |
| PATCH | `/api/admin/leads/:id` | 更新状态/字段 |
| POST | `/api/admin/leads/:id/activities` | 新增跟进记录 |
| GET | `/api/admin/leads/:id/activities` | 跟进时间线 |

### 媒体 / 统计

| Method | Path | 说明 |
|---|---|---|
| POST | `/api/admin/media/upload` | multipart/form-data 上传到 R2 |
| GET | `/api/admin/media/list` | 最近 50 个对象 |
| GET | `/api/admin/stats/overview` | 看板聚合数据 |

## 11. 安全清单（上线前必过）

- [ ] `JWT_SECRET` 用 `openssl rand -hex 32` 生成；
- [ ] `ADMIN_PASSWORD` 改成强密码，并用 `wrangler secret put` 注入；
- [ ] Turnstile 域名限制为自己的站点；
- [ ] 在 Cloudflare Zero Trust 给 `/admin/*` 和 `/api/admin/*` 加 Access Application；
- [ ] R2 bucket 不开启 public write，只通过 `/api/admin/media/upload` 写入；
- [ ] 强制全站 HTTPS（Cloudflare 默认开启）；
- [ ] 开启 WAF 规则拦截常见扫描器。

## 12. 常见问题

**Q: 发布了为什么前台还是旧内容？**
A: 检查浏览器/CDN 缓存。后台发布接口会主动 purge 该 URL，但浏览器本地缓存的 HTML 需要硬刷新。

**Q: 本地 dev 时 D1 数据没了？**
A: `wrangler dev --local` 的 D1 是 SQLite 文件，存在 `.wrangler/state/`；删掉会重置。`--remote` 才是真云数据库。

**Q: R2 上传后图片 403？**
A: R2 bucket 默认不公开。要么在 R2 控制台绑一个 `pub-xxx.r2.dev` 域，要么绑自己的子域，然后把那个 URL 填到 `R2_PUBLIC_URL`。

**Q: 怎么加新的 Block 类型？**
A: 两步：
1. 在 `apps/api/src/pages/BlockRenderer.tsx` 的 `switch` 里加一个 `case`；
2. 在 Admin 的 `BlockEditor.tsx` 里把新类型加进 `BLOCK_TYPES` 数组。

---

## License

MIT
