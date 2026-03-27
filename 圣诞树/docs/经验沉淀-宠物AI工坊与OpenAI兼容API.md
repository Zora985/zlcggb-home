# 经验沉淀：宠物 AI 工坊与 OpenAI 兼容 API

## 背景

在宠物页增加「工坊」房间，通过 OpenAI Chat Completions 兼容接口流式生成像素风 SVG（角色 / 场景 / 道具），并可保存到本地、将角色应用到 `PetEngine`。

## 配置

1. 复制项目根目录 `.env.example` 为 `.env`（`.env` 已在 `.gitignore` 中）
2. 填写 `VITE_LLM_API_BASE_URL`、`VITE_LLM_API_KEY`、`VITE_LLM_MODEL`
3. 重启 `vite` 开发服务器后生效

## 架构要点

- **前端直连**：使用 `import.meta.env.VITE_*`，密钥会进入前端 bundle，仅适合个人/内网；对外站点应改为服务端代理
- **流式**：`src/lib/aiClient.ts` 解析 `data: {...}\n\n` SSE，拼接 `choices[0].delta.content`
- **作品存储**：`localStorage` key `zlcggb-pet-creations-v1`，结构与 `CreationRecord` 一致
- **角色 ID**：`creator-{creationId}`，`getCharacter` 在 `src/components/pet/characters.ts` 中从 `creatorStore` 解析 `svgData`
- **渲染**：`PetEngine` 优先 `customSvgData` → `svgToDataUri` → `<img>`（与 Clawd 精灵图路径一致）
- **安全**：`isProbablySafeSvg` 拒绝 `<script>`、`javascript:` 等明显危险片段（不能替代 CSP）

## 标签暂存与历史

- **会话分标签**：`localStorage` key `zlcggb-workshop-session-v1`，按 `character | scene | prop | animation` 分别保存 `messages` + `inputDraft`。切换标签时先写入当前标签再读出目标标签，避免丢失。
- **防抖**：当前标签对话与输入变更约 400ms 后也会自动落盘。
- **历史快照**：key `zlcggb-workshop-history-v1`，用户点「存档到历史」保存当前对话；最多保留 40 条，可「恢复」替换当前界面（并切换到该条所属标签）。

## 合成动画

- 第四标签「合成动画」：`getSystemPrompt('animation')` 要求单一 800×450 SVG、分层 `<g>`、多段 `@keyframes`。
- 可从画廊选角色（单选）、场景（单选）、道具（多选≤8），「将选中素材填入输入框」会把截断后的 SVG 拼进用户消息（单段约 3500 字符防爆 token），用户可再补充说明后发送。

## 扩展

- 若 API 流格式非标准 SSE，需在 `aiClient.ts` 中适配
- 合成场景若要替换主游戏房间背景，可再增加 overlay 协议；当前合成结果与其他类型一样进画廊（`type: animation`）
