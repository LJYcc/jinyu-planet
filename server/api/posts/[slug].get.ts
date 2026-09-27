import { getRouterParam } from 'h3';
import { findPublishedPostBySlug } from '../../repositories/postRepository';
import { apiError, apiSuccess, defineApiHandler } from '../../utils/apiResponse';

export default defineApiHandler(async event => {
  // 路由参数是公开 slug，不接受数据库内部 id。
  const slug = getRouterParam(event, 'slug')?.trim();
  if (!slug) {
    apiError(404, 'POST_NOT_FOUND', 'Post not found.');
  }

  // repository 内部已经限制 status=published，因此 hidden 和 pending 帖子对
  // 公开读者表现为和不存在 slug 一样的 404。
  const post = await findPublishedPostBySlug(slug);
  if (!post) {
    apiError(404, 'POST_NOT_FOUND', 'Post not found.');
  }

  return apiSuccess(post);
});
