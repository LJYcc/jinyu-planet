# 金鱼星球 · Goldfish Planet

一个可以短暂停靠的数字星球。

金鱼星球是一个面向普通人的匿名内容空间：访客无需注册，即可获得轻量昵称，阅读或投递一条信号；也可以在独立的 AI 对话空间里继续未完成的思考。这个项目由 [廖瑾宇](mailto:453036921@qq.com) 独立设计与持续开发，用于探索内容型产品从产品设想、交互体验到服务端数据与 AI 能力的完整交付。

## 功能概览

- 匿名访客：服务端签发 HttpOnly 会话 Cookie，访客拥有稳定的临时昵称，无需注册账号。
- 信号创作：支持富文本、图片、引用、表格、代码块、草稿自动保存、发布前预览与安全校验。
- 内容发现：星球广场支持主题筛选、关键词搜索、最新/精选排序、分页与公开详情阅读。
- 安全阅读：富文本经过服务端校验与客户端清洗；详情页保留表格、引用、代码、图片和视频等阅读结构。
- AI 对话：独立 AI Chat 页面支持匿名会话历史、流式回复、深度思考、联网搜索来源、Markdown/KaTeX/Mermaid 和附件对话。
- 私有附件：图片、PDF、DOCX、CSV、TXT 等附件归属于匿名访客，通过受保护接口预览，不向浏览器暴露 OSS 凭据或永久对象地址。
- 关于星球：展示项目当前功能、下一步路线以及发起人联系入口。

## 技术栈

- 前端：Nuxt 4、Vue 3、TypeScript、Element Plus、Tailwind CSS、SCSS
- 内容编辑：wangEditor
- 服务端与数据：Nuxt Server Routes、Prisma 7、MySQL / MariaDB
- AI：千问（DashScope）流式接口、Markdown、KaTeX、Mermaid
- 文件存储：阿里云 OSS 私有对象存储

## 本地启动

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制示例配置并在本机填写真实值：

```bash
cp .env.example .env
```

Windows PowerShell 可使用：

```powershell
Copy-Item .env.example .env
```

至少需要配置开发用 MySQL 的 `DATABASE_URL` 与 `SHADOW_DATABASE_URL`。两者必须指向不同数据库；用户名或密码中的 `@`、`:`、`/`、`?`、`#` 等字符需要 URL 编码。

如需启用 AI 对话、联网搜索或附件能力，再配置对应的 `QWEN_*` 与 `ALI_OSS_*` 环境变量。未配置的服务端能力应保持不可用状态，不要在客户端填写或暴露密钥。

### 3. 初始化数据库

以下命令只应指向本地开发数据库：

```bash
npx prisma migrate dev
npx prisma db seed
```

种子脚本会写入初始星球主题。

### 4. 启动开发服务

```bash
npm run dev
```

默认访问地址为 `http://localhost:3000`。

## 常用命令

```bash
npm run dev            # 启动开发服务
npm run build          # 构建生产产物
npm run preview        # 预览生产构建
npm run lint:eslint    # 运行 ESLint
npm run lint:prettier  # 格式化项目文件
npx prisma generate    # 生成 Prisma Client
npx prisma migrate dev # 创建并应用开发迁移
npx prisma db seed     # 写入初始主题
```

## 项目结构

```text
app/                 # Vue 页面、组件、composable 与前端 service
server/              # Nuxt API、领域服务、Repository、鉴权与校验
prisma/              # Prisma Schema、迁移与主题 seed
docs/                # 需求、任务、数据设计与学习记录
public/              # 可公开访问的静态资源
```

前端普通 API 请求统一封装在 `app/services/`；页面和组件只负责状态、交互和展示。服务端 API 使用统一响应格式：成功为 `{ success, data, metadata? }`，失败为 `{ success, code, message }`。

## 安全与开源注意事项

- `.env` 已被 Git 忽略；不要提交真实数据库连接、千问 API Key、OSS Access Key、SSH 私钥或生产配置。
- GitHub Actions 与部署环境应使用 GitHub Secrets 或部署平台的环境变量，不要将秘密写进工作流、代码或文档。
- 生产环境应配置内容审核策略、限流和可信来源；匿名不代表没有边界。
- 请勿向 AI 输入密码、身份证号、精确住址等敏感信息；模型输出可能有误，应自行核验。
- 个人简历不随仓库公开。如需完整简历或进一步交流，欢迎邮件联系我。

## 下一步

- 新闻信号板块与“今日星球简报”：聚合可信 API/RSS 来源，保留原文链接与可核验 AI 摘要。
- AI 数字人“星球电台”直播：基于新闻简报和站内精选信号，探索定时直播、匿名投稿上墙与可追溯回放。
- 标签推荐与治理、内容维护工具，以及更温和的社区互动方式。

详细的需求与任务规划见 [docs/需求文档.md](docs/需求文档.md)、[Task 10](docs/tasks/task-10-news-signals.md) 与 [Task 11](docs/tasks/task-11-ai-digital-human-live.md)。

## 许可证

本项目使用 [MIT License](LICENSE)。你可以查看、使用、修改和分发自己的副本，但需保留版权与许可证声明；这不授予对本仓库的直接写入权限。
