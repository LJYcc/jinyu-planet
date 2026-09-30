import type { ApiSuccess } from '~/types/api';
import type { PostDetail, PostListItem, PostsPage } from '~/types/post';

export type ListPostsQuery = {
  topic?: string;
  q?: string;
  sort?: 'latest' | 'featured';
  page: number;
  pageSize: number;
};

export type CreatePostInput = {
  type: 'article' | 'short' | 'photo' | 'link';
  topic: string;
  title: string;
  contentHtml: string;
  externalUrl: string;
  tags: string[];
  clientNonce: string;
};

type PostsResponse = ApiSuccess<PostListItem[], Omit<PostsPage, 'items'>>;
type CreatePostResponse = ApiSuccess<{ slug: string }, { created: boolean }>;

// 帖子 service 只处理 HTTP 请求和 API 响应解包，筛选状态由页面或 composable 管理。
/** 按筛选条件读取帖子分页数据。 */
export async function listPosts(query: ListPostsQuery) {
  const response = await $fetch<PostsResponse>('/api/posts', { query });
  if (!response.metadata) {
    throw new Error('Posts response is missing pagination metadata.');
  }

  return {
    items: response.data,
    ...response.metadata
  } satisfies PostsPage;
}

/** 读取精选帖子列表。 */
export async function listFeaturedPosts() {
  const response = await $fetch<ApiSuccess<PostListItem[]>>('/api/posts/featured');
  return response.data;
}

/** 按 slug 读取帖子详情。 */
export async function getPostDetail(slug: string) {
  const response = await $fetch<ApiSuccess<PostDetail>>(`/api/posts/${encodeURIComponent(slug)}`);
  return response.data;
}

/** 发布帖子并返回公开详情地址所需的 slug。 */
export async function createPost(input: CreatePostInput) {
  const response = await $fetch<CreatePostResponse>('/api/posts', {
    method: 'POST',
    body: input
  });

  return {
    slug: response.data.slug,
    created: response.metadata?.created ?? false
  };
}
