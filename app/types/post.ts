// 这些类型描述浏览器使用的公开契约，而不是 Prisma 数据库模型。
// 单独维护一层可以减少 id、会话数据或存储 key 意外泄露的风险。
export type PublicTopic = {
  slug: string;
  name: string;
  description: string;
  colorKey: string;
};

export type PublicTag = {
  slug: string;
  name: string;
};

export type PublicImage = {
  url: string;
  altText: string;
  caption: string | null;
  width: number | null;
  height: number | null;
};

export type PublicAuthor = {
  nickname: string;
};

export type PostListItem = {
  slug: string;
  type: 'article' | 'short' | 'photo' | 'link';
  title: string | null;
  excerpt: string;
  author: PublicAuthor;
  topic: PublicTopic;
  coverImage: PublicImage | null;
  readingMinutes: number;
  publishedAt: string;
};

export type PostDetail = PostListItem & {
  contentHtml: string;
  contentText: string;
  externalUrl: string | null;
  tags: PublicTag[];
  images: PublicImage[];
  recommendations: PostListItem[];
};

export type PostsPage = {
  items: PostListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};
