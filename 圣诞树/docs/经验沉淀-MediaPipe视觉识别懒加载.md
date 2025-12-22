# 经验沉淀：MediaPipe 视觉识别模块在 Vite/React 中如何“按需加载”

## 目标
- **默认不加载**视觉识别相关代码、wasm、模型（避免首屏慢 / 体积大）
- 用户在控制面板点击“开启视觉识别”后，**才开始**：
  - 动态加载 `@mediapipe/tasks-vision` 代码
  - 请求摄像头权限
  - 加载 wasm 与手势模型

## 关键点 1：用 `React.lazy` 做组件级别代码分割
主页面（如 `src/components/ChristmasPage.tsx`）里：
- `const LazyGestureInput = React.lazy(() => import('./christmas/GestureInput'))`
- 仅当 `webcamEnabled === true` 才渲染它

这样视觉识别模块不会进入首屏 bundle，首次开启才下载对应 chunk。

## 关键点 2：在组件内部再动态 import（可选，但体验更稳）
在 `GestureInput.tsx` 内部：
- `await import('@mediapipe/tasks-vision')`

好处：
- 即使 `GestureInput` 的 chunk 很小，也能先渲染“加载中”提示，再加载更重的 vision 包。

## 关键点 3：wasm 与模型放在 Vite 的 `public/` 下
MediaPipe 运行时会通过 URL 拉取资源：
- wasm：`/wasm/vision_wasm_internal.js`、`/wasm/vision_wasm_internal.wasm`
- model：`/models/gesture_recognizer.task`

因此需要把子项目里的资源复制到主项目：
- `public/wasm/*`
- `public/models/gesture_recognizer.task`

并在代码中使用固定路径：
- `FilesetResolver.forVisionTasks('/wasm')`
- `modelAssetPath: '/models/gesture_recognizer.task'`

## 关键点 4：GPU 优先 + CPU 回退（本项目采用）
在纯 2D 场景里，GPU delegate 通常更快；但在 **three.js / R3F 同屏 WebGL** 场景里，MediaPipe GPU delegate 可能触发：
- WebGL context lost（three 的渲染上下文丢失）
- 画面黑屏/闪烁、需要恢复

综合权衡：
- **默认先尝试 `delegate: 'GPU'`**（满足性能诉求）
- 如果初始化失败，再 **自动回退 `delegate: 'CPU'`**

如果你在某些机器上遇到频繁 context lost，可考虑把“GPU/CPU”做成控制面板开关（或默认 CPU）。

## 关键点 5：卸载时必须释放资源
关闭视觉识别（组件卸载）时要做：
- `cancelAnimationFrame`
- `stream.getTracks().forEach(track.stop())`
- （可选）`recognizer.close?.()`

否则会出现摄像头占用不释放、性能持续消耗等问题。


