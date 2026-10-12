/**
 * 帖子和主题数据仓储。
 *
 * 集中处理公开内容筛选、精选排序、帖子创建和详情推荐查询，
 * 并通过显式 select 与 DTO 映射控制返回字段范围。
 */
import { createHash } from 'node:crypto';
import type { PostStatus, PostType } from '@prisma/client';
import { prisma } from '../utils/prisma';

// 所有公开读取接口都在 repository 边界统一限制状态，避免接口忘记过滤
// hidden 或 pending 帖子，导致未公开内容被返回。
const PUBLIC_STATUS: PostStatus = 'published';
const RECOMMENDATION_LIMIT = 3;

export type PostListQuery = {
  topic?: string;
  query?: string;
  sort?: 'latest' | 'featured';
  page: number;
  pageSize: number;
};

export type PostCreation = {
  visitorId: string;
  topicId: number;
  type: PostType;
  title: string | null;
  contentHtml: string;
  contentText: string;
  excerpt: string;
  externalUrl: string | null;
  tags: string[];
  clientNonce: string;
  readingMinutes: number;
  slug: string;
  cover: { storageKey: string; mimeType: string } | null;
  bodyImages: Array<{ id: string; storageKey: string }>;
};

/** 根据标签名称生成稳定且不依赖中文转写规则的标签 slug。 */
function createTagSlug(name: string) {
  // 标签名可以是中文；使用稳定哈希作为 URL 标识，避免手写中文转写规则。
  return `tag-${createHash('sha256').update(name).digest('hex').slice(0, 32)}`;
}

/** 将数据库图片元数据转换为公开图片 DTO。 */
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

/** 将帖子查询结果转换为列表和相关推荐共用的公开 DTO。 */
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

/** 根据主题和关键词构造只允许读取公开帖子的 Prisma 条件。 */
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
    ...(query.sort === 'featured' ? { isFeatured: true } : {}),
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

/** 按时间分页读取公开帖子，并返回分页元数据。 */
export async function listPublishedPosts(query: PostListQuery) {
  const where = postWhere(query);
  const [total, posts] = await prisma.$transaction([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy:
        query.sort === 'featured'
          ? [{ featuredRank: 'asc' }, { publishedAt: 'desc' }, { id: 'desc' }]
          : [{ publishedAt: 'desc' }, { id: 'desc' }],
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

/** 按人工精选排序读取首页帖子，不足数量时用最新公开帖子补齐。 */
export async function listHomeFeaturedPosts(limit = 4) {
  const featuredPosts = await prisma.post.findMany({
    where: { status: PUBLIC_STATUS, isFeatured: true },
    orderBy: [{ featuredRank: 'asc' }, { publishedAt: 'desc' }, { id: 'desc' }],
    take: limit,
    select: listSelect
  });

  if (featuredPosts.length === limit) return featuredPosts.map(publicPost);

  const fallbackPosts = await prisma.post.findMany({
    where: {
      status: PUBLIC_STATUS,
      ...(featuredPosts.length ? { id: { notIn: featuredPosts.map(post => post.id) } } : {})
    },
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: limit - featuredPosts.length,
    select: listSelect
  });

  return [...featuredPosts, ...fallbackPosts].map(publicPost);
}

/** 读取启用中的主题，并按后台配置的展示顺序返回。 */
export async function listTopics() {
  // 前端只需要启用中的主题，并按照后台配置的展示顺序返回。
  return prisma.topic.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { slug: true, name: true, description: true, colorKey: true }
  });
}

/** 根据 slug 查找可用于发帖的启用主题。 */
export async function findActiveTopicBySlug(slug: string) {
  return prisma.topic.findFirst({ where: { slug, isActive: true }, select: { id: true } });
}

/** 查询访客和 client nonce 的组合，支持发帖请求幂等。 */
export async function findPostByVisitorAndNonce(visitorId: string, clientNonce: string) {
  return prisma.post.findUnique({
    where: { visitorId_clientNonce: { visitorId, clientNonce } },
    select: { slug: true }
  });
}

/** 创建已发布帖子及其标签关联，并返回公开详情 slug。 */
export async function createPublishedPost(input: PostCreation) {
  return prisma.$transaction(async transaction => {
    const post = await transaction.post.create({
      data: {
        visitorId: input.visitorId,
        topicId: input.topicId,
        type: input.type,
        status: 'published',
        title: input.title,
        contentHtml: input.contentHtml,
        contentText: input.contentText,
        excerpt: input.excerpt,
        externalUrl: input.externalUrl,
        clientNonce: input.clientNonce,
        readingMinutes: input.readingMinutes,
        slug: input.slug,
        tagLinks: {
          create: input.tags.map(name => ({
            tag: { connectOrCreate: { where: { name }, create: { name, slug: createTagSlug(name) } } }
          }))
        }
      },
      select: { id: true, slug: true }
    });

    if (input.cover) {
      const cover = await transaction.postImage.create({
        data: {
          postId: post.id,
          storageKey: input.cover.storageKey,
          publicUrl: `/api/posts/${post.slug}/cover`,
          altText: input.title ?? '帖子封面'
        },
        select: { id: true }
      });
      await transaction.post.update({ where: { id: post.id }, data: { coverImageId: cover.id } });
    }

    await Promise.all(
      input.bodyImages.map((image, index) =>
        transaction.postImage.create({
          data: {
            id: image.id,
            postId: post.id,
            storageKey: image.storageKey,
            publicUrl: `/api/posts/${post.slug}/images/${image.id}`,
            altText: input.title ?? '帖子图片',
            sortOrder: index + 1
          }
        })
      )
    );

    if (input.bodyImages.length) {
      const publicContentHtml = input.bodyImages.reduce(
        (html, image) => html.replaceAll(`/api/uploads/${image.id}`, `/api/posts/${post.slug}/images/${image.id}`),
        input.contentHtml
      );
      await transaction.post.update({ where: { id: post.id }, data: { contentHtml: publicContentHtml } });
    }

    return { slug: post.slug };
  });
}

export async function findPublishedPostCover(slug: string) {
  return prisma.post.findFirst({
    where: { slug, status: PUBLIC_STATUS },
    select: { coverImage: { select: { storageKey: true, publicUrl: true } } }
  });
}

export async function findPublishedPostImage(slug: string, imageId: string) {
  return prisma.postImage.findFirst({
    where: { id: imageId, post: { slug, status: PUBLIC_STATUS } },
    select: { storageKey: true }
  });
}

/** 读取公开帖子详情、正文图片、标签和同主题相关推荐。 */
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
