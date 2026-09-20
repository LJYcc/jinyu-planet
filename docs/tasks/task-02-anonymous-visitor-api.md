# Task 2：匿名访客会话与昵称 API

**描述：** 实现匿名身份初始化。服务端通过 Prisma 创建或恢复 `anonymous_visitors` 与 `visitor_sessions`，生成趣味中文昵称，并用安全 Cookie 保存原始随机令牌；浏览器只收到昵称和必要的公开身份信息。

**验收标准：**

- [ ] `POST /api/visitors/bootstrap` 在无会话 Cookie 时创建访客和会话，在有效 Cookie 下返回同一昵称。
- [ ] 会话令牌以 `HttpOnly`、`Secure`（生产环境）、`SameSite=Lax` Cookie 设置；数据库仅存令牌哈希。
- [ ] 会话默认有效 30 天；仅当有效会话剩余不超过 3 天时，才将同一令牌的 Cookie 和数据库会话同时续期至未来 30 天。
- [ ] 连续 30 天未访问后，系统为访客创建新的匿名身份；旧身份的帖子保持原作者归属，新身份不能管理这些帖子。
- [ ] 更换昵称 API 仅更新当前访客，已发布帖子的作者署名保持原值或在发布时快照保存。

**验证：**

- [ ] 通过浏览器新会话、刷新和清除 Cookie 检查昵称创建/复用行为。
- [ ] 将有效会话的过期时间调整为剩余 3 天以内后访问，确认响应重设 Cookie 且数据库过期时间延长 30 天；剩余超过 3 天时，确认不续期。
- [ ] 使用已过期 Cookie 或等待会话过期后访问，确认创建新访客，且旧帖作者归属不改变。
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
