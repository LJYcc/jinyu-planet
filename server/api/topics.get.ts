import { listTopics } from '../repositories/postRepository';
import { apiSuccess, defineApiHandler } from '../utils/apiResponse';

export default defineApiHandler(async () => apiSuccess(await listTopics()));
