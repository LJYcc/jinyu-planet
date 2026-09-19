# Task 6：wangEditor 匿名发帖闭环

**描述：** 实现帖子创建 API 和 `/write`。访客通过匿名会话发帖，前端使用已安装的 `@wangeditor-next/editor-for-vue`，草稿仅本地保存，发布时由服务端验证、消毒、计算派生字段并通过 Prisma 写入数据库。

**验收标准：**

- [ ] `POST /api/posts` 仅接受有效匿名会话，校验帖子类型/主题/标题/正文/链接，执行限流并使用 `client_nonce` 防止重复提交。
- [ ] 服务端消毒 HTML，生成 `content_text`、摘要、阅读时长和唯一 slug；不接受前端提供的作者 ID、状态或发布时间。
- [ ] `/write` 使用 wangEditor 且仅客户端挂载；支持本地草稿、昵称更换、预览、发布成功和跳转新帖子详情。

**验证：**

- [ ] 运行 `npm run build`，确认 wangEditor 不发生 SSR/hydration 错误。
- [ ] 人工检查：编辑、刷新恢复草稿、预览、提交、重复点击提交和发布后广场/详情可见。
- [ ] 运行 `npm run lint:eslint`。

**依赖：** Task 2、Task 3、Task 5。

**可能修改的文件：**

- `server/api/posts/index.post.ts`
- `server/utils/postValidation.ts`
- `server/repositories/postRepository.ts`
- `app/pages/write.vue`
- `app/components/PostEditor.vue`

**预计范围：** 中等，5 个文件。
