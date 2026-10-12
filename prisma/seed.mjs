// seed 是独立的 Node.js 进程，需要自己加载 .env 和创建 adapter。
import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

function createAdapter() {
  // Prisma 7 直连 MySQL 时必须显式提供 driver adapter。
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to seed the database.')
  }

  // URL API 会正确拆分主机、端口和已编码的用户名/密码。
  const url = new URL(databaseUrl)

  if (url.protocol !== 'mysql:') {
    throw new Error('DATABASE_URL must use the mysql:// protocol.')
  }

  const database = url.pathname.slice(1)

  if (!database) {
    throw new Error('DATABASE_URL must include a database name.')
  }

  return new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(database),
    connectionLimit: 5,
  })
}

// seed 不会自动复用 Nuxt 的 Prisma 单例，因此在这里创建自己的 Client。
const prisma = new PrismaClient({ adapter: createAdapter() })

// 网站首次初始化需要的固定主题配置。
const topics = [
  {
    slug: 'life-fragments',
    name: '生活碎片',
    description: '那些很小，但不想忘记的事。',
    colorKey: 'rose',
    sortOrder: 10,
  },
  {
    slug: 'tech-product',
    name: '技术与产品',
    description: '关于创造、工具与不顺手的东西。',
    colorKey: 'lime',
    sortOrder: 20,
  },
  {
    slug: 'city-observation',
    name: '城市观察',
    description: '路过的街道、灯光和人群。',
    colorKey: 'sky',
    sortOrder: 30,
  },
  {
    slug: 'inner-universe',
    name: '脑内宇宙',
    description: '还没有变成答案的想法。',
    colorKey: 'violet',
    sortOrder: 40,
  },
  {
    slug: 'good-finds',
    name: '好东西分享',
    description: '值得被多看一眼的链接与发现。',
    colorKey: 'gold',
    sortOrder: 50,
  },
  {
    slug: 'mountains-and-sunrise',
    name: '山与日出',
    description: '分享你与山、与日出日落的故事。那些让你重新充满力量的瞬间。',
    colorKey: 'sunrise',
    sortOrder: 60,
  },
]

async function main() {
  for (const topic of topics) {
    // upsert 让 seed 可以反复执行：存在则更新，不存在才创建。
    await prisma.topic.upsert({
      where: { slug: topic.slug },
      update: topic,
      create: topic,
    })
  }
}

main()
  .then(() => console.info('Seeded Goldfish Planet topics.'))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
