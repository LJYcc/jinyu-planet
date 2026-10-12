# Task 6：wangEditor 匿名发帖闭环

**描述：** 实现帖子创建 API 和 `/write`。访客通过匿名会话发帖，前端使用已安装的 `@wangeditor-next/editor-for-vue`，草稿仅本地保存，发布时由服务端验证、消毒、计算派生字段并通过 Prisma 写入数据库。同时在公共 Header 提供固定高度搜索弹窗，输入关键词后直接查询最多 100 条公开帖子，结果区独立滚动且不引入登录模块。发布结果使用统一 API 响应，其中帖子数据位于 `data`，是否首次创建位于 `metadata.created`，业务失败返回稳定错误代码和 HTTP 状态码。发帖路由由认证中间件提前校验匿名会话，请求体读取与字段业务验证保持分层。

**前端数据边界：** 发帖和主题请求统一封装在 `app/services/post-api.ts` 与 `app/services/topic-api.ts`，`/write` 页面保留表单、草稿、预览和提交状态，不直接重复编写 `$fetch`；左侧正文编辑区与右侧信号设置区分别由 `write-content-editor.vue` 和 `write-signal-settings.vue` 负责展示，标题、主题、标签和正文通过 Vue `defineModel` / `v-model:*` 双向绑定，交互动作通过语义化事件上报。

**验收标准：**

- [ ] `POST /api/posts` 仅接受有效匿名会话，校验必填的主题、标题和富文本正文及长度限制；可选封面必须是当前访客已上传的图片，执行限流并使用 `client_nonce` 防止重复提交。
- [x] 服务端消毒 HTML，生成 `content_text`、摘要、阅读时长和唯一 slug；不接受前端提供的作者 ID、状态或发布时间。
- [ ] `/write` 使用 wangEditor 且仅客户端挂载；桌面端左侧保留沉浸式正文编辑区、右侧集中标题、主题、封面、标签和投递设置；封面方形预览悬停提供放大预览与移除操作，封面与正文图片保持独立，封面只用于列表/主卡展示，不插入正文；正文区域固定高度并独立滚动，编辑内容不带动页面滚动；标题、主题和正文必填，支持完整常用排版工具（文字样式、颜色、字号字体、行高、对齐缩进、列表、表格、代码块、链接、图片、外链视频、格式刷与全屏）、封面与正文图片上传、本地草稿、昵称更换、预览、发布成功和跳转新帖子详情；从页面主操作点击“投递到金鱼星球”必须二次确认后才发送发布请求，预览弹窗内的确认投递直接发布；视频文件上传不在本期范围内。
- [x] `/write` 支持通过 `topic` 查询参数预选有效主题；从星球广场参与本周主题进入时覆盖主题选择，缺少或无效参数时保留草稿主题或默认首个主题。
- [ ] 帖子详情正文使用普通内容容器复用 wangEditor 原生内容排版样式，保持与编辑器中的字体、字号、行高、H1-H6 标题、代码块、链接、表格尺寸规则和其他结构元素一致。
- [x] 发帖页面主操作显示为“投递新信号”；发布成功后提供“浏览星球广场”和“查看这条信号”入口。
- [x] 公共 Header 提供搜索入口；点击后打开固定高度搜索弹窗，Dialog 内容容器不设置内边距，输入与结果内容各自保留阅读留白、滚动条贴住右边缘；输入关键词后直接展示最多 100 条公开帖子，结果区独立滚动、预留稳定滚动条宽度且仅悬停时显示滑块，并锁定页面滚动；锁屏时 Header 保持原有视口宽度、AI 助理使用视口左侧坐标定位，不进行运行时宽度计算；保留“投递新信号”主导航，不显示登录、注册、账号入口或 Header 右侧发帖 CTA。

**验证：**

- [x] 人工检查 wangEditor 挂载和离开页面时的 SSR/hydration 行为。
- [ ] 人工检查：标题、主题和正文的必填项、长度限制、封面与正文图片上传和移除、编辑、刷新恢复草稿、预览（固定高度弹窗、标题/主题/署名/阅读信息及正文排版与详情一致，正文区域悬停显示滚动条）、提交、重复点击提交和发布后广场/详情可见。
- [x] 人工检查：Header 搜索弹窗输入关键词后显示对应公开帖子及加载、空、失败状态，滚轮仅滚动结果区且页面保持锁定；悬停显示滚动条时列表宽度和文字换行保持不变，锁屏及解锁时 Header 与 AI 助理不闪动；Header 保留“投递新信号”主导航，不出现登录模块或右侧发帖 CTA。

**后续优化：**

- 标签推荐属于下一期迭代：管理员可标记热门/推荐标签，并用人工排序控制顺序；发帖页下拉先展示未隐藏的热门标签，再展示普通已有标签，同时继续允许访客输入新标签。`Tag` 需增加 `isFeatured`、`sortOrder`、`isHidden` 等治理字段，并补充读取 API 与受信任的维护流程。
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
- `app/components/posts/post-editor.vue`
- `app/components/posts/write-content-editor.vue`
- `app/components/posts/write-signal-settings.vue`
- `app/components/site-header.vue`
- `app/pages/posts/index.vue`

**预计范围：** 中等，7 个文件。
