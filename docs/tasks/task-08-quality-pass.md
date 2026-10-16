# Task 8：响应式、可访问性、SEO 与发布质量

**描述：** 在核心路径完成后统一检查可访问性、移动布局、SEO、图片性能和错误状态。只修复发布质量问题，不扩展评论、点赞、账户或其他未批准功能。

**验收标准：**

- [x] 页面有独立标题、描述、Open Graph 配置、robots 与 sitemap 配置位，且具备站内 404 页面。
- [x] 键盘可操作导航、筛选、写作和 AI 输入；图片有替代文本，焦点状态和文字对比度清晰。
- [x] 首页、广场、详情、发帖、AI Chat 在常见桌面/移动尺寸无横向滚动、重叠或悬浮控件遮挡；图片有稳定尺寸和延迟加载。

**验证：**

- [x] 使用 Playwright 在桌面和移动尺寸执行主流程及 Tab 键检查。
- [x] 使用 Playwright 验证 API 错误、空数据、404 和 AI 服务请求失败的页面反馈。

**依赖：** Task 4、Task 5、Task 6、Task 7。

**可能修改的文件：**

- `app/error.vue`
- `app/app.vue`
- `nuxt.config.ts`
- `public/robots.txt`
- `app/assets/css/main.css`

**预计范围：** 中等，5 个文件。
