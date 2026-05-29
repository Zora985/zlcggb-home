# AI 角色架构重构任务清单

- [x] 1. 基础架构搭建
  - [x] 安装 `gsap` 和 `@gsap/react` 依赖。
  - [x] 清理并移除旧的基于 SVG 文本渲染的冗余代码。
- [x] 2. 核心骨骼系统设计 (DynamicAvatar)
  - [x] 创建 `DynamicAvatar.tsx`。
  - [x] 设计一套极简、可重用的超高质量 SVG “素体”骨架与配饰（包含分离的眼、耳、口、尾巴节点）。
  - [x] 预留 React Refs 便于后续 GSAP 接管绑定。
- [x] 3. AI 提示词与数据流重构
  - [x] 重写 `creatorPrompts.ts`，强制生成符合 `AvatarConfig` 格式的超规范 JSON，停止输出原始 SVG。
  - [x] 改造 `creatorStore.ts` 以及解析端代码，支持提取和校验 JSON 装备单。
- [x] 4. GSAP 操偶师集成 (useCharacterAnim)
  - [x] 创建状态机 Hook：`useCharacterAnim.ts`。
  - [x] 编写核心动作轴：Idle（沉浮呼吸）、Happy（摇尾巴/伸展）、Sleep（闭眼平缓呼吸）的平滑过渡 Timeline。
  - [x] 将骨骼 Refs 联结到动画库。
- [x] 5. 渲染接口更新与测试
  - [x] 在 `CreatorWorkshop.tsx` 预览区替换新渲染。
  - [x] 在 `PetEngine.tsx` 替换新渲染，进行互动与走动测试验证。
