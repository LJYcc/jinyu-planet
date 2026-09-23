# Task 7：AI Chat 页面与服务端适配器

**描述：** 实现 `/ai-chat`、全站 AI 入口和不含供应商实现细节的服务端 AI 适配器。当前服务未配置时诚实呈现未连接/失败状态；千问接入时仅替换服务端适配器并读取环境变量。

**验收标准：**

- [ ] 所有公开页面的右下角 AI 助理入口都可到达 `/ai-chat`，移动端不遮挡内容或安全区。
- [ ] AI 页面具备欢迎、建议问题、输入、用户消息、请求中、停止、新建会话、错误和重试状态。
- [ ] 未配置 AI 服务时，`POST /api/ai/chat` 返回可辨识的未配置错误，界面不伪造模型回答；浏览器代码不含千问密钥。

**验证：**

- [ ] 人工检查全部公开页面的入口和 AI 页面各状态。
- [ ] 检查生产构建产物/浏览器网络请求，确认密钥不出现在客户端。

**依赖：** Task 4。

**可能修改的文件：**

- `app/components/AiAssistantFab.vue`
- `app/pages/ai-chat.vue`
- `app/components/AiChatPanel.vue`
- `server/api/ai/chat.post.ts`
- `server/services/aiClient.ts`

**预计范围：** 中等，5 个文件。
