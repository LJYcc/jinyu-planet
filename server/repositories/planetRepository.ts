import { prisma } from '../utils/prisma';

const CHINA_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;

function startOfCurrentWeek(now = new Date()) {
  // 站点以中国标准时间定义自然周；数据库 DateTime 查询仍使用 UTC 时刻。
  const date = new Date(now.getTime() + CHINA_UTC_OFFSET_MS);
  const day = date.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  date.setUTCHours(0, 0, 0, 0);
  return new Date(date.getTime() - CHINA_UTC_OFFSET_MS);
}

export async function getPlanetStats(now = new Date()) {
  const weekStart = startOfCurrentWeek(now);
  const [memberCount, signalCount, weeklySignalCount] = await prisma.$transaction([
    prisma.anonymousVisitor.count({ where: { status: 'active' } }),
    prisma.post.count({ where: { status: 'published' } }),
    prisma.post.count({ where: { status: 'published', publishedAt: { gte: weekStart } } })
  ]);

  return { memberCount, signalCount, weeklySignalCount };
}
