# zlcggb-home

> 从机械设计到全栈开发 —— 连接实体与代码的桥梁

🌐 **在线访问**: [zlcggb.com](https://zlcggb.com)

## 📖 关于

这是 zlcggb 的个人网站，记录了一个从机械工程师转型为全栈开发者的成长故事。网站展示了机械设计作品、软件开发项目，并分享技术教程与转行经验。

## ✨ 特性

- 🎨 **苹果风格设计** - 简洁优雅的 UI，流畅的动画效果
- 📱 **响应式布局** - 完美适配桌面端和移动端
- ⚡ **高性能** - 基于 Vite 构建，快速加载
- 🔧 **融合型 Logo** - 齿轮 + 代码标签，象征从机械到代码的转型
- 🐾 **电子宠物** - 像素风虚拟宠物系统，支持多房间、AI 创作角色
- 🎄 **3D 圣诞树** - 基于 Three.js 的交互式 3D 体验，支持手势识别

## 🛠️ 技术栈

### 前端框架

| 技术                      | 用途                  |
| ------------------------- | --------------------- |
| **React 18**        | 用户界面构建          |
| **TypeScript**      | 类型安全              |
| **React Router v7** | 客户端路由（SPA）     |
| **Vite 5**          | 构建工具 + 开发服务器 |

### UI / 动画

| 技术                     | 用途                              |
| ------------------------ | --------------------------------- |
| **Tailwind CSS 3** | 原子化 CSS，自定义 Apple 设计系统 |
| **Framer Motion**  | 页面过渡与组件动画                |
| **GSAP**           | 高性能滚动/序列动画               |
| **Lucide React**   | 图标库                            |

### 3D / 视觉

| 技术                                  | 用途                  |
| ------------------------------------- | --------------------- |
| **Three.js**                    | 3D 渲染引擎           |
| **React Three Fiber**           | React 声明式 Three.js |
| **@react-three/drei**           | Three.js 工具集       |
| **@react-three/postprocessing** | 后处理效果            |
| **MediaPipe Tasks Vision**      | 手势识别（WASM）      |

### 后端 / AI

| 技术                      | 用途                              |
| ------------------------- | --------------------------------- |
| **Supabase**        | 数据存储                          |
| **OpenAI 兼容 API** | AI 角色/场景/道具生成（流式 SSE） |

### 部署

| 技术                 | 用途                  |
| -------------------- | --------------------- |
| **Netlify**    | 网站托管 + SPA 重定向 |
| **阿里云**     | 域名服务              |
| **Cloudflare** | 图片 CDN 存储         |

## 🏗️ 架构概览

```
                    ┌──────────────────────────────────────┐
                    │            index.html                │
                    │  (SEO meta / OG / Theme-color)       │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │           main.tsx                    │
                    │  StrictMode → BrowserRouter → App    │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │           App.tsx                     │
                    │  Layout (Navbar + Footer)             │
                    │   └─ Routes                          │
                    │       ├─ /           → HomePage      │
                    │       ├─ /portfolio  → PortfolioPage  │
                    │       ├─ /timeline   → TimelinePage   │
                    │       ├─ /lab        → LabPage        │
                    │       ├─ /pet        → PetPage        │
                    │       ├─ /christmas  → ChristmasPage  │
                    │       └─ /*          → HomePage (404) │
                    └──────────────────────────────────────┘
```

### 设计系统

项目基于自定义的 **Apple 风格设计系统**，通过 Tailwind 扩展实现：

- **色板**: `apple-gray-50` ~ `apple-gray-600`、`apple-blue`
- **字体**: Inter / SF Pro Display（正文）、JetBrains Mono（代码）
- **圆角**: `rounded-apple` (18px)、`rounded-apple-lg` (24px)、`rounded-apple-xl` (30px)
- **阴影**: `shadow-apple` / `shadow-apple-lg` / `shadow-apple-xl`
- **缓动**: `ease-apple` — `cubic-bezier(0.16, 1, 0.3, 1)`
- **深色模式**: 圣诞树页面和电子宠物页面自动切换为深色主题

### 图片代理

开发环境通过 Vite proxy 将 `/api/images/*` 代理到 `https://file.unilumin-gtm.com`，生产环境直接使用完整 URL。逻辑封装在 `src/utils/imageUrl.ts`。

## 📁 项目结构

```
zlcggb-home/
├── public/
│   ├── favicon.svg                 # 网站图标
│   ├── _redirects                  # Netlify SPA 重定向规则
│   ├── models/                     # MediaPipe 手势识别模型
│   │   └── gesture_recognizer.task
│   ├── paintings/                  # Playground 窗户场景图
│   │   ├── beach.png
│   │   ├── space.png
│   │   └── sunset.png
│   ├── pet-sprites/                # 电子宠物 Clawd 各状态精灵图
│   │   ├── clawd-idle.svg
│   │   ├── clawd-happy.svg
│   │   ├── clawd-walking.svg
│   │   ├── clawd-sleeping.svg
│   │   ├── clawd-dizzy.svg
│   │   └── ...
│   └── wasm/                       # MediaPipe WebAssembly 文件
│       ├── vision_wasm_internal.js
│       └── vision_wasm_internal.wasm
├── src/
│   ├── main.tsx                    # 应用启动入口
│   ├── App.tsx                     # 路由定义 + Layout 挂载
│   ├── index.css                   # 全局样式 + Tailwind 指令
│   ├── components/
│   │   ├── Layout.tsx              # 全局布局（Navbar + Footer + FusionLogo）
│   │   ├── HomePage.tsx            # 首页（Hero / 设计思维 / 工具链）
│   │   ├── PortfolioPage.tsx       # 作品集（机械 + 软件项目展示）
│   │   ├── TimelinePage.tsx        # 进化之路（时间线）
│   │   ├── LabPage.tsx             # 技术实验室（教程 / 文章）
│   │   ├── ChristmasPage.tsx       # 交互式 3D 圣诞树
│   │   ├── PetPage.tsx             # 电子宠物主页面
│   │   ├── christmas/              # 圣诞树子模块
│   │   │   ├── ControlPanel.tsx    #   控制面板（形态/视角/演示/识别/编辑）
│   │   │   ├── Experience.tsx      #   R3F 3D 场景容器
│   │   │   ├── TreeSystem.tsx      #   粒子树系统核心
│   │   │   ├── CrystalOrnaments.tsx#   水晶装饰
│   │   │   ├── TechEffects.tsx     #   科技光效
│   │   │   ├── GestureInput.tsx    #   MediaPipe 手势识别
│   │   │   ├── defaultContent.ts   #   默认展示内容配置
│   │   │   └── types.ts            #   类型定义
│   │   └── pet/                    # 电子宠物子模块
│   │       ├── usePetState.ts      #   宠物状态 Hook（饥饿/心情/体力/卫生/睡眠）
│   │       ├── useCharacterAnim.ts #   角色动画 Hook
│   │       ├── PetEngine.tsx       #   像素角色渲染引擎
│   │       ├── PetHUD.tsx          #   状态 HUD（血条 / 心情 / 表情）
│   │       ├── RoomNavigation.tsx  #   底部房间导航 Dock
│   │       ├── CharacterSelect.tsx #   角色选择面板
│   │       ├── PixelCharacter.tsx  #   像素角色模板系统（cat/robot/slime/bunny/bird/bear）
│   │       ├── characters.ts      #   预设角色配置
│   │       ├── AvatarConfig.ts    #   头像配置
│   │       ├── DynamicAvatar.tsx   #   动态头像生成
│   │       ├── LivingRoom.tsx      #   🛋️ 起居室（电视 + 沙发）
│   │       ├── Kitchen.tsx         #   🍳 厨房（冰箱 + 拖拽喂食）
│   │       ├── Bathroom.tsx        #   🚿 浴室（花洒清洁）
│   │       ├── Bedroom.tsx         #   🌙 卧室（台灯 + 睡觉）
│   │       ├── Playground.tsx      #   🎮 游乐场（接星星小游戏）
│   │       ├── CreatorWorkshop.tsx #   🎨 创作工坊（AI 生成角色/场景/道具）
│   │       └── WindowSceneries.tsx #   窗户场景动画
│   ├── lib/                        # 业务逻辑层
│   │   ├── aiClient.ts             #   OpenAI 兼容流式 API 客户端
│   │   ├── creatorPrompts.ts       #   AI 创作模式 Prompt 模板
│   │   ├── creatorStore.ts         #   创作记录持久化（localStorage）
│   │   ├── creationNaming.ts       #   创作命名与标签生成
│   │   ├── svgDownload.ts          #   SVG / PNG / WebP 下载工具
│   │   ├── workshopComposite.ts    #   工坊多层 SVG 合成引擎
│   │   └── workshopSessionStore.ts #   工坊会话持久化
│   └── utils/
│       └── imageUrl.ts             #   图片 URL 代理/CDN 转换
├── docs/                           # 项目文档
├── index.html                      # HTML 入口 + SEO meta
├── package.json
├── vite.config.ts                  # Vite 配置（图片代理）
├── tailwind.config.js              # Tailwind + Apple 设计系统
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── postcss.config.js
├── eslint.config.js
├── .env.example                    # 环境变量模板
└── .gitignore
```

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env`，填入真实值：

```bash
cp .env.example .env
```

```env
# AI 创作工坊（可选，不配则工坊不可用）
VITE_LLM_API_BASE_URL=https://api.example.com/v1
VITE_LLM_API_KEY=sk-your-key
VITE_LLM_MODEL=gpt-4o
VITE_SUPABASE_ANON_KEY=ey-xxxx  你的数据库公钥
VITE_SUPABASE_URL=https://xxxxx.supabase.co 数据库地址
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

### 类型检查

```bash
npm run typecheck
```

## 📄 页面介绍

### 首页 (`/`)

- Hero 区域：展示个人定位和核心价值
- 机械 vs 代码：视觉化展示转型背景
- 设计思维五步法：同理心 → 定义 → 构思 → 原型 → 测试
- 开发工具链：从想法到上线的完整工作流
- 工程思维一致性：核心理念阐述

### 作品集 (`/portfolio`)

- **机械设计作品**
  - 机创大赛 - 仿生机械蝎子（全国二等奖）
  - 深圳科技专项 - 新冠检测设备
  - 优秀毕设 - 无人车机一体化系统
- **软件开发作品**
  - Unilumin 官网会员中心（React + Supabase）
  - Unilumin Smart 智能工具平台（Python + Flask + FastAPI）

### 进化之路 (`/timeline`)

时间线形式展示从机械设计到全栈开发的转型历程

### 技术实验室 (`/lab`)

技术教程和文章分享

### 电子宠物 🐾 (`/pet`)

像素风虚拟宠物养成系统，拥有完整的游戏循环和 AI 创作能力。

#### 宠物属性系统

| 属性      | 说明                         |
| --------- | ---------------------------- |
| 🍖 饥饿度 | 随时间递减，通过厨房喂食恢复 |
| 😊 心情   | 受互动和游戏影响             |
| ⚡ 体力   | 游戏消耗，睡觉恢复           |
| 🧼 卫生   | 随时间递减，浴室洗澡恢复     |
| 💤 睡眠   | 在卧室关灯入睡               |

#### 六大房间

| 房间        | 交互                        |
| ----------- | --------------------------- |
| 🛋️ 起居室 | 点击地板引导宠物走动        |
| 🍳 厨房     | 打开冰箱选食物拖拽喂食      |
| 🚿 浴室     | 点击花洒洗澡                |
| 🌙 卧室     | 点击小黄鸭台灯关灯睡觉      |
| 🎮 游乐场   | 接星星小游戏                |
| 🎨 创作工坊 | AI 生成自定义角色/场景/道具 |

#### 角色模板系统

内置 6 种像素风动画模板：cat / robot / slime / bunny / bird / bear，每种都有完整的状态动画（呼吸、走路、弹跳、睡觉、眩晕）。

#### AI 创作工坊

集成 OpenAI 兼容 API（流式 SSE），支持 4 种创作模式：

| 模式 | 输出                           |
| ---- | ------------------------------ |
| 角色 | JSON 配置 → 选模板 + 定颜色   |
| 场景 | 像素风 SVG 房间背景 (800×450) |
| 道具 | 像素风 SVG 小物件 (32×32)     |
| 合成 | 将画廊素材多层叠图 + CSS 动效  |

创作成果存储在浏览器 localStorage，支持下载为 SVG / PNG / WebP。

### 圣诞树 🎄 (`/christmas`)

一个交互式的 3D 圣诞树体验，支持手势识别、内容编辑和多种控制方式。

#### 控制方式

**1. 形态控制**

- **展开/星尘**：将树展开为星尘粒子状态
- **折叠/成树**：将树折叠为传统圣诞树形态
- **旋转速度**：通过滑块调节树的旋转速度（0-2）

**2. 视角切换**

- **手动**：自由拖拽旋转视角
- **正面**：自动切换到正面视角
- **俯视**：从上方俯视
- **仰视**：从下方仰视
- **远景**：拉远视角
- **近景**：拉近视角

**3. 自动演示**

- **播放图片**：自动旋转并切换展示照片
- **显示/隐藏标题**：控制标题和副标题的显示

**4. 视觉识别**（需浏览器授权摄像头）

- **开启视觉识别**：使用 MediaPipe 进行手势识别
- **单指指向**：暂停树的旋转并对准目标
- **指向照片停留 1 秒**：打开照片查看大图
- **打开 2 秒后**：自动关闭照片
- **冷却 3 秒**：需要移开手指再触发

**5. 内容编辑**

- **主标题**：自定义主标题文字
- **副标题**：分别为"成树态"和"星尘态"设置副标题
- **图片编辑**：上传最多 5 张图片，每张可设置标题
- **恢复默认**：一键恢复所有默认内容

**6. 交互操作**

- **鼠标/触摸拖拽**：旋转 3D 场景
- **滚轮/双指缩放**：缩放视角
- **点击照片**：查看大图
- **全屏模式**：点击右上角按钮进入全屏（ESC 退出）

**技术特性**

- 基于 Three.js 的 3D 渲染
- MediaPipe 手势识别（懒加载，首次开启时加载）
- 图片自动压缩和缓存（使用 sessionStorage）
- 响应式设计，支持桌面端和移动端

## 🔗 相关链接

- 🌐 网站: [zlcggb.com](https://zlcggb.com)
- 📧 邮箱: u0015098@unilumin.com
- 🎬 B站: [永不言败ggb](https://b23.tv/xJIdoxY)
- 💻 GitHub: [zlcggb](https://github.com/zlcggb)

## 📝 开发工具链

| 阶段     | 工具                                                    |
| -------- | ------------------------------------------------------- |
| 构建思路 | [Gemini](https://gemini.google.com/)                       |
| 网站设计 | [Bolt](https://bolt.new/)                                  |
| 代码编辑 | [Cursor](https://www.cursor.com/) / [Kiro](https://kiro.dev/) |
| 数据库   | [Supabase](https://supabase.com/)                          |
| 存储库   | [Cloudflare](https://cloudflare.com/)                      |
| 代码存储 | [GitHub](https://github.com/)                              |
| 网站部署 | [Netlify](https://app.netlify.com/)                        |
| 服务器   | [阿里云](https://www.aliyun.com/)                          |

## 🙏 致谢

### 圣诞树项目参考

本项目中的圣诞树功能参考了以下优秀的开源项目，在此表示感谢：

- **[yftan/christmas-tree](https://github.com/yftan/christmas-tree)** - 提供了 3D 圣诞树的核心实现思路和粒子系统设计
- **[echoezy9527/christmas-tree-generated-by-gemini-3](https://github.com/echoezy9527/christmas-tree-generated-by-gemini-3)** - 提供了手势识别集成和交互设计的参考

感谢这些项目的作者和贡献者们，他们的工作为本项目提供了宝贵的灵感和技术参考。

## 📜 License

MIT License © 2025 zlcggb
