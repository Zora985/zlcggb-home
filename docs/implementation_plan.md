# 角色生成与动画引擎架构方案 (AI Character Engine Architecture)

当前的痛点是：**想要极具美学价值的美术效果 + 想要精确可控的复杂局部动画（听指令改变动作）**。
大语言模型写原始 SVG 代码的方案在这两点上都碰壁了（画得丑、结构乱无法稳定驱动动画）。

为了彻底解决你的核心诉求，我们必须重构底层技术栈。本方案是目前 2D 互动游戏中最成熟的工业界最佳实践。

## 核心架构原则：LLM 做“导演”，React 做“拼装”，GSAP 做“操偶师”

### 1. 美术生成方案：组件化骨骼拼装 (Component Assembly)
完全**废弃**让 LLM 现写 X/Y 坐标和 SVG 代码。

* **机制改动**：我们在前端预设几套由人类设计师（比如你）画好的超高质量、极其优美的 SVG“白模”素体骨架（包含分离的 `<g id="head">`、`<g id="tail">`、`<g id="eyes">`）。
* **AI 的新工作**：当用户输入“帮我生成一只活泼的黄色小蛇”时，LLM 输出的不再是冗长的 SVG 乱码，而是一份精准的 **JSON 配置文件（DNA 数据）**：
  ```json
  {
    "species": "snake_curve",
    "themeColor": "#FFD54F",
    "accentColor": "#FF8A80",
    "eyesStyle": "cute_blink",
    "personality": "energetic"
  }
  ```
* **前端拼装**：React 获取这个 JSON 后，将预设的优美 SVG 部件组合在一起，并用 `themeColor` 染色。
* **优势**：**美感下限极高**（必定是好看的），彻底告别随机生成的“畸形土豆”。

### 2. 动画控制方案：引入 GSAP (GreenSock Animation Platform)
你提到：“它还可以动，还可以根据一些指令去改变它的运动等等。有没有必要引入 GSAP 动画？”
**答案是：极其有必要，这是让 SVG “活过来”的终极利器。**

* **为什么抛弃纯 CSS？** 现有的 `.breathe { animation: ... }` 是死循环的。当你想让宠物从“呼吸（Idle）”状态平滑过渡到“开心地摇尾巴（Happy）”或者“走向左边（Walk）”时，CSS 动画往往会生硬地瞬间重置跳变。
* **GSAP 的威力**：
  1. 它允许我们在 React 中获取每个 SVG 局部组件的 `ref`（比如 `tailRef`, `eyeRef`）。
  2. 我们可以在 React 中建立一个“状态机（State Machine）”（例如 `status = 'idle' | 'happy' | 'sleeping'`）。
  3. 当用户通过指令让它变 `happy` 时，GSAP 会接管这些 `ref`，精确计算补间动画，让尾巴平滑加速摇摆，眼睛平滑弯成月牙缺，身体平滑抖动。

---

## 实施步骤 (Proposed Changes)

1. **依赖引入 [修改]**
   - 运行 `npm install gsap @gsap/react` 引入业界标准的动画库。

2. **核心生成逻辑重构 [修改 `src/lib/creatorPrompts.ts` 与 `CreatorWorkshop.tsx`]**
   - 将角色的 System Prompt 彻底改为输出 JSON 格式（而非 SVG 文本）。
   - 让 AI 根据用户的自然语言描述，推导出该角色的“组件库参数”和“性格参数（决定初始 GSAP 动画幅度）”。

3. **创建动态 SVG 骨骼系统 [新建 `src/components/pet/DynamicAvatar.tsx`]**
   - 创建一个通用的 SVG 渲染容器组件。
   - 它能够接收 AI 传来的 JSON 配置。
   - 它内部预埋好了优美的标准化 SVG 模板（例如：基础爬行动物模板、基础小狗模板）。
   - 为关键节点（头、手、脚、尾巴）绑定 `ref`。

4. **GSAP 动画控制器集成 [新建 `src/components/pet/useCharacterAnim.ts`]**
   - 编写 React Hook，利用 `@gsap/react` 监管状态变更（`idle`, `excited`, `sad`）。
   - 基于状态驱动 GSAP Timeline 播放不同的复杂动画组合，彻底替换原本长达上百行的 `getSystemPrompt` 里的 CSS 动画逻辑。

## 待核对问题 (Open Questions)

> [!IMPORTANT]
> **我们需要你做决定：**
> 这种“JSON拼装 + GSAP驱动骨骼”的体系非常强大，但它的前提需要我们要花一点点时间准备 1-2 套极简的“SVG 基础素体模板”（比如设计一个极简通用圆润小动物素体）。
> 
> 这个方案完美契合你的“精美外观 + 听指令动态改变运动”的诉求。你是否确认按照这套【工业级重构方案】继续推进？如果确认，第一步我将为你安装 GSAP 并在项目中搭起这个架构！
