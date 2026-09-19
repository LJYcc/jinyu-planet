# Task 2：匿名访客会话与昵称 API

**描述：** 实现匿名身份初始化。服务端通过 Prisma 创建或恢复 `anonymous_visitors` 与 `visitor_sessions`，生成趣味中文昵称，并用安全 Cookie 保存原始随机令牌；浏览器只收到昵称和必要的公开身份信息。

**验收标准：**

- [ ] `POST /api/visitors/bootstrap` 在无会话 Cookie 时创建访客和会话，在有效 Cookie 下返回同一昵称。
- [ ] 会话令牌以 `HttpOnly`、`Secure`（生产环境）、`SameSite=Lax` Cookie 设置；数据库仅存令牌哈希。
- [ ] 更换昵称 API 仅更新当前访客，已发布帖子的作者署名保持原值或在发布时快照保存。

**验证：**

- [ ] 通过浏览器新会话、刷新和清除 Cookie 检查昵称创建/复用行为。
- [ ] 检查响应 JSON、数据库行和 Cookie，确认原始令牌未泄露。
- [ ] 运行 `npm run lint:eslint` 和 `npm run build`。

**依赖：** Task 1。

**可能修改的文件：**

- `server/api/visitors/bootstrap.post.ts`
- `server/api/visitors/nickname.patch.ts`
- `server/repositories/visitorRepository.ts`
- `server/utils/visitorSession.ts`
- `app/composables/useVisitor.ts`

**预计范围：** 中等，5 个文件。
