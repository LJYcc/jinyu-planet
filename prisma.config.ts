// Prisma CLI 执行时也需要读取项目根目录的 .env。
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    // migration 必须提交 Git；seed 是可选的初始数据命令入口。
    path: 'prisma/migrations',
    seed: 'node prisma/seed.mjs'
  },
  datasource: {
    // 开发迁移会使用 shadow database 重放 migration，不能与业务库相同。
    url: env('DATABASE_URL'),
    shadowDatabaseUrl: env('SHADOW_DATABASE_URL')
  }
});
