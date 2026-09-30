# 项目协同文档规则

本项目的需求、任务和任务状态文档必须保持一致。修改实现时，也要检查相关文档是否需要同步；不得只更新其中一份关联文档。

## 关联文档

- 需求来源：`docs/需求文档.md`
- 任务说明与验收：`docs/tasks/task-*.md`
- 实施计划：`docs/tasks/plan.md`
- 任务总清单：`docs/tasks/todo.md`
- 学习日志：`docs/logs/`

## 同步要求

1. 修改 `docs/需求文档.md` 中的功能范围、业务规则、行为、约束或验收要求时，必须同步更新对应的 `docs/tasks/task-*.md`，使任务描述、验收标准和验证步骤与需求一致。
2. 修改 `docs/tasks/task-*.md` 中的功能范围、业务规则、实现约束、验收标准或验证步骤时，必须同步更新 `docs/需求文档.md`，使需求文档反映最终规则。
3. 修改任一 Task 的完成状态时，必须同步更新三处状态：对应的 `task-*.md`、`docs/tasks/plan.md` 和 `docs/tasks/todo.md`。
4. 修改 `plan.md` 或 `todo.md` 中的任务或检查点状态时，必须回查并同步对应的 `task-*.md`；若该状态反映功能规则或验收范围的改变，也必须同步更新 `docs/需求文档.md`。
5. 仅在实现已完成且验证已执行，或用户明确确认完成时，才将检查项从 `[ ]` 改为 `[x]`。
6. 对状态不存在一一对应关系的文档，不要制造无意义的状态字段。例如需求文档不记录 Task 勾选状态；任务状态同步仅涉及 Task、计划和待办文档。

## 学习日志规则

1. 用户提出“生成学习日志”或类似请求时，必须在 `docs/logs/` 下查找已有日志，并先参考其命名、章节结构、代码示例和讲解风格。
2. 新日志必须继续放在 `docs/logs/`，不得在项目根目录另建 `logs/`。
3. 日志文件按任务创建，例如 `task-02-prisma-visitor-session.md`；内容应围绕对应 Task 的实际代码、调用链、关键概念和验证方法展开。
4. 如果 `docs/logs/` 不存在，先创建该目录；如果没有可参考的日志，使用清晰的 Task 标题、背景、代码位置、核心概念、流程和练习方法作为默认结构。
5. `docs/logs/` 下的学习日志仅供本地学习使用，默认保持被 `.gitignore` 忽略，不得加入 Git 提交；生成日志时不要修改忽略规则或主动执行 `git add`。

## 完成前检查

每次涉及以下任意文件的改动，在结束前都要：

1. 找出同一功能或任务关联的需求、Task、计划和待办文件。
2. 同步必要的规则、验收条件、验证步骤和状态。
3. 检查术语、有效期、阈值、接口路径和完成状态在所有关联文件中一致。
4. 运行 `git diff --check`，并在交付说明中列出已同步的文档。

## 验证命令约定

实现代码时不要主动运行 `npm run lint:eslint`、`npm run build` 或其他项目级 lint/build 命令；这些命令由用户在后续阶段自行执行。交付前仍需运行 `git diff --check`。

## 样式实现约定

项目已启用 SCSS 和 Tailwind CSS。复杂视觉效果（例如阴影、渐变、伪元素、动画和组合选择器）写在 SCSS/CSS 类中；字体大小、颜色、外边距、内边距、边框、定位等简单属性优先直接使用 Tailwind 工具类。常规 Flex 盒模型的启用、方向、对齐、换行和间距也优先使用 Tailwind 工具类；仅复杂响应式布局或组合选择器规则保留在 SCSS/CSS 中。新增或修改界面时遵循这一拆分，避免把简单属性继续堆入样式表。

## UI 框架约定

本项目统一使用 Element Plus 作为 UI 框架。按钮、表单、弹窗、提示、菜单等交互控件优先使用 Element Plus 组件；只有 Element Plus 无法覆盖的品牌视觉和布局效果，才补充项目自定义样式。

## Vue 模板命名约定

Vue 模板中的所有组件标签统一使用小写 kebab-case，不使用 PascalCase 或大写标签名。例如使用 `<el-button>`、`<nuxt-link>`、`<post-list>` 和 `<arrow-left>`，不使用 `<ElButton>`、`<NuxtLink>`、`<PostList>` 或 `<ArrowLeft>`。Vue 模板格式严格遵循项目 Prettier 配置：多属性标签的属性逐行书写，结束 `>` 或 `/>` 独立成行；无属性或单属性自闭合标签保持单行。

## 文件与目录命名约定

新增或重命名的文件和目录统一使用 kebab-case（短横线命名），例如
`ai-client.ts`、`ai-chat-repository.ts` 和 `ai-chat/`。Nuxt 路由文件保留框架要求的
HTTP 方法后缀格式，例如 `index.post.ts`、`messages.get.ts`；业务名称部分仍使用 kebab-case。

## 前端数据请求目录约定

前端普通 API 请求统一放在 `app/services/`，页面和组件不直接重复编写 `$fetch`。

### `app/services/`

- 只负责调用 Nuxt API、组装请求参数和解包统一响应 `{ success, data, metadata }`。
- 不保存 Vue 响应式状态，不负责页面 loading、错误文案、弹窗或列表更新。
- 按业务领域命名，例如 `ai-conversation-api.ts`、`post-api.ts`、`topic-api.ts`、`visitor-api.ts`。
- 需要被多个页面或 composable 使用的请求优先放在这里，避免在页面中复制接口路径和响应解析逻辑。

### `app/composables/`

- 负责 `ref`、`computed`、`useState` 等响应式状态和页面业务流程。
- 通过 `app/services/` 调用 API，再把结果转换成页面需要的状态。
- 例如 `useVisitor.ts` 管理匿名访客共享状态，`useHomeData.ts` 管理首页加载状态和数据组合。

### 页面与组件

- `app/pages/` 和 `app/components/` 负责界面展示、用户交互和事件协调，不直接调用普通 API。
- 业务数据更新由拥有状态的父组件或 composable 统一处理，子组件通过 props 和 emits 协作。
- AI 流式请求也必须从 `app/services/` 发起；由于需要读取 `Response.body.getReader()`，service 可以返回原始 `Response`，不能强制解包为 JSON。
- AI 流式响应的片段解析、打字机效果和页面消息状态由 composable 或控制器负责，不能把响应式状态放进 service。
