import { getRouterParam, setHeader } from 'h3';
import { findPublishedPostCover } from '../../../repositories/postRepository';
import { getPrivateObject, ObjectStorageUnavailableError } from '../../../services/object-storage';
import { apiError, defineApiHandler } from '../../../utils/apiResponse';

export default defineApiHandler(async event => {
  const slug = getRouterParam(event, 'slug');
  if (!slug) apiError(404, 'POST_NOT_FOUND', 'Post not found.');

  const post = await findPublishedPostCover(slug);
  if (!post?.coverImage) apiError(404, 'COVER_NOT_FOUND', 'Cover not found.');

  const extension = post.coverImage.storageKey.split('.').pop()?.toLowerCase();
  const contentType =
    extension === 'png'
      ? 'image/png'
      : extension === 'webp'
        ? 'image/webp'
        : extension === 'gif'
          ? 'image/gif'
          : 'image/jpeg';
  setHeader(event, 'content-type', contentType);
  setHeader(event, 'cache-control', 'public, max-age=86400');
  setHeader(event, 'x-content-type-options', 'nosniff');
  try {
    return await getPrivateObject(post.coverImage.storageKey);
  } catch (error) {
    if (error instanceof ObjectStorageUnavailableError) {
      apiError(503, 'OBJECT_STORAGE_UNAVAILABLE', 'File storage is not configured.');
    }
    throw error;
  }
});
