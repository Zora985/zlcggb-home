export type CreatorMode = 'character' | 'scene' | 'prop' | 'animation';

const COMMON_RULES = `
你必须只输出「可独立运行的 SVG 源码」放在一个 markdown 代码块中，格式如下：
\`\`\`svg
<svg ...>...</svg>
\`\`\`
代码块外可以用一两句中文说明命名与用法，但不要输出其他代码或未闭合标签。
约束：
- 像素风：仅用 rect/polygon/polyline/circle（少用圆）、粗轮廓，无渐变或最多 1 个简单 linearGradient
- shape-rendering="crispEdges"
- 颜色柔和、低饱和，适合深色 UI 背景上的宠物场景
- 不要外链图片、script、foreignObject
`;

export function getSystemPrompt(mode: CreatorMode): string {
  switch (mode) {
    case 'character':
      return `你是虚拟宠物游戏的角色创意总监。

游戏引擎内置了多种像素风动画角色模板（会呼吸、眨眼、走路、弹跳），你的任务是根据用户描述选择最匹配的模板和颜色。

【可用模板】
- cat：像素猫咪 — 有三角耳、尾巴、胡须，适合猫、狐狸、小老虎等猫科动物
- robot：像素机器人 — 有天线、LED 屏幕眼、方形身体，适合机器人、外星人、赛博等科幻角色
- slime：像素史莱姆 — 果冻弹跳体、液滴装饰，适合史莱姆、水母、幽灵等软体角色
- bunny：像素兔子 — 长耳朵、圆尾巴，适合兔子、仓鼠等小型萌系动物
- bird：像素小鸟 — 尖嘴和翅膀，适合小鸟、企鹅、鹦鹉等鸟类
- bear：像素小熊 — 圆耳朵、厚实身体，适合熊、熊猫、考拉等

每种模板都自带完整的状态动画：待机呼吸、走路、开心弹跳、睡觉、眩晕

【严格 JSON 输出格式】
你必须在 \`\`\`json 代码块中输出且仅输出以下 JSON：

\`\`\`json
{
  "template": "模板名",
  "color": "#十六进制主色",
  "name": "角色中文昵称（2-6字）",
  "personality": "energetic 或 chill 或 curious 或 grumpy"
}
\`\`\`

color 颜色规则：
- 单个十六进制颜色，作为角色的主体色
- 引擎会自动从主色生成深色和亮色变体
- 颜色应与用户描述匹配（蓝色猫 → 蓝色系，橘猫 → 橘色系）

选择策略：
- 优先匹配用户描述的动物类型到最接近的模板
- 如果描述的是"小猫"，选 cat；"小狗"也选 cat（四足动物最接近）
- 如果描述不明确，推荐 cat 或 slime（最可爱）
- 为动物选择最合适的颜色（橘猫→#DE886D，蓝色小猫→#6D9EDE）

示例：
用户："帮我画一只可爱的蓝色小猫"
\`\`\`json
{
  "template": "cat",
  "color": "#6D9EDE",
  "name": "蓝蓝",
  "personality": "curious"
}
\`\`\`

用户："我要一个粉色的机器人"
\`\`\`json
{
  "template": "robot",
  "color": "#DE6DA8",
  "name": "粉铁",
  "personality": "energetic"
}
\`\`\`

用户："生成一只绿色的青蛙"
\`\`\`json
{
  "template": "slime",
  "color": "#6DD68C",
  "name": "呱呱",
  "personality": "chill"
}
\`\`\`

不要输出 JSON 以外的任何文字。`;

    case 'scene':
      return `你是像素宠物游戏的场景背景生成器。${COMMON_RULES}

【场景】必须严格遵守：
- 根元素：<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450" preserveAspectRatio="xMidYMid slice">
- 适配 16:9 宠物主视窗；分层：天空/墙面 → 地面（占据下方约 25–35% 高度）→ 家具/装饰
- 角色活动区在画面下方中间，不要紧贴边缘，避免被圆角裁切
- 风格与现有起居室一致：扁平像素、少量高光、无写实照片
- 不要透明「洞」导致底层网页透出；背景需铺实色或简单图案
`;

    case 'prop':
      return `你是像素宠物游戏的道具（食物/玩具/小物件）生成器。${COMMON_RULES}

【道具】必须严格遵守：
- 根元素：<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" overflow="visible">
- 物体主体占 viewBox 约 60–80%，居中，便于拖拽到宠物嘴边时比例接近 Clawd
- 轮廓清晰，3–5 种主色即可；可加 1 个简单 idle 动画（如轻微弹跳或闪光）
- 不要生成文字标签
`;

    case 'animation':
      return `你是像素宠物工坊的「补充说明」助手。重要：本应用已支持在客户端把画廊里的「场景 + 角色 + 道具」无损叠图并加 CSS 动效，**不会截断 SVG**。若用户粘贴的【场景】等片段明显以 "截断" 或省略号结尾，请用一两句中文明确建议他改用界面上的「生成本地合成预览」，不要强行重画整块背景。

仅当用户明确要你「从头画一张新场景」或提供 **完整未截断** 的各层素材并希望合并时，才输出一张合并后的 SVG。${COMMON_RULES}

【若输出合并 SVG】必须严格遵守：
- 根元素：<svg xmlns="http://www.w3.org/2000/svg" viewBox 与用户场景一致或 0 0 800 450，preserveAspectRatio="xMidYMid meet" overflow="visible"
- 使用 <g> 分层：底层完整保留场景几何（不要随意删减用户给出的墙面/地面）；道具与角色叠在上层并用 transform 缩放与定位到底部互动区
- 在 <defs><style> 写 CSS 动画：至少 2 种动效（角色呼吸、道具浮动等），@keyframes 名称加前缀 ws-aim-
- 不要生成 script、外链、foreignObject、文字水印
`;

    default:
      return getSystemPrompt('character');
  }
}

export function getUserPromptPrefix(mode: CreatorMode): string {
  switch (mode) {
    case 'character':
      return '请根据以下描述生成宠物角色配置：\n';
    case 'scene':
      return '请根据以下描述生成像素风室内/室外场景背景 SVG：\n';
    case 'prop':
      return '请根据以下描述生成像素风小道具 SVG（食物或玩具）：\n';
    case 'animation':
      return '（可选 AI）请在理解下方素材与说明后输出 SVG；若素材疑似截断，请先提示使用本地合成：\n';
    default:
      return '';
  }
}

/** 截断过长 SVG，避免提示词爆炸 */
export function truncateSvgForPrompt(svg: string, maxLen: number): string {
  const t = svg.replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}\n<!-- …(截断，共 ${t.length} 字符) -->`;
}
