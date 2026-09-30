import lakeCover from '~/assets/images/post-cover-lakeside-cabin-night.png';
import deskCover from '~/assets/images/post-cover-writing-desk-dawn.png';
import { listFeaturedPosts, listPosts } from '~/services/post-api';
import { listTopics } from '~/services/topic-api';
import type { PostListItem, PublicTopic } from '~/types/post';

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
      const [postPage, featuredPostsData, topicsData] = await Promise.all([
        listPosts({ page: 1, pageSize: 6 }),
        listFeaturedPosts(),
        listTopics()
      ]);
      posts.value = postPage.items;
      featuredPosts.value = featuredPostsData;
      topics.value = topicsData;
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
