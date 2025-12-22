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

## 🛠️ 技术栈

### 前端
- **React 18** - 用户界面构建
- **TypeScript** - 类型安全
- **Tailwind CSS** - 原子化 CSS 框架
- **Lucide React** - 图标库
- **Vite** - 构建工具

### 部署
- **Netlify** - 网站托管
- **阿里云** - 域名服务

## 📁 项目结构

```
zlcggb-home/
├── public/
│   ├── favicon.svg          # 网站图标
│   ├── models/              # MediaPipe 手势识别模型
│   │   └── gesture_recognizer.task
│   └── wasm/                # WebAssembly 文件
│       ├── vision_wasm_internal.js
│       └── vision_wasm_internal.wasm
├── src/
│   ├── components/
│   │   ├── HomePage.tsx     # 首页
│   │   ├── PortfolioPage.tsx # 作品集
│   │   ├── TimelinePage.tsx  # 进化之路
│   │   ├── LabPage.tsx       # 技术实验室
│   │   ├── ChristmasPage.tsx # 圣诞树页面
│   │   ├── Layout.tsx        # 布局组件
│   │   └── christmas/        # 圣诞树组件模块
│   │       ├── ControlPanel.tsx    # 控制面板
│   │       ├── CrystalOrnaments.tsx # 水晶装饰
│   │       ├── defaultContent.ts   # 默认内容配置
│   │       ├── Experience.tsx      # 3D 场景体验
│   │       ├── GestureInput.tsx    # 手势识别输入
│   │       ├── TechEffects.tsx     # 科技特效
│   │       ├── TreeSystem.tsx      # 树系统核心
│   │       └── types.ts            # 类型定义
│   ├── App.tsx              # 应用入口
│   ├── main.tsx             # 主入口
│   └── index.css            # 全局样式
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🚀 快速开始

### 安装依赖

```bash
npm install
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

## 📄 页面介绍

### 首页
- Hero 区域：展示个人定位和核心价值
- 机械 vs 代码：视觉化展示转型背景
- 设计思维五步法：同理心 → 定义 → 构思 → 原型 → 测试
- 开发工具链：从想法到上线的完整工作流
- 工程思维一致性：核心理念阐述

### 作品集
- **机械设计作品**
  - 机创大赛 - 仿生机械蝎子（全国二等奖）
  - 深圳科技专项 - 新冠检测设备
  - 优秀毕设 - 无人车机一体化系统
- **软件开发作品**
  - Unilumin 官网会员中心（React + Supabase）
  - Unilumin Smart 智能工具平台（Python + Flask + FastAPI）

### 进化之路
时间线形式展示从机械设计到全栈开发的转型历程

### 技术实验室
技术教程和文章分享

### 圣诞树 🎄
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

| 阶段 | 工具 |
|------|------|
| 构建思路 | [Gemini](https://gemini.google.com/) |
| 网站设计 | [Bolt](https://bolt.new/) |
| 代码编辑 | [Cursor](https://www.cursor.com/) / [Kiro](https://kiro.dev/) |
| 数据库 | [Supabase](https://supabase.com/) |
| 存储库 | [Cloudflare](https://cloudflare.com/) |
| 代码存储 | [GitHub](https://github.com/) |
| 网站部署 | [Netlify](https://app.netlify.com/) |
| 服务器 | [阿里云](https://www.aliyun.com/) |

## 🙏 致谢

### 圣诞树项目参考

本项目中的圣诞树功能参考了以下优秀的开源项目，在此表示感谢：

- **[yftan/christmas-tree](https://github.com/yftan/christmas-tree)** - 提供了 3D 圣诞树的核心实现思路和粒子系统设计
- **[echoezy9527/christmas-tree-generated-by-gemini-3](https://github.com/echoezy9527/christmas-tree-generated-by-gemini-3)** - 提供了手势识别集成和交互设计的参考

感谢这些项目的作者和贡献者们，他们的工作为本项目提供了宝贵的灵感和技术参考。

## 📜 License

MIT License © 2025 zlcggb
