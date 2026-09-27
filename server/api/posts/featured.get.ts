import { listHomeFeaturedPosts } from '../../repositories/postRepository';
import { apiSuccess, defineApiHandler } from '../../utils/apiResponse';

export default defineApiHandler(async () => {
  return apiSuccess(await listHomeFeaturedPosts());
});
