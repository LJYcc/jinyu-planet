# Task 4：公共壳层与金鱼星球首页

**描述：** 建立金鱼星球的共享页面壳层和首页。公共壳层包括固定 Header、Logo 状态切换、桌面主导航、页脚和右下角 AI 助理入口；同时创建首页、广场、发帖、关于和 AI Chat 的页面入口/占位页面。首页通过公开 API 显示精选信号、主题和最新着陆，并提供加载、空数据和请求错误状态。精选信号优先读取站长维护的已发布精选帖子并按排序展示，数量不足时以最新公开帖子补齐；匿名访客不具备修改精选配置的入口。

**实现约束：**

- UI 组件统一使用 Element Plus，并通过 `@element-plus/nuxt` 接入；主题色使用项目定义的暖金色，不使用默认蓝色。
- Header 从页面加载开始固定在顶部：首页首屏使用透明深色模式，滚动或进入非首页路由后使用浅色背景和深色 Logo/文字；横向菜单不显示默认下划线。
- 桌面端显示“首页、星球广场、投递新信号、关于星球”主导航和搜索入口，不显示 Header 右侧的发帖 CTA；点击搜索图标打开固定高度的搜索弹窗，Dialog 内容容器不设置内边距，搜索输入与结果内容各自保留阅读留白，结果区独立滚动并让滚动条贴住弹窗右边缘；滚动条始终预留宽度、仅在悬停时显示滑块，避免内容宽度变化；弹窗打开时锁定页面滚动，Header 保持原有视口宽度，AI 助理改用视口左侧坐标定位、不使用 right 补偿和运行时宽度计算。移动端不提供折叠菜单按钮，核心跳转由页面内容入口完成。
- Logo、图标和 favicon 使用 `app/assets/logo/` 与 `public/` 中的本地资源；当前采用未来科技方向的抽象金鱼、行星、轨道和信号节点标记，组合 Logo 使用 `goldfish-planet-logo-tech.png` 与 `goldfish-planet-logo-light-tech.png`，独立图标使用 `goldfish-planet-icon-tech.png`，favicon 使用 `public/favicon-goldfish-planet-tech.ico`。组合 Logo 保留科技版图案，中文与英文文字参照 `goldfish-planet-logo-light-imagegen-v6.png` 的圆润粗体风格，不使用中间黄色横线，保持图案原始宽高比，图标可见高度明显高于文字并控制透明画布留白；UI 参考图使用 `app/assets/ui/`，中文使用本地 Noto Sans SC，首页英文展示文字使用本地 Source Sans 3。
- Vue 文件的局部样式使用 `<style scoped lang="scss">`；全局 CSS 只保留 reset、token、字体入口、容器和通用工具类。首页、Header、Footer 和布局专属样式分别放回所属文件。
- 浏览器端首页和访客 API 请求封装在 `app/services/`，`useHomeData` 与 `useVisitor` 负责状态和页面流程，不在页面中重复编写 `$fetch`。

**验收标准：**

- [x] 首页、星球广场、投递新信号、关于星球和 AI Chat 页面入口已创建，公共 Header、Footer 和 AI 助理入口已接入；`/about` 保留星球定位首屏，并以当前功能、后续轨道及发起人介绍与联系入口呈现项目概览。桌面首屏的发起人信息使用右侧低对比、小尺寸署名卡，不抢占项目介绍层级，且仅保留联系发起人入口；窄屏时自然纵向排列。发起人姓名、头像文案、邮箱和 GitHub 链接集中在页面配置中，未配置的外部链接不渲染；联系入口先尝试打开邮件客户端，同时复制公开邮箱并给出反馈。底部“关于作者”通过 Dialog 展示作者的公开专业背景与能力概览，技能分类及重点能力加粗，内容不展示个人敏感信息及与站点功能无关的细节。
- [x] Header 使用 Logo 资源，桌面端 Logo、含“投递新信号”的主导航和搜索右侧操作区布局稳定；不显示右侧发帖 CTA。搜索图标打开固定高度的搜索弹窗，内容容器不设置内边距，输入与结果内容各自保留阅读留白，滚动条贴住右边缘；输入关键词后以最多 100 条的单次请求展示公开帖子，结果区独立滚动、预留稳定滚动条宽度且仅悬停时显示滑块，并锁定页面滚动；锁屏期间 Header 保持原有视口宽度，AI 助理使用视口左侧坐标定位、不进行 right 补偿和运行时宽度计算；滚动和非首页路由使用浅色主题，菜单无默认下划线。
- [x] 首页展示品牌、定位文案、星球自述、精选信号、主题、最新着陆、漂流瓶提示和发帖引导，不出现作品集、订阅或周刊。
- [x] 首页内容由 API 数据驱动；精选信号优先按站长维护的精选标记和排序展示，不足 4 条时以最新公开帖子补齐；无数据、加载和请求错误时显示明确状态。
- [x] 首页和共享壳层样式已按页面/组件归属拆分，通用文本省略等工具类保留在全局组件样式中。

**验证：**

- [x] 人工检查约 1440px 与 390px 宽：首页无横向溢出，Header 不因滚动或路由切换跳动。
- [x] 人工检查首页、广场、发帖、关于和 AI Chat 的跳转，确认首页与内页 Header 对比度、Logo 和文字均可读。
- [x] 人工检查 API 加载中、空数据和请求错误状态，以及首页英文标题字体和移动端换行。

**依赖：** Task 2、Task 3。

**主要文件：**

- `app/app.vue`
- `app/layouts/default.vue`
- `app/components/site-header.vue`
- `app/components/site-footer.vue`
- `app/pages/index.vue`
- `app/pages/posts/index.vue`
- `app/pages/write.vue`
- `app/pages/about.vue`
- `app/pages/ai-chat.vue`
- `app/assets/css/base.css`
- `app/assets/css/components.css`
- `app/assets/css/fonts.css`
- `app/assets/css/main.css`
- `app/assets/css/responsive.css`
- `app/assets/css/tokens.css`
- `app/assets/logo/`
- `public/fonts/`
- `public/favicon-goldfish-planet-tech.ico`
- `nuxt.config.ts`

**预计范围：** 中等，涉及公共壳层、首页页面、占位页面、主题资源和样式分层。
