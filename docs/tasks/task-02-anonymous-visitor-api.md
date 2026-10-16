# Task 2：匿名访客会话与昵称 API

**描述：** 实现匿名身份初始化。服务端通过 Prisma 创建或恢复 `anonymous_visitors` 与 `visitor_sessions`，生成趣味中文昵称，并用安全 Cookie 保存原始随机令牌；浏览器只收到昵称和必要的公开身份信息。成功和失败响应遵循全站统一 API 契约，且不暴露令牌或数据库内部字段。需要既有匿名身份的路由由 Nitro 认证中间件校验 Cookie 和会话有效性，并将会话放入请求上下文。

**验收标准：**

- [x] `POST /api/visitors/bootstrap` 在无会话 Cookie 时创建访客和会话，在有效 Cookie 下返回同一昵称。
- [x] 会话令牌以 `HttpOnly`、`SameSite=Lax` Cookie 设置，并在实际请求协议为 HTTPS 时设置 `Secure`；数据库仅存令牌哈希。
- [x] 会话默认有效 30 天；仅当有效会话剩余不超过 3 天时，才将同一令牌的 Cookie 和数据库会话同时续期至未来 30 天。
- [x] 连续 30 天未访问后，系统为访客创建新的匿名身份；旧身份的帖子保持原作者归属，新身份不能管理这些帖子。
- [x] 更换昵称 API 仅更新当前访客的公开昵称；历史和后续帖子通过稳定的 `visitorId` 归属该访客，并展示当前昵称。

**验证：**

- [x] 通过浏览器新会话、刷新和清除 Cookie 检查昵称创建/复用行为。
- [x] 将有效会话的过期时间调整为剩余 3 天以内后访问，确认响应重设 Cookie 且数据库过期时间延长 30 天；剩余超过 3 天时，确认不续期。
- [x] 使用已过期 Cookie 或等待会话过期后访问，确认创建新访客，且旧帖仍归属于原 `visitorId`；原访客更换昵称后，历史帖子展示更新后的昵称。
- [x] 检查响应 JSON、数据库行和 Cookie，确认原始令牌未泄露。
- [x] 当前首版以 HTTP 部署：已检查响应 Cookie 不带 `Secure`，并能在后续受保护请求中携带会话。服务端仍按实际请求协议决定 `Secure` 属性；启用 HTTPS 域名时，须在上线复核中检查该响应带 `Secure` 且会话可用。

**依赖：** Task 1。

**可能修改的文件：**

- `server/api/visitors/bootstrap.post.ts`
- `server/api/visitors/nickname.patch.ts`
- `server/repositories/visitorRepository.ts`
- `server/utils/visitorSession.ts`
- `server/utils/apiResponse.ts`
- `server/utils/auth.ts`
- `server/middleware/api-auth.ts`
- `app/composables/useVisitor.ts`

**预计范围：** 中等，5 个文件。
