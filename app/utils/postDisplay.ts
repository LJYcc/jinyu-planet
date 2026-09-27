import type { PostListItem } from '~/types/post';

export function postDisplayTitle(post: Pick<PostListItem, 'title' | 'excerpt'>) {
  return post.title?.trim() || post.excerpt;
}

export function postDisplayExcerpt(post: Pick<PostListItem, 'title' | 'excerpt'>) {
  const title = post.title?.trim();
  return title && title !== post.excerpt.trim() ? post.excerpt : '';
}
