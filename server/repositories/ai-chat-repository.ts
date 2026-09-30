/**
 * AI 会话和消息数据仓储。
 *
 * 集中处理匿名访客的会话归属、消息历史和幂等保存，并将 Prisma 数据
 * 转换为 API 和模型调用可以安全使用的最小数据结构。
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export type AiMessageForModel = {
  role: 'user' | 'assistant';
  content: string;
};

export type PublicAiMessage = AiMessageForModel & {
  id: string;
  reasoningContent: string | null;
  reasoningDurationMs: number | null;
  createdAt: string;
};

export type PublicAiConversation = {
  id: string;
  title: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

/** 将数据库会话转换为不暴露 Prisma Date 对象的公开 DTO。 */
function toPublicConversation(conversation: {
  id: string;
  title: string | null;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: conversation.id,
    title: conversation.title,
    isPinned: conversation.isPinned,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString()
  } satisfies PublicAiConversation;
}

/** 将数据库消息转换为前端可以直接消费的公开 DTO。 */
function toPublicMessage(message: {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoningContent: string | null;
  reasoningDurationMs: number | null;
  createdAt: Date;
}) {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    reasoningContent: message.reasoningContent,
    reasoningDurationMs: message.reasoningDurationMs,
    createdAt: message.createdAt.toISOString()
  } satisfies PublicAiMessage;
}

/** 为当前匿名访客创建一个空会话。 */
export async function createAiConversation(visitorId: string) {
  // 空会话只在用户首次真正发送时由路由调用，仓储层不主动替页面创建默认会话。
  const conversation = await prisma.aiConversation.create({
    data: { visitorId },
    select: { id: true, title: true, isPinned: true, createdAt: true, updatedAt: true }
  });
  return toPublicConversation(conversation);
}

/** 按最近更新时间读取当前匿名访客拥有的全部会话。 */
export async function listAiConversations(visitorId: string) {
  const conversations = await prisma.aiConversation.findMany({
    where: { visitorId },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
    select: { id: true, title: true, isPinned: true, createdAt: true, updatedAt: true }
  });
  return conversations.map(toPublicConversation);
}

/** 查找属于指定匿名访客的会话，用于统一执行归属校验。 */
export async function findOwnedAiConversation(visitorId: string, conversationId: string) {
  return prisma.aiConversation.findFirst({
    where: { id: conversationId, visitorId },
    select: { id: true, title: true, isPinned: true, createdAt: true, updatedAt: true }
  });
}

/** 更新属于当前匿名访客的会话标题或置顶状态。 */
export async function updateOwnedAiConversation(
  visitorId: string,
  conversationId: string,
  data: { title?: string; isPinned?: boolean }
) {
  const result = await prisma.aiConversation.updateMany({
    where: { id: conversationId, visitorId },
    data
  });

  if (result.count === 0) {
    return null;
  }

  return findOwnedAiConversation(visitorId, conversationId);
}

/** 删除属于当前匿名访客的会话及其关联消息。 */
export async function deleteOwnedAiConversation(visitorId: string, conversationId: string) {
  const result = await prisma.aiConversation.deleteMany({ where: { id: conversationId, visitorId } });
  return result.count > 0;
}

/** 校验会话归属后读取按时间升序排列的完整消息历史。 */
export async function listAiMessages(visitorId: string, conversationId: string) {
  // 先断言归属，再读消息；不能只按 conversationId 查询，否则可猜测 UUID 的访客可能越权读取历史。
  const conversation = await findOwnedAiConversation(visitorId, conversationId);
  if (!conversation) return null;

  const messages = await prisma.aiMessage.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      role: true,
      content: true,
      reasoningContent: true,
      reasoningDurationMs: true,
      createdAt: true
    }
  });
  return messages.map(message =>
    toPublicMessage(
      message as {
        id: string;
        role: 'user' | 'assistant';
        content: string;
        reasoningContent: string | null;
        reasoningDurationMs: number | null;
        createdAt: Date;
      }
    )
  );
}

/** 读取最近消息并恢复时间顺序，避免把完整历史发送给模型。 */
export async function listRecentAiMessagesForModel(
  conversationId: string,
  limit: number
): Promise<AiMessageForModel[]> {
  const messages = await prisma.aiMessage.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
    select: { role: true, content: true }
  });
  return messages.reverse().map(message => ({ role: message.role, content: message.content }));
}

type UserMessageResult = {
  id: string;
  createdAt: Date;
  reused: boolean;
};

/** 保存 user 消息；相同 nonce 重试时复用原消息，保证请求幂等。 */
export async function createOrReuseUserMessage(
  visitorId: string,
  conversationId: string,
  content: string,
  clientNonce: string
): Promise<UserMessageResult | null> {
  const conversation = await findOwnedAiConversation(visitorId, conversationId);
  if (!conversation) return null;

  const existing = await prisma.aiMessage.findUnique({
    where: { conversationId_clientNonce: { conversationId, clientNonce } },
    select: { id: true, createdAt: true }
  });
  if (existing) return { ...existing, reused: true };

  try {
    const message = await prisma.$transaction(async transaction => {
      const created = await transaction.aiMessage.create({
        data: { conversationId, role: 'user', content, clientNonce },
        select: { id: true, createdAt: true }
      });
      await transaction.aiConversation.update({
        where: { id: conversationId },
        data: {
          // 标题是首条用户消息的摘要。已有标题不可覆盖，后续消息只更新时间用于列表排序。
          title: conversation.title ?? content.slice(0, 160),
          updatedAt: new Date()
        }
      });
      return created;
    });
    return { ...message, reused: false };
  } catch (error) {
    // 两个并发请求可能同时通过上面的查询，唯一约束是最后一道幂等保护。
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const duplicated = await prisma.aiMessage.findUnique({
        where: { conversationId_clientNonce: { conversationId, clientNonce } },
        select: { id: true, createdAt: true }
      });
      if (duplicated) return { ...duplicated, reused: true };
    }
    throw error;
  }
}

/** 查找指定用户消息之后已经保存的 assistant 回复，用于幂等重试恢复。 */
export async function findAssistantAfterUser(conversationId: string, userCreatedAt: Date) {
  return prisma.aiMessage.findFirst({
    where: {
      conversationId,
      role: 'assistant',
      createdAt: { gt: userCreatedAt }
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { content: true, reasoningContent: true, reasoningDurationMs: true }
  });
}

/** 在上游流完整结束后保存 assistant 消息，并更新时间线。 */
export async function createAssistantMessage(
  conversationId: string,
  content: string,
  reasoningContent: string,
  reasoningDurationMs: number | null
) {
  // assistant 内容只有在上游流完整结束后才写入，避免数据库出现看似完整的半截回答。
  return prisma.$transaction(async transaction => {
    const message = await transaction.aiMessage.create({
      data: {
        conversationId,
        role: 'assistant',
        content,
        reasoningContent: reasoningContent || null,
        reasoningDurationMs
      },
      select: {
        id: true,
        role: true,
        content: true,
        reasoningContent: true,
        reasoningDurationMs: true,
        createdAt: true
      }
    });
    await transaction.aiConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    return toPublicMessage(
      message as {
        id: string;
        role: 'user' | 'assistant';
        content: string;
        reasoningContent: string | null;
        reasoningDurationMs: number | null;
        createdAt: Date;
      }
    );
  });
}
