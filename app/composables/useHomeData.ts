import lakeCover from '~/assets/images/post-cover-lakeside-cabin-night.png';
import deskCover from '~/assets/images/post-cover-writing-desk-dawn.png';
import type { ApiSuccess } from '~/types/api';
import type { PostListItem, PostsPage, PublicTopic } from '~/types/post';

export function useHomeData() {
  const posts = ref<PostListItem[]>([]);
  const featuredPosts = ref<PostListItem[]>([]);
  const topics = ref<PublicTopic[]>([]);
  const isLoading = ref(true);
  const loadError = ref('');
  const visitorName = ref('路过的星球居民');
  const { bootstrap } = useVisitor();

  const featuredPost = computed(() => featuredPosts.value[0] ?? null);
  const supportingPosts = computed(() => featuredPosts.value.slice(1, 4));
  const latestPosts = computed(() => posts.value.slice(0, 6));

  function formatDate(value: string) {
    return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(value));
  }

  function postCover(post: PostListItem | null, index = 0) {
    return post?.coverImage?.url ?? (index % 2 === 0 ? lakeCover : deskCover);
  }

  async function loadHomeData() {
    isLoading.value = true;
    loadError.value = '';
    try {
      const [postPage, featuredResponse, topicResponse] = await Promise.all([
        $fetch<ApiSuccess<PostListItem[], Omit<PostsPage, 'items'>>>('/api/posts', { query: { page: 1, pageSize: 6 } }),
        $fetch<ApiSuccess<PostListItem[]>>('/api/posts/featured'),
        $fetch<ApiSuccess<PublicTopic[]>>('/api/topics')
      ]);
      posts.value = postPage.data;
      featuredPosts.value = featuredResponse.data;
      topics.value = topicResponse.data;
    } catch {
      loadError.value = '暂时没有连上星球信号，请稍后再试。';
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(async () => {
    await Promise.allSettled([
      loadHomeData(),
      bootstrap().then(visitor => {
        if (visitor?.nickname) visitorName.value = visitor.nickname;
      })
    ]);
  });

  return {
    posts,
    topics,
    isLoading,
    loadError,
    visitorName,
    featuredPost,
    supportingPosts,
    latestPosts,
    formatDate,
    postCover,
    loadHomeData
  };
}
