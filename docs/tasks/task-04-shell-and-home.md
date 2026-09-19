# Task 4：公共壳层与金鱼星球首页

**描述：** 实现共享导航、页脚、右下角 AI 占位入口和首页视觉结构。本地 Noto Sans SC 字体、全局 token、响应式样式在本任务建立；首页通过 Task 3 的公开 API 显示精选信号、主题和最新着陆。

**验收标准：**

- [ ] 使用 `public/fonts/` 三个 WOFF2 文件且不请求 Google Fonts；桌面与移动导航都能访问首页、广场、发帖和关于页。
- [ ] 首页展示品牌、定位文案、星球自述、精选信号、主题、最新着陆和发帖引导，不出现作品集、订阅或周刊。
- [ ] 首页内容由 API 数据驱动；无数据、加载和请求错误时显示明确状态。

**验证：**

- [ ] 运行 `npm run lint:eslint` 和 `npm run build`。
- [ ] 人工检查约 1440px 与 390px 宽：首页无横向溢出，导航和两个主要入口可跳转。

**依赖：** Task 2、Task 3。

**可能修改的文件：**

- `app/layouts/default.vue`
- `app/components/SiteHeader.vue`
- `app/components/SiteFooter.vue`
- `app/pages/index.vue`
- `app/assets/css/main.css`

**预计范围：** 中等，5 个文件。
