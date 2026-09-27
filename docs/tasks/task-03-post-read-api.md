# Task 3：主题与帖子读取 API

**描述：** 建立公开内容读取契约：主题列表、帖子分页列表和帖子详情。Prisma repository 只返回 `published` 内容，支持主题筛选和关键词搜索，并将数据库行转换为稳定的前端 DTO。成功响应统一使用 `{ success: true, data, metadata? }`，分页信息放在 `metadata`；失败响应使用稳定错误代码和匹配 HTTP 状态码。

**验收标准：**

- [x] `GET /api/topics` 按 `sort_order` 返回启用主题。
- [x] `GET /api/posts` 支持 `topic`、`q`、`page` 和 `pageSize`，只返回公开帖子且不会一次读取全部内容。
- [x] `GET /api/posts/:slug` 返回详情、主题、匿名昵称、标签、图片元数据和相关推荐；不存在/隐藏帖子返回 404。

**验证：**

- [x] 使用种子/测试帖子分别验证默认列表、主题筛选、关键词搜索、页码分页和 404。
- [x] 检查 API 响应不含会话令牌、数据库内部字段或未公开帖子。

**依赖：** Task 1。

**可能修改的文件：**

- `server/api/topics.get.ts`
- `server/api/posts/index.get.ts`
- `server/api/posts/[slug].get.ts`
- `server/repositories/postRepository.ts`
- `server/utils/apiResponse.ts`
- `app/types/post.ts`
- `app/types/api.ts`

**预计范围：** 中等，5 个文件。
