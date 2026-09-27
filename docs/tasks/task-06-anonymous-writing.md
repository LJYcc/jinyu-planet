# Task 6：wangEditor 匿名发帖闭环

**描述：** 实现帖子创建 API 和 `/write`。访客通过匿名会话发帖，前端使用已安装的 `@wangeditor-next/editor-for-vue`，草稿仅本地保存，发布时由服务端验证、消毒、计算派生字段并通过 Prisma 写入数据库。同时在公共 Header 提供搜索入口，提交关键词后跳转至 `/posts?q=关键词`，复用星球广场的公开搜索能力且不引入登录模块。发布结果使用统一 API 响应，其中帖子数据位于 `data`，是否首次创建位于 `metadata.created`，业务失败返回稳定错误代码和 HTTP 状态码。发帖路由由认证中间件提前校验匿名会话，请求体读取与字段业务验证保持分层。

**验收标准：**

- [x] `POST /api/posts` 仅接受有效匿名会话，按长文、短帖、图文和链接分享的不同规则校验主题、标题、正文/说明、原始链接和长度限制，执行限流并使用 `client_nonce` 防止重复提交。
- [x] 服务端消毒 HTML，生成 `content_text`、摘要、阅读时长和唯一 slug；不接受前端提供的作者 ID、状态或发布时间。
- [x] `/write` 使用 wangEditor 且仅客户端挂载；支持按内容类型切换输入项、本地草稿、昵称更换、预览、发布成功和跳转新帖子详情。
- [x] 发帖页面主操作显示为“投递新信号”；发布成功后提供“浏览星球广场”和“查看这条信号”入口。
- [x] 公共 Header 提供搜索入口；搜索提交后跳转星球广场并带上 `q` 查询参数，不显示登录、注册或账号入口。

**验证：**

- [x] 人工检查 wangEditor 挂载和离开页面时的 SSR/hydration 行为。
- [x] 人工检查：四种内容类型的必填项、长度限制、编辑、刷新恢复草稿、预览、提交、重复点击提交和发布后广场/详情可见。
- [x] 人工检查：Header 搜索输入关键词后进入 `/posts?q=关键词`，星球广场显示对应搜索条件；Header 不出现登录模块。

**后续优化：**

- 当前 `POST /api/posts` 的发布限流使用服务端进程内 `Map` 保存访客记录；后续需要清理长期过期的访客 key，避免服务持续运行时内存增长，并在多实例或 Serverless 部署时评估改用 Redis 等共享存储。

**依赖：** Task 2、Task 3、Task 5。

**可能修改的文件：**

- `server/api/posts/index.post.ts`
- `server/utils/postValidation.ts`
- `server/utils/requestValidation.ts`
- `server/utils/auth.ts`
- `server/utils/authorization.ts`
- `server/middleware/api-auth.ts`
- `server/repositories/postRepository.ts`
- `app/pages/write.vue`
- `app/components/PostEditor.vue`
- `app/components/SiteHeader.vue`
- `app/pages/posts/index.vue`

**预计范围：** 中等，7 个文件。
