import type { PostStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';

// 所有公开读取接口都在 repository 边界统一限制状态，避免接口忘记过滤
// hidden 或 pending 帖子，导致未公开内容被返回。
const PUBLIC_STATUS: PostStatus = 'published';
const RECOMMENDATION_LIMIT = 3;

export type PostListQuery = {
  topic?: string;
  query?: string;
  page: number;
  pageSize: number;
};

function publicImage(image: {
  publicUrl: string;
  altText: string;
  caption: string | null;
  width: number | null;
  height: number | null;
}) {
  // 不把 storageKey、数据库 id 或 Prisma 关系字段暴露给浏览器。
  return {
    url: image.publicUrl,
    altText: image.altText,
    caption: image.caption,
    width: image.width,
    height: image.height
  };
}

function publicPost(post: {
  slug: string;
  type: 'article' | 'short' | 'photo' | 'link';
  title: string | null;
  excerpt: string;
  readingMinutes: number;
  publishedAt: Date;
  visitor: { nickname: string };
  topic: { slug: string; name: string; description: string; colorKey: string };
  coverImage: Parameters<typeof publicImage>[0] | null;
}) {
  // 这是列表项和相关推荐共用的公开 DTO 映射。
  // 集中转换可以避免 Prisma 模型结构直接变成 API 契约。
  return {
    slug: post.slug,
    type: post.type,
    title: post.title,
    excerpt: post.excerpt,
    author: { nickname: post.visitor.nickname },
    topic: {
      slug: post.topic.slug,
      name: post.topic.name,
      description: post.topic.description,
      colorKey: post.topic.colorKey
    },
    coverImage: post.coverImage ? publicImage(post.coverImage) : null,
    readingMinutes: post.readingMinutes,
    publishedAt: post.publishedAt.toISOString()
  };
}

function postWhere(query: PostListQuery) {
  const search = query.query?.trim();
  const filters = [];

  if (search) {
    // 搜索只作用于用户可读字段，由数据库执行条件匹配，避免把所有帖子
    // 读入 Node.js 内存后再搜索。
    filters.push({
      OR: [{ title: { contains: search } }, { excerpt: { contains: search } }, { contentText: { contains: search } }]
    });
  }

  return {
    status: PUBLIC_STATUS,
    ...(query.topic ? { topic: { slug: query.topic, isActive: true } } : {}),
    ...(filters.length ? { AND: filters } : {})
  };
}

const listSelect = {
  // 必须显式 select：Prisma 的 include 默认会读取全部标量字段，可能把很大的
  // HTML/纯文本正文也读出来；列表接口只需要摘要字段。
  id: true,
  slug: true,
  type: true,
  title: true,
  excerpt: true,
  readingMinutes: true,
  publishedAt: true,
  visitor: { select: { nickname: true } },
  topic: { select: { slug: true, name: true, description: true, colorKey: true } },
  coverImage: {
    select: { publicUrl: true, altText: true, caption: true, width: true, height: true }
  }
} as const;

export async function listPublishedPosts(query: PostListQuery) {
  const where = postWhere(query);
  const [total, posts] = await prisma.$transaction([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: listSelect
    })
  ]);
  const totalPages = Math.ceil(total / query.pageSize);

  return {
    items: posts.map(publicPost),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages,
    hasMore: query.page < totalPages
  };
}

export async function listTopics() {
  // 前端只需要启用中的主题，并按照后台配置的展示顺序返回。
  return prisma.topic.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { slug: true, name: true, description: true, colorKey: true }
  });
}

export async function findPublishedPostBySlug(slug: string) {
  // 详情接口是唯一需要读取完整正文、标签和图片元数据的读取路径。
  const post = await prisma.post.findFirst({
    where: { slug, status: PUBLIC_STATUS },
    select: {
      id: true,
      topicId: true,
      slug: true,
      type: true,
      title: true,
      excerpt: true,
      contentHtml: true,
      contentText: true,
      externalUrl: true,
      readingMinutes: true,
      publishedAt: true,
      visitor: { select: { nickname: true } },
      topic: { select: { slug: true, name: true, description: true, colorKey: true } },
      coverImage: {
        select: { publicUrl: true, altText: true, caption: true, width: true, height: true }
      },
      tagLinks: { include: { tag: { select: { slug: true, name: true } } } },
      images: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: { publicUrl: true, altText: true, caption: true, width: true, height: true }
      }
    }
  });

  if (!post) return null;

  // 相关推荐复用列表投影，保持查询轻量，也不会意外带出其他帖子的完整正文。
  const recommendations = await prisma.post.findMany({
    where: {
      status: PUBLIC_STATUS,
      topicId: post.topicId,
      id: { not: post.id }
    },
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: RECOMMENDATION_LIMIT,
    select: listSelect
  });

  return {
    ...publicPost(post),
    contentHtml: post.contentHtml,
    contentText: post.contentText,
    externalUrl: post.externalUrl,
    tags: post.tagLinks.map(({ tag }) => tag),
    images: post.images.map(publicImage),
    recommendations: recommendations.map(publicPost)
  };
}
