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
      return `你是像素宠物游戏的角色美术生成器。${COMMON_RULES}

【角色】必须严格遵守：
- 根元素：<svg xmlns="http://www.w3.org/2000/svg" viewBox="-15 -25 45 45" width="500" height="500" overflow="visible">
- 角色身体主体宽度约 12–16 单位，脚底大致落在 y=13–16，水平居中对齐 x≈7.5（与现有螃蟹 Clawd 同比例，便于与食物/家具比例一致）
- 在 <defs><style> 内写 CSS：至少包含轻微呼吸/待机动画（transform 或 translate），可选眨眼（scaleY）
- 可加简单地面椭圆阴影（半透明 black rect 或 ellipse），随角色一起动或单独轻微动画
- 不要生成文字、水印、emoji
`;

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
      return `你是像素宠物工坊的「补充说明」助手。重要：本应用已支持在客户端把画廊里的「场景 + 角色 + 道具」无损叠图并加 CSS 动效，**不会截断 SVG**。若用户粘贴的【场景】等片段明显以 “截断” 或省略号结尾，请用一两句中文明确建议他改用界面上的「生成本地合成预览」，不要强行重画整块背景。

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
      return '请根据以下描述生成像素风宠物角色 SVG：\n';
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

