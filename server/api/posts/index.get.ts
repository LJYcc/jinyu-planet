import { getQuery } from 'h3';
import { listPublishedPosts } from '../../repositories/postRepository';
import { apiError, apiSuccess, defineApiHandler } from '../../utils/apiResponse';
import { normalizePositiveInteger } from '../../utils/pagination';

export default defineApiHandler(async event => {
  // getQuery 读取的是不可信的 URL 参数，必须先校验和归一化，再交给
  // repository 组装 Prisma 条件。
  const query = getQuery(event);
  const page = normalizePositiveInteger(query.page, 1);
  const pageSize = normalizePositiveInteger(query.pageSize, 12, 100);
  if (!page || !pageSize) {
    apiError(400, 'INVALID_PAGINATION', 'page must be >= 1 and pageSize must be between 1 and 100.');
  }

  const topic = typeof query.topic === 'string' ? query.topic.trim() : undefined;
  const search = typeof query.q === 'string' ? query.q.trim().slice(0, 160) : undefined;
  const sortValue = typeof query.sort === 'string' ? query.sort.trim() : '';
  if (sortValue && sortValue !== 'latest' && sortValue !== 'featured') {
    apiError(400, 'INVALID_SORT', 'sort must be latest or featured.');
  }
  const sort = sortValue === 'featured' ? 'featured' : 'latest';
  // repository 返回页码、总数和总页数，前端可直接渲染分页器。
  const postPage = await listPublishedPosts({
    topic: topic || undefined,
    query: search || undefined,
    sort,
    page,
    pageSize
  });
  return apiSuccess(postPage.items, {
    page: postPage.page,
    pageSize: postPage.pageSize,
    total: postPage.total,
    totalPages: postPage.totalPages,
    hasMore: postPage.hasMore
  });
});
