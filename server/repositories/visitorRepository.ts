/**
 * 匿名访客数据仓储。
 *
 * 集中封装访客、会话的 Prisma 查询和更新，并通过公开 DTO 映射
 * 阻止数据库内部字段直接泄露到 API 响应。
 */
import type { AnonymousVisitor, VisitorSession } from '@prisma/client';
import { prisma } from '../utils/prisma';

export type VisitorWithSession = VisitorSession & {
  visitor: AnonymousVisitor;
};

export type PublicVisitor = Pick<AnonymousVisitor, 'nickname' | 'status'>;

/** 查找仍有效、未撤销且所属访客未被禁用的会话。 */
export async function findValidVisitorSession(tokenHash: string, now = new Date()) {
  // 所有需要身份的接口都必须经过这里，统一检查哈希、撤销时间、过期时间和访客状态。
  return prisma.visitorSession.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: now },
      visitor: { status: 'active' }
    },
    include: { visitor: true }
  });
}

/** 更新会话活跃时间，并同步更新访客的最后访问时间。 */
export async function touchVisitorSession(sessionId: string, visitorId: string, now = new Date(), expiresAt?: Date) {
  // 一次请求同时更新会话和访客的活跃时间，事务保证两张表不会只更新一张。
  const sessionData = expiresAt ? { lastSeenAt: now, expiresAt } : { lastSeenAt: now };
  await prisma.$transaction([
    prisma.visitorSession.update({ where: { id: sessionId }, data: sessionData }),
    prisma.anonymousVisitor.update({ where: { id: visitorId }, data: { lastSeenAt: now } })
  ]);
}

/** 在一个事务中创建匿名访客和对应会话。 */
export async function createVisitorSession(nickname: string, tokenHash: string, expiresAt: Date) {
  // 创建访客和会话必须是一个事务：访客创建失败时不能留下孤立会话。
  return prisma.$transaction(async transaction => {
    const visitor = await transaction.anonymousVisitor.create({ data: { nickname } });
    const session = await transaction.visitorSession.create({
      data: { visitorId: visitor.id, tokenHash, expiresAt }
    });
    return { visitor, session };
  });
}

/** 更新当前匿名访客的公开昵称；帖子通过 visitorId 继续归属于该访客。 */
export async function updateVisitorNickname(visitorId: string, nickname: string) {
  // 通过服务端解析出的 visitorId 更新，客户端不能直接提交任意 visitorId。
  return prisma.anonymousVisitor.update({
    where: { id: visitorId },
    data: { nickname }
  });
}

/** 将数据库访客对象映射为只含公开字段的 API DTO。 */
export function toPublicVisitor(visitor: Pick<AnonymousVisitor, 'nickname' | 'status'>): PublicVisitor {
  // 不把 id、时间字段或数据库内部结构返回给浏览器，控制公开 API 的数据边界。
  return { nickname: visitor.nickname, status: visitor.status };
}
