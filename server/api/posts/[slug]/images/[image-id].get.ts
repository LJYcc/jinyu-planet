import { getRouterParam, setHeader } from 'h3';
import { findPublishedPostImage } from '../../../../repositories/postRepository';
import { getPrivateObject, ObjectStorageUnavailableError } from '../../../../services/object-storage';
import { apiError, defineApiHandler } from '../../../../utils/apiResponse';

export default defineApiHandler(async event => {
  const slug = getRouterParam(event, 'slug');
  const imageId = getRouterParam(event, 'image-id');
  if (!slug || !imageId) apiError(404, 'POST_IMAGE_NOT_FOUND', 'Post image not found.');

  const image = await findPublishedPostImage(slug, imageId);
  if (!image) apiError(404, 'POST_IMAGE_NOT_FOUND', 'Post image not found.');

  const extension = image.storageKey.split('.').pop()?.toLowerCase();
  setHeader(
    event,
    'content-type',
    extension === 'png'
      ? 'image/png'
      : extension === 'webp'
        ? 'image/webp'
        : extension === 'gif'
          ? 'image/gif'
          : 'image/jpeg'
  );
  setHeader(event, 'cache-control', 'public, max-age=86400');
  setHeader(event, 'x-content-type-options', 'nosniff');
  try {
    return await getPrivateObject(image.storageKey);
  } catch (error) {
    if (error instanceof ObjectStorageUnavailableError)
      apiError(503, 'OBJECT_STORAGE_UNAVAILABLE', 'File storage is not configured.');
    throw error;
  }
});
