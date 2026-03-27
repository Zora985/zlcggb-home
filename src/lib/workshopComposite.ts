import { isProbablySafeSvg } from './creatorStore';

export type CompositeLayerProps = {
  name: string;
  svg: string;
};

export type BuildCompositeInput = {
  sceneSvg: string;
  characterSvg: string;
  props: CompositeLayerProps[];
};

const FALLBACK_VIEW_BOX = '0 0 800 450';

/** 从根 <svg> 解析 viewBox，失败则用 800×450 */
export function parseRootViewBox(svg: string): string {
  const vb = /viewBox\s*=\s*["']([^"']+)["']/i.exec(svg);
  if (vb) return vb[1].replace(/\s+/g, ' ').trim();
  const w = /width\s*=\s*["']([\d.]+)/i.exec(svg);
  const h = /height\s*=\s*["']([\d.]+)/i.exec(svg);
  if (w && h) return `0 0 ${w[1]} ${h[1]}`;
  return FALLBACK_VIEW_BOX;
}

/** 取 <svg …> 与 </svg> 之间的内部标记（不校验嵌套 svg） */
export function extractSvgInnerMarkup(svg: string): string {
  const s = svg.trim();
  const open = /<svg\b[^>]*>/i.exec(s);
  if (!open) return '';
  const start = open.index + open[0].length;
  const end = s.lastIndexOf('</svg>');
  if (end === -1 || end <= start) return '';
  return s.slice(start, end).trim();
}

/** 去掉 defs/style，避免与主文档冲突；场景层保留原样（可能含渐变） */
export function stripDefsAndStyle(inner: string): string {
  return inner
    .replace(/<defs\b[\s\S]*?<\/defs>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '');
}

function parseViewBoxNumbers(vb: string): { w: number; h: number; minX: number; minY: number } {
  const p = vb.trim().split(/\s+/).map(Number);
  if (p.length === 4 && p.every((n) => Number.isFinite(n))) {
    return { minX: p[0], minY: p[1], w: p[2], h: p[3] };
  }
  return { minX: 0, minY: 0, w: 800, h: 450 };
}

/**
 * 将画廊中的场景（整图背景）、角色、道具在浏览器内叠加为单张 SVG。
 * 背景不重绘、不经过大模型，避免截断与 token 限制。
 */
export function buildLayeredWorkshopComposite(input: BuildCompositeInput): string | null {
  const { sceneSvg, characterSvg, props } = input;
  if (!isProbablySafeSvg(sceneSvg) || !isProbablySafeSvg(characterSvg)) return null;
  for (const p of props) {
    if (!isProbablySafeSvg(p.svg)) return null;
  }

  const masterVb = parseRootViewBox(sceneSvg);
  const { w: sceneW, h: sceneH } = parseViewBoxNumbers(masterVb);
  const groundY = sceneH * 0.78;
  const centerX = sceneW * 0.5;

  const sceneInner = extractSvgInnerMarkup(sceneSvg);
  const charInner = stripDefsAndStyle(extractSvgInnerMarkup(characterSvg));

  const scaleChar = Math.min(6, Math.max(4, sceneW / 140));
  const scaleProp = Math.min(4.5, Math.max(2.8, sceneW / 200));

  const propFragments = props.map((p, i) => {
    const inner = stripDefsAndStyle(extractSvgInnerMarkup(p.svg));
    const spread = 70;
    const ox = centerX + spread * (i - (props.length - 1) / 2) + 40;
    const oy = groundY - 6;
    return `<g id="ws-prop-${i}" aria-label="${escapeAttr(p.name)}">
      <g class="ws-anim-prop">
        <g transform="translate(${ox},${oy}) scale(${scaleProp}) translate(-16,-16)">${inner}</g>
      </g>
    </g>`;
  });

  const charFragment = `<g id="ws-character" aria-label="character">
    <g class="ws-anim-char">
      <g transform="translate(${centerX},${groundY}) scale(${scaleChar}) translate(-7.5,-14)">${charInner}</g>
    </g>
  </g>`;

  const style = `<style type="text/css"><![CDATA[
    .ws-anim-char { transform-box: fill-box; transform-origin: 50% 90%; }
    @keyframes ws-kf-char {
      0%, 100% { transform: translate(0, 0) scale(1, 1); }
      50% { transform: translate(0, -3px) scale(1, 1.04); }
    }
    .ws-anim-char { animation: ws-kf-char 2.8s ease-in-out infinite; }
    @keyframes ws-kf-prop {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    .ws-anim-prop { animation: ws-kf-prop 2.2s ease-in-out infinite; }
  ]]></style>`;

  const composed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${masterVb}" width="${sceneW}" height="${sceneH}" preserveAspectRatio="xMidYMid meet" overflow="visible" shape-rendering="crispEdges">
  <title>工坊本地合成</title>
  <defs>${style}</defs>
  <g id="ws-layer-scene" shape-rendering="crispEdges">${sceneInner}</g>
  ${charFragment}
  ${propFragments.join('\n  ')}
</svg>`.trim();

  if (!isProbablySafeSvg(composed)) return null;
  return composed;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
