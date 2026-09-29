# Contributing

Thanks for your interest in cf-admin! This is a guide for contributors.

## 本地开发

```bash
pnpm install
cp .dev.vars.example apps/api/.dev.vars
pnpm --filter api dev     # http://127.0.0.1:8787
pnpm --filter admin dev   # http://127.0.0.1:5173
```

## 提交规范

我们采用 [Conventional Commits](https://www.conventionalcommits.org/)：

- `feat: 新功能`
- `fix: 修 bug`
- `docs: 文档`
- `refactor: 重构`
- `test: 测试`
- `chore: 构建/工具`

## Pull Request

1. Fork 本仓库并切分支：`git checkout -b feat/xxx`
2. 确保本地 `pnpm build` 通过
3. PR 描述写清楚：做了什么、为什么、怎么测
4. 等待 CI 通过 + Review

## 代码风格

- 后端：Hono + TypeScript，函数式风格
- 前端：React 18 + TailwindCSS，函数组件
- 所有表名/字段名用 snake_case，TS 用 camelCase
