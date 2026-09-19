import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Nuxt 开发环境热更新会重复执行模块；将 Client 放在 globalThis 上避免重复创建连接。
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createAdapter() {
  // Prisma 7 直连 MySQL 时必须显式提供 driver adapter。
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to create the Prisma MySQL adapter.');
  }

  // URL API 会正确拆分主机、端口和已编码的用户名/密码。
  const url = new URL(databaseUrl);

  if (url.protocol !== 'mysql:') {
    throw new Error('DATABASE_URL must use the mysql:// protocol.');
  }

  const database = url.pathname.slice(1);

  if (!database) {
    throw new Error('DATABASE_URL must include a database name.');
  }

  console.log('url', url);

  return new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(database),
    connectionLimit: 5
  });
}

// 所有服务端 API 都导入这个单例，不在每个接口中重新创建 PrismaClient。
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: createAdapter() });

if (process.env.NODE_ENV !== 'production') {
  // 只在开发环境缓存，避免热更新时产生额外连接。
  globalForPrisma.prisma = prisma;
}
