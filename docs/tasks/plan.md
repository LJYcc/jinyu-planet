# 金鱼星球实现计划（数据库与 API 版）

## 概览

金鱼星球首版采用 MySQL、Prisma 和 Nuxt 服务端 API，但不做登录。访客以服务端签发的匿名会话 Cookie 身份浏览和发帖；前端只负责显示随机昵称，不拥有可伪造的作者 ID。页面包含首页、广场、详情、wangEditor 发帖和 AI Chat；千问仅在后续通过服务端代理接入。

数据库表、关系和 PostgreSQL SQL 见 [`../数据库表设计.md`](../数据库表设计.md)。任务总清单见 `todo.md`。

## 架构决策

- 首页精选使用帖子上的人工精选标记和排序字段，只读取已发布帖子；精选不足 4 条时由最新公开帖子补齐，匿名访客没有修改该配置的接口。

- 使用 Nuxt server routes 作为浏览器唯一 API 边界；Prisma 是 schema、migration 和数据库访问的唯一 ORM，数据库客户端封装在 `server/`，不进入客户端 bundle。
- 服务端 API 使用统一的成功/失败 JSON 契约：成功返回 `success`、`data` 与可选 `metadata`，失败返回 `success`、稳定错误 `code` 和 `message`，并保留 HTTP 状态码。
- 受保护路由通过 Nitro server middleware 唯一负责匿名会话校验并写入请求上下文，业务路由只读取认证上下文；参数读取、领域验证和权限断言分别位于独立工具层。公开读取接口不经身份校验，为后续 Bearer Token、角色与资源权限接入保留边界。
- 匿名会话用随机令牌的 HttpOnly Cookie 加服务端哈希存储实现，不引入注册或登录。
- 帖子正文保存为消毒后的 wangEditor HTML，同时派生纯文本、摘要和阅读时长；列表/详情都从 API 读取。
- 图片上传和千问 API 需独立服务端接口，但分别在对应功能接入时实施。
- 生产环境默认公开匿名发帖前，必须配置限流和内容策略；表结构已预留 `pending`、`published`、`hidden` 状态。

## 依赖图

```text
Task 1: 数据库连接与迁移
  └─> Task 2: 匿名访客会话 API
        └─> Task 3: 帖子/主题读取 API
              ├─> Task 4: 公共壳层与首页
              ├─> Task 5: 广场与详情阅读
              └─> Task 6: wangEditor 发帖 API 与页面

Task 4 ─> Task 7: AI Chat 页面与服务端适配器
Task 4 + Task 5 + Task 6 + Task 7 ─> Task 8: 发布质量检查
```

## 任务顺序

### Phase 1：数据与公开阅读

- [x] Task 1: [数据库连接与初始迁移](task-01-database-foundation.md)
- [x] Task 2: [匿名访客会话与昵称 API](task-02-anonymous-visitor-api.md)
- [x] Task 3: [主题与帖子读取 API](task-03-post-read-api.md)

### Checkpoint：数据层

- [x] 数据库迁移和主题种子数据在开发库执行成功。
- [x] 未带 Cookie 的请求可获得匿名会话；公开读取 API 不暴露会话令牌。

### Phase 2：页面与发布

- [x] Task 4: [公共壳层与金鱼星球首页](task-04-shell-and-home.md)
- [x] Task 5: [星球广场与帖子详情阅读](task-05-post-discovery.md)
- [x] Task 6: [wangEditor 匿名发帖闭环](task-06-anonymous-writing.md)

### Checkpoint：内容闭环

- [x] 访客可完成“获取匿名昵称 -> 发帖 -> API 持久化 -> 广场 -> 详情”的流程。
- [x] 主题筛选、关键词搜索和帖子详情均由真实 API 提供数据。

### Phase 3：AI 与质量

- [ ] Task 7: [AI Chat 页面与服务端适配器](task-07-ai-chat.md)
- [ ] Task 8: [响应式、可访问性、SEO 与发布质量](task-08-quality-pass.md)

### Checkpoint：首版完成

- [ ] 所有任务的验收项已完成。
- [ ] 人工检查桌面和移动端的首页、广场、详情、发帖、AI 跳转路径。
- [ ] 上线前已确认限流、内容状态和环境变量配置。

## 风险与缓解

| 风险                       | 影响 | 缓解                                                                                            |
| -------------------------- | ---- | ----------------------------------------------------------------------------------------------- |
| 开发库连接串或权限配置错误 | 高   | 仅在本地开发数据库运行 `migrate dev`；先执行 `prisma validate`，生产环境只用 `migrate deploy`。 |
| 匿名发布被滥用             | 高   | HttpOnly 会话、发布限流、服务端消毒和状态字段；上线前确定审核策略。                             |
| wangEditor 与 SSR 不兼容   | 高   | 只在客户端挂载，离开页面时销毁，并在 Task 6 早期构建验证。                                      |
| AI Key 暴露                | 高   | 仅在 `server/api/ai/chat` 读取环境变量，浏览器不直接请求千问。                                  |
| 中文搜索质量有限           | 中   | 初版使用 `pg_trgm`；需求增长后再接中文分词或搜索服务。                                          |

## 待确认

- 匿名帖子首版直接公开，还是先写入 `pending`。
- 对象存储的上传签名/公开 URL 规则。
- 千问模型、流式响应方案、额度与超时策略。
