import { createError, defineEventHandler, getQuery } from 'h3';
import { listPublishedPosts } from '../../repositories/postRepository';
import { normalizePositiveInteger } from '../../utils/pagination';

export default defineEventHandler(async event => {
  // getQuery 读取的是不可信的 URL 参数，必须先校验和归一化，再交给
  // repository 组装 Prisma 条件。
  const query = getQuery(event);
  const page = normalizePositiveInteger(query.page, 1);
  const pageSize = normalizePositiveInteger(query.pageSize, 12, 50);
  if (!page || !pageSize) {
    throw createError({ statusCode: 400, statusMessage: 'page must be >= 1 and pageSize must be between 1 and 50.' });
  }

  const topic = typeof query.topic === 'string' ? query.topic.trim() : undefined;
  const search = typeof query.q === 'string' ? query.q.trim().slice(0, 160) : undefined;
  // repository 返回页码、总数和总页数，前端可直接渲染分页器。
  return listPublishedPosts({ topic: topic || undefined, query: search || undefined, page, pageSize });
});
