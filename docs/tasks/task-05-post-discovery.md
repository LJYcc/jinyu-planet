# Task 5：星球广场与帖子详情阅读

**描述：** 将 Task 3 的读取 API 接入前端，实现 `/posts` 与 `/posts/:slug`。访客可按主题、关键词和页码分页浏览内容，并安全阅读 wangEditor 输出的帖子正文。

**验收标准：**

- [ ] `/posts` 支持主题筛选、关键词搜索和加载更多/下一页，URL 查询参数可复现当前筛选状态。
- [ ] `/posts/:slug` 显示帖子元信息、正文、图片、标签和相关推荐；详情中不安全 HTML 不会执行。
- [ ] 列表和详情具备加载、空结果、接口失败和 404 状态；复制链接和返回广场入口可用。

**验证：**

- [ ] 人工检查筛选、搜索、进入详情、返回广场、刷新查询 URL 与不存在 slug。

**依赖：** Task 3、Task 4。

**可能修改的文件：**

- `app/pages/posts/index.vue`
- `app/pages/posts/[slug].vue`
- `app/components/PostList.vue`
- `app/components/ArticleContent.vue`
- `app/utils/sanitizeRichText.ts`

**预计范围：** 中等，5 个文件。
