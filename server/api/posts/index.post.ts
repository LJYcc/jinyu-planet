import { Prisma } from '@prisma/client';
import {
  createPublishedPost,
  findActiveTopicBySlug,
  findPostByVisitorAndNonce
} from '../../repositories/postRepository';
import { findOwnedPostCover, findOwnedPostImages } from '../../repositories/file-asset-repository';
import { touchVisitorSession } from '../../repositories/visitorRepository';
import { apiError, apiSuccess, defineApiHandler } from '../../utils/apiResponse';
import { getVisitorSession } from '../../utils/auth';
import { PostInputError, validatePostInput } from '../../utils/postValidation';
import { readJsonBody } from '../../utils/requestValidation';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_POSTS = 3;
const publishAttempts = new Map<string, number[]>();

function checkPublishRateLimit(visitorId: string, now = Date.now()) {
  const attempts = (publishAttempts.get(visitorId) ?? []).filter(timestamp => timestamp > now - RATE_LIMIT_WINDOW_MS);
  if (attempts.length >= RATE_LIMIT_MAX_POSTS) {
    apiError(429, 'PUBLISH_RATE_LIMITED', 'Publishing too frequently. Please try again later.');
  }
  attempts.push(now);
  publishAttempts.set(visitorId, attempts);
}

export default defineApiHandler(async event => {
  const session = getVisitorSession(event);

  let input;

  try {
    input = validatePostInput(await readJsonBody(event));
  } catch (error) {
    if (error instanceof PostInputError) apiError(400, 'INVALID_POST_INPUT', error.message);
    throw error;
  }

  // 同一 nonce 的客户端重试直接返回首次结果，不消耗额外发布额度。
  const existing = await findPostByVisitorAndNonce(session.visitor.id, input.clientNonce);
  if (existing) return apiSuccess(existing, { created: false });

  const topic = await findActiveTopicBySlug(input.topicSlug);
  if (!topic) apiError(400, 'TOPIC_UNAVAILABLE', 'The selected topic is unavailable.');

  const cover = input.coverAssetId ? await findOwnedPostCover(session.visitor.id, input.coverAssetId) : null;
  if (input.coverAssetId && !cover) apiError(400, 'COVER_UNAVAILABLE', 'The selected cover is unavailable.');
  const bodyImages = await findOwnedPostImages(session.visitor.id, input.bodyImageAssetIds);
  if (bodyImages.length !== input.bodyImageAssetIds.length)
    apiError(400, 'POST_IMAGE_UNAVAILABLE', 'One or more inserted images are unavailable.');
  if (
    [...input.contentHtml.matchAll(/<img\b[^>]*\bsrc=["']\/api\/uploads\/([0-9a-f-]{36})["'][^>]*>/gi)].some(match => {
      const assetId = match[1];
      return !assetId || !input.bodyImageAssetIds.includes(assetId);
    })
  ) {
    apiError(400, 'POST_IMAGE_UNAVAILABLE', 'One or more inserted images are unavailable.');
  }

  checkPublishRateLimit(session.visitor.id);
  await touchVisitorSession(session.id, session.visitor.id);

  try {
    const post = await createPublishedPost({
      ...input,
      visitorId: session.visitor.id,
      topicId: topic.id,
      cover,
      bodyImages: input.bodyImageAssetIds.map(id => bodyImages.find(image => image.id === id)!)
    });
    return apiSuccess(post, { created: true });
  } catch (error) {
    // 数据库唯一索引兜底处理并发的双击/网络重试。
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const duplicate = await findPostByVisitorAndNonce(session.visitor.id, input.clientNonce);
      if (duplicate) return apiSuccess(duplicate, { created: false });
    }
    throw error;
  }
});
