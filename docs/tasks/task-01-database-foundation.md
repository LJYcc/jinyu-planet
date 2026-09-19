# Task 1：Prisma MySQL 连接与初始迁移

**描述：** 将 Nuxt 服务端通过 Prisma 连接到现有 MySQL 开发数据库，按 [`../数据库表设计.md`](../数据库表设计.md) 建立 Prisma schema、生成迁移并写入初始主题。Prisma 是建表和数据访问的唯一 ORM，不在浏览器端暴露连接信息。

**验收标准：**

- [ ] 已安装同版本的 `prisma`、`@prisma/client` 与 `@prisma/adapter-mariadb`；`prisma/schema.prisma` 与 `prisma.config.ts` 正确映射首版表、关系、唯一约束、索引和 MySQL URL。
- [ ] `prisma migrate dev --name initial_schema` 在开发数据库创建必需表和索引，并通过 Prisma seed 写入五个初始主题。
- [ ] 数据库连接串只由服务端运行时环境变量读取，缺失配置时服务端返回明确错误而非泄露配置。
- [ ] 数据库访问通过单一 server-side repository/client 模块封装，页面组件不能直接连库。

**验证：**

- [ ] 执行 `npx prisma migrate dev --name initial_schema` 与 `npx prisma generate`，并验证迁移记录存在。
- [ ] 执行 `npx prisma db seed`，确认种子脚本可重复运行。
- [ ] 查询 `topics`，确认五个主题、排序和描述正确。
- [ ] 运行 `npm run lint:eslint` 和 `npm run build`。

**依赖：** 无；实施前需在本地 `.env` 配置 MySQL `DATABASE_URL`，并确认目标是开发数据库。

**可能修改的文件：**

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `prisma/migrations/*/migration.sql`
- `server/utils/prisma.ts`
- `.env.example`

**预计范围：** 中等，5 个文件与依赖清单更新。
