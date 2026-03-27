import React from 'react';

export type CharacterTemplate = 'cat' | 'robot' | 'slime';
export type CharacterAnimState = 'idle' | 'walking' | 'happy' | 'sleeping' | 'dizzy';

interface PixelCharacterProps {
  template: CharacterTemplate;
  state: CharacterAnimState;
  color: string;
  className?: string;
  style?: React.CSSProperties;
}

export function PixelCharacter({ template, state, color, className, style }: PixelCharacterProps) {
  switch (template) {
    case 'cat': return <CatSVG state={state} color={color} className={className} style={style} />;
    case 'robot': return <RobotSVG state={state} color={color} className={className} style={style} />;
    case 'slime': return <SlimeSVG state={state} color={color} className={className} style={style} />;
  }
}

type InnerProps = Omit<PixelCharacterProps, 'template'>;

// ============================================================
//  CAT — 像素猫
// ============================================================
function CatSVG({ state, color, className, style }: InnerProps) {
  const dark = darken(color, 30);
  const light = lighten(color, 40);
  const isHappy = state === 'happy';

  return (
    <svg viewBox="-12 -20 45 45" width="500" height="500" xmlns="http://www.w3.org/2000/svg"
      className={className} style={style} shapeRendering="crispEdges" overflow="visible">
      <defs>
        <style>{CAT_CSS}{SPARKLE_GLOBAL_CSS}</style>
        <PixelSparkleDef id="cat-sp" />
      </defs>

      {/* 地面阴影 — 在 bounce 组之外 */}
      <rect className={`cat-shadow ${isHappy ? 'cat-shadow-happy' : ''}`}
        x="4" y="16" width="12" height="1" fill="#000" opacity="0.4" />

      {/* 像素星光 — 在 bounce 组之外 */}
      {isHappy && (
        <g className="cat-sparkles">
          <use href="#cat-sp" x="-6" y="-6" fill="#FFD700" style={{ ['--sp-delay' as string]: '0s' }} />
          <use href="#cat-sp" x="24" y="-8" fill="#FFA000" style={{ ['--sp-delay' as string]: '0.3s' }} />
          <use href="#cat-sp" x="26" y="10" fill="#FFF59D" style={{ ['--sp-delay' as string]: '0.6s' }} />
          <use href="#cat-sp" x="-8" y="12" fill="#FFC107" style={{ ['--sp-delay' as string]: '0.9s' }} />
          <use href="#cat-sp" x="10" y="-14" fill="#FFF59D" style={{ ['--sp-delay' as string]: '1.2s' }} />
        </g>
      )}

      {/* 弹跳角色主体 */}
      <g className={`cat-body cat-${state}`}>
        <g className="cat-breathe">
          {/* 耳朵 */}
          <g className="cat-ears">
            <polygon points="3,-4 5,-4 4,-7" fill={color} />
            <polygon points="4,-3.5 4.5,-3.5 4,-6" fill={dark} />
            <polygon points="15,-4 17,-4 16,-7" fill={color} />
            <polygon points="16,-3.5 16.5,-3.5 16,-6" fill={dark} />
          </g>

          {/* 头 + 身体 */}
          <rect x="3" y="-4" width="14" height="8" fill={color} />
          <rect x="4" y="4" width="12" height="6" fill={color} />

          {/* 尾巴 */}
          <g className="cat-tail">
            <rect x="16" y="5" width="1" height="1" fill={color} />
            <rect x="17" y="4" width="1" height="1" fill={color} />
            <rect x="18" y="3" width="1" height="1" fill={color} />
            <rect x="18" y="2" width="1" height="1" fill={color} />
          </g>

          {/* 前腿（开心时踮脚） */}
          <g className="cat-legs-l">
            <rect x="5" y="10" width="2" height="4" fill={color} />
          </g>
          <g className="cat-legs-r">
            <rect x="13" y="10" width="2" height="4" fill={color} />
          </g>

          {/* 眼睛 */}
          <g className="cat-eyes">
            <g className="cat-blink">
              <rect x="5" y="-1" width="3" height="3" fill="#fff" />
              <rect x="6" y="-1" width="1" height="3" fill="#111" />
              <rect x="12" y="-1" width="3" height="3" fill="#fff" />
              <rect x="13" y="-1" width="1" height="3" fill="#111" />
            </g>
          </g>

          {/* 鼻子 + 嘴 */}
          <rect x="9" y="2" width="2" height="1" fill="#F9A8D4" />
          <rect x="8" y="3" width="1" height="1" fill={dark} opacity="0.4" />
          <rect x="11" y="3" width="1" height="1" fill={dark} opacity="0.4" />

          {/* 胡须 */}
          <rect x="1" y="-1" width="2" height="1" fill={light} opacity="0.6" />
          <rect x="1" y="1" width="2" height="1" fill={light} opacity="0.6" />
          <rect x="17" y="-1" width="2" height="1" fill={light} opacity="0.6" />
          <rect x="17" y="1" width="2" height="1" fill={light} opacity="0.6" />
        </g>
      </g>

      {state === 'sleeping' && <ZzzEffect x={16} y={-6} prefix="cat" />}
      {state === 'dizzy' && <StarsEffect cx={10} cy={-6} prefix="cat" />}
    </svg>
  );
}

const CAT_CSS = `
  /* === 通用 === */
  .cat-body { transform-origin: 10px 14px; }
  .cat-breathe { transform-origin: 10px 10px; animation: cat-br 3s infinite ease-in-out; }
  .cat-blink { transform-origin: 10px 0px; animation: cat-bl 4s infinite linear; }
  .cat-tail { transform-origin: 16px 5px; animation: cat-tw 2.5s infinite ease-in-out; }
  .cat-ears { animation: cat-ear 6s infinite ease-in-out; }
  .cat-shadow { transform-origin: 10px 16.5px; }

  /* === IDLE === */
  .cat-idle { animation: cat-idle 8s infinite ease-in-out; }

  /* === WALKING === */
  .cat-walking { animation: cat-walk-bob 0.4s infinite ease-in-out; }
  .cat-walking .cat-legs-l { transform-origin: 6px 10px; animation: cat-wl 0.4s infinite ease-in-out; }
  .cat-walking .cat-legs-r { transform-origin: 14px 10px; animation: cat-wr 0.4s infinite ease-in-out; }

  /* === HAPPY — 完整弹跳动画系统 === */
  .cat-happy { animation: cat-bounce 1s infinite ease-in-out; }
  .cat-happy .cat-tail { animation: cat-tw-fast 0.15s infinite alternate ease-in-out; }
  .cat-happy .cat-ears { animation: cat-ear-perk 0.15s infinite alternate ease-in-out; }
  .cat-happy .cat-blink { animation: cat-bl-happy 2s infinite linear; }
  .cat-shadow-happy { animation: cat-shd 1s infinite ease-in-out !important; }

  /* === SLEEPING === */
  .cat-sleeping { animation: cat-sleep 4s infinite ease-in-out; }
  .cat-sleeping .cat-blink { transform: scaleY(0.1); animation: none; }
  .cat-sleeping .cat-tail { animation: cat-tw 5s infinite ease-in-out; }

  /* === DIZZY === */
  .cat-dizzy { animation: cat-dizzy 1.5s infinite ease-in-out; }
  .cat-dizzy .cat-blink { animation: none; }

  /* --- Keyframes --- */
  @keyframes cat-br { 0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.97) translateY(0.5px)} }
  @keyframes cat-bl { 0%,42%,48%,90%,96%,100%{transform:scaleY(1)}45%,93%{transform:scaleY(0.1)} }
  @keyframes cat-bl-happy { 0%,46%,54%,100%{transform:scaleY(1)}50%{transform:scaleY(0.1)} }
  @keyframes cat-tw { 0%,100%{transform:rotate(0)}50%{transform:rotate(20deg)} }
  @keyframes cat-tw-fast { 0%{transform:rotate(30deg)}100%{transform:rotate(-30deg)} }
  @keyframes cat-ear { 0%,85%,100%{transform:translateY(0)}90%{transform:translateY(-0.5px)} }
  @keyframes cat-ear-perk { 0%{transform:translateY(0)}100%{transform:translateY(-1px)} }
  @keyframes cat-idle { 0%,30%,100%{transform:translate(0)}15%{transform:translate(0.5px,0)}50%{transform:translate(-0.5px,0)} }
  @keyframes cat-walk-bob { 0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)} }
  @keyframes cat-wl { 0%,100%{transform:rotate(0)}25%{transform:rotate(25deg)}75%{transform:rotate(-25deg)} }
  @keyframes cat-wr { 0%,100%{transform:rotate(0)}25%{transform:rotate(-25deg)}75%{transform:rotate(25deg)} }

  @keyframes cat-bounce {
    0%, 15%, 100% { transform: translateY(0) scaleY(1); }
    20%  { transform: translateY(0) scaleY(0.85); }
    40%  { transform: translateY(-10px) scaleY(1.05); }
    50%  { transform: translateY(-12px) scaleY(1); }
    60%  { transform: translateY(-10px) scaleY(1.05); }
    80%  { transform: translateY(0) scaleY(0.85); }
    85%  { transform: translateY(0) scaleY(1); }
  }

  @keyframes cat-shd {
    0%, 15%, 100% { transform: scaleX(1); opacity: 0.5; }
    20%  { transform: scaleX(1.1); opacity: 0.6; }
    40%  { transform: scaleX(0.6); opacity: 0.2; }
    50%  { transform: scaleX(0.5); opacity: 0.15; }
    60%  { transform: scaleX(0.6); opacity: 0.2; }
    80%  { transform: scaleX(1.1); opacity: 0.6; }
    85%  { transform: scaleX(1); opacity: 0.5; }
  }

  @keyframes cat-sleep { 0%,100%{transform:scaleY(1) scaleX(1)}50%{transform:scaleY(0.95) scaleX(1.02)} }
  @keyframes cat-dizzy { 0%,100%{transform:rotate(0) translate(0)}25%{transform:rotate(3deg) translate(1px,0)}75%{transform:rotate(-3deg) translate(-1px,0)} }

  /* Sparkle animations */
  .cat-sparkles use { --sp-delay: 0s; }
  .cat-sparkles .sp-center { opacity:0; animation: sp-fc 1.5s infinite step-end; animation-delay: var(--sp-delay); }
  .cat-sparkles .sp-outer  { opacity:0; animation: sp-fo 1.5s infinite step-end; animation-delay: var(--sp-delay); }
`;

// ============================================================
//  ROBOT — 像素机器人
// ============================================================
function RobotSVG({ state, color, className, style }: InnerProps) {
  const dark = darken(color, 35);
  const screen = darken(color, 50);
  const led = '#4FFFDF';
  const isHappy = state === 'happy';

  return (
    <svg viewBox="-17 -24 55 55" width="500" height="500" xmlns="http://www.w3.org/2000/svg"
      className={className} style={style} shapeRendering="crispEdges" overflow="visible">
      <defs>
        <style>{ROBOT_CSS}{SPARKLE_GLOBAL_CSS}</style>
        <PixelSparkleDef id="bot-sp" />
      </defs>

      {/* 阴影 */}
      <rect className={`bot-shadow ${isHappy ? 'bot-shadow-happy' : ''}`}
        x="4" y="17" width="12" height="1" fill="#000" opacity="0.4" />

      {/* 星光 */}
      {isHappy && (
        <g className="bot-sparkles">
          <use href="#bot-sp" x="-8" y="-4" fill="#4FFFDF" style={{ ['--sp-delay' as string]: '0s' }} />
          <use href="#bot-sp" x="28" y="-8" fill="#A7F3D0" style={{ ['--sp-delay' as string]: '0.25s' }} />
          <use href="#bot-sp" x="30" y="12" fill="#4FFFDF" style={{ ['--sp-delay' as string]: '0.5s' }} />
          <use href="#bot-sp" x="-10" y="14" fill="#6EE7B7" style={{ ['--sp-delay' as string]: '0.75s' }} />
          <use href="#bot-sp" x="10" y="-16" fill="#A7F3D0" style={{ ['--sp-delay' as string]: '1.0s' }} />
        </g>
      )}

      {/* 弹跳角色主体 */}
      <g className={`bot-body bot-${state}`}>
        <g className="bot-breathe">
          {/* 天线 */}
          <g className="bot-antenna">
            <rect x="9" y="-8" width="2" height="4" fill={dark} />
            <rect x="8" y="-10" width="4" height="3" rx="1" fill={led} opacity="0.9" />
          </g>

          {/* 头 */}
          <rect x="2" y="-4" width="16" height="9" fill={color} />
          <rect x="3" y="-3" width="14" height="7" fill={screen} />

          {/* LED 眼睛 */}
          <g className="bot-eyes">
            <g className="bot-blink">
              <rect x="5" y="-1" width="3" height="3" fill={led} />
              <rect x="12" y="-1" width="3" height="3" fill={led} />
            </g>
          </g>

          {/* 嘴 */}
          <g className="bot-mouth">
            <rect x="7" y="2" width="6" height="1" fill={led} opacity="0.6" />
          </g>

          {/* 身体 */}
          <rect x="3" y="6" width="14" height="6" fill={color} />

          {/* 指示灯 */}
          <rect x="9" y="7" width="2" height="1" fill="#EF4444" className="bot-led1" />
          <rect x="9" y="9" width="2" height="1" fill="#22C55E" className="bot-led2" />

          {/* 手臂 */}
          <g className="bot-arm-l">
            <rect x="-1" y="7" width="4" height="3" fill={dark} />
          </g>
          <g className="bot-arm-r">
            <rect x="17" y="7" width="4" height="3" fill={dark} />
          </g>

          {/* 腿 */}
          <g className="bot-leg-l">
            <rect x="4" y="12" width="4" height="4" fill={dark} />
            <rect x="3" y="16" width="6" height="1" fill={dark} />
          </g>
          <g className="bot-leg-r">
            <rect x="12" y="12" width="4" height="4" fill={dark} />
            <rect x="11" y="16" width="6" height="1" fill={dark} />
          </g>
        </g>
      </g>

      {state === 'sleeping' && (
        <>
          <ZzzEffect x={17} y={-8} prefix="bot" />
          <rect x="5" y="-1" width="3" height="3" fill={screen} />
          <rect x="12" y="-1" width="3" height="3" fill={screen} />
          <rect x="7" y="2" width="6" height="1" fill={screen} />
        </>
      )}
      {state === 'dizzy' && <StarsEffect cx={10} cy={-8} prefix="bot" />}
    </svg>
  );
}

const ROBOT_CSS = `
  /* === 通用 === */
  .bot-body { transform-origin: 10px 17px; }
  .bot-breathe { transform-origin: 10px 12px; animation: bot-br 4s infinite ease-in-out; }
  .bot-blink { transform-origin: 10px 0px; animation: bot-bl 5s infinite step-end; }
  .bot-antenna { transform-origin: 10px -6px; animation: bot-ant 3s infinite ease-in-out; }
  .bot-shadow { transform-origin: 10px 17.5px; }
  .bot-led1 { animation: bot-flash 1.5s infinite step-end; }
  .bot-led2 { animation: bot-flash 1.5s 0.75s infinite step-end; }
  .bot-mouth { animation: bot-talk 2s infinite step-end; }

  /* === IDLE === */
  .bot-idle { animation: bot-idle 6s infinite ease-in-out; }

  /* === WALKING === */
  .bot-walking { animation: bot-walk-bob 0.5s infinite ease-in-out; }
  .bot-walking .bot-leg-l { transform-origin: 6px 12px; animation: bot-wl 0.5s infinite ease-in-out; }
  .bot-walking .bot-leg-r { transform-origin: 14px 12px; animation: bot-wr 0.5s infinite ease-in-out; }
  .bot-walking .bot-arm-l { transform-origin: 2px 7px; animation: bot-al 0.5s infinite ease-in-out; }
  .bot-walking .bot-arm-r { transform-origin: 18px 7px; animation: bot-ar 0.5s infinite ease-in-out; }

  /* === HAPPY — 完整弹跳 + 手臂挥舞 + 天线旋转 + LED 闪烁 === */
  .bot-happy { animation: bot-bounce 1s infinite ease-in-out; }
  .bot-happy .bot-antenna { animation: bot-ant-spin 0.4s infinite linear; }
  .bot-happy .bot-arm-l { transform-origin: 2px 7px; animation: bot-wave-l 0.15s infinite alternate ease-in-out; }
  .bot-happy .bot-arm-r { transform-origin: 18px 7px; animation: bot-wave-r 0.15s infinite alternate ease-in-out; }
  .bot-happy .bot-blink { animation: bot-bl-happy 0.3s infinite step-end; }
  .bot-happy .bot-mouth { animation: bot-talk-fast 0.4s infinite step-end; }
  .bot-shadow-happy { animation: bot-shd 1s infinite ease-in-out !important; }

  /* === SLEEPING === */
  .bot-sleeping { animation: bot-sleep 5s infinite ease-in-out; }
  .bot-sleeping .bot-blink { animation: none; }
  .bot-sleeping .bot-mouth { animation: none; opacity: 0.2; }

  /* === DIZZY === */
  .bot-dizzy { animation: bot-dizzy 1.2s infinite ease-in-out; }

  /* --- Keyframes --- */
  @keyframes bot-br { 0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.98)} }
  @keyframes bot-bl { 0%,80%,88%,100%{transform:scaleY(1)}84%{transform:scaleY(0)} }
  @keyframes bot-bl-happy { 0%,50%{opacity:1}51%,100%{opacity:0.3} }
  @keyframes bot-ant { 0%,100%{transform:rotate(0)}50%{transform:rotate(8deg)} }
  @keyframes bot-ant-spin { 0%{transform:rotate(0)}100%{transform:rotate(360deg)} }
  @keyframes bot-flash { 0%,60%{opacity:1}61%,100%{opacity:0.2} }
  @keyframes bot-talk { 0%,40%{opacity:0.6}41%,70%{opacity:1}71%,100%{opacity:0.3} }
  @keyframes bot-talk-fast { 0%,50%{opacity:1}51%,100%{opacity:0.4} }
  @keyframes bot-idle { 0%,40%,100%{transform:translate(0)}20%{transform:translate(0,-0.5px)} }
  @keyframes bot-walk-bob { 0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)} }
  @keyframes bot-wl { 0%,100%{transform:rotate(0)}50%{transform:rotate(20deg)} }
  @keyframes bot-wr { 0%,100%{transform:rotate(0)}50%{transform:rotate(-20deg)} }
  @keyframes bot-al { 0%,100%{transform:rotate(0)}50%{transform:rotate(-15deg)} }
  @keyframes bot-ar { 0%,100%{transform:rotate(0)}50%{transform:rotate(15deg)} }
  @keyframes bot-wave-l { 0%{transform:rotate(45deg)}100%{transform:rotate(85deg)} }
  @keyframes bot-wave-r { 0%{transform:rotate(-45deg)}100%{transform:rotate(-85deg)} }

  @keyframes bot-bounce {
    0%, 15%, 100% { transform: translateY(0) scaleY(1); }
    20%  { transform: translateY(0) scaleY(0.85); }
    40%  { transform: translateY(-10px) scaleY(1.05); }
    50%  { transform: translateY(-12px) scaleY(1); }
    60%  { transform: translateY(-10px) scaleY(1.05); }
    80%  { transform: translateY(0) scaleY(0.85); }
    85%  { transform: translateY(0) scaleY(1); }
  }

  @keyframes bot-shd {
    0%, 15%, 100% { transform: scaleX(1); opacity: 0.5; }
    20%  { transform: scaleX(1.1); opacity: 0.6; }
    40%  { transform: scaleX(0.6); opacity: 0.2; }
    50%  { transform: scaleX(0.5); opacity: 0.15; }
    60%  { transform: scaleX(0.6); opacity: 0.2; }
    80%  { transform: scaleX(1.1); opacity: 0.6; }
    85%  { transform: scaleX(1); opacity: 0.5; }
  }

  @keyframes bot-sleep { 0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.97)} }
  @keyframes bot-dizzy { 0%,100%{transform:rotate(0)}25%{transform:rotate(5deg)}75%{transform:rotate(-5deg)} }

  /* Sparkle */
  .bot-sparkles use { --sp-delay: 0s; }
  .bot-sparkles .sp-center { opacity:0; animation: sp-fc 1.5s infinite step-end; animation-delay: var(--sp-delay); }
  .bot-sparkles .sp-outer  { opacity:0; animation: sp-fo 1.5s infinite step-end; animation-delay: var(--sp-delay); }
`;

// ============================================================
//  SLIME — 像素史莱姆
// ============================================================
function SlimeSVG({ state, color, className, style }: InnerProps) {
  const dark = darken(color, 20);
  const darker = darken(color, 40);
  const isHappy = state === 'happy';

  return (
    <svg viewBox="-12 -16 45 45" width="500" height="500" xmlns="http://www.w3.org/2000/svg"
      className={className} style={style} shapeRendering="crispEdges" overflow="visible">
      <defs>
        <style>{SLIME_CSS}{SPARKLE_GLOBAL_CSS}</style>
        <PixelSparkleDef id="slm-sp" />
      </defs>

      {/* 阴影 */}
      <rect className={`slm-shadow ${isHappy ? 'slm-shadow-happy' : ''}`}
        x="3" y="14" width="14" height="1" fill="#000" opacity="0.35" />

      {/* 星光 */}
      {isHappy && (
        <g className="slm-sparkles">
          <use href="#slm-sp" x="-6" y="-2" fill="#86EFAC" style={{ ['--sp-delay' as string]: '0s' }} />
          <use href="#slm-sp" x="24" y="-4" fill="#4ADE80" style={{ ['--sp-delay' as string]: '0.25s' }} />
          <use href="#slm-sp" x="26" y="10" fill="#86EFAC" style={{ ['--sp-delay' as string]: '0.5s' }} />
          <use href="#slm-sp" x="-8" y="12" fill="#BBF7D0" style={{ ['--sp-delay' as string]: '0.75s' }} />
          <use href="#slm-sp" x="10" y="-10" fill="#4ADE80" style={{ ['--sp-delay' as string]: '1.0s' }} />
        </g>
      )}

      {/* 弹跳角色主体 */}
      <g className={`slm-body slm-${state}`}>
        <g className="slm-breathe">
          {/* 身体 */}
          <rect x="6" y="0" width="8" height="2" fill={color} />
          <rect x="4" y="2" width="12" height="2" fill={color} />
          <rect x="3" y="4" width="14" height="4" fill={color} />
          <rect x="3" y="8" width="14" height="3" fill={dark} />
          <rect x="4" y="11" width="12" height="2" fill={dark} />
          <rect x="6" y="13" width="8" height="1" fill={darker} />

          {/* 高光 */}
          <rect x="6" y="1" width="3" height="1" fill="#fff" opacity="0.3" />
          <rect x="5" y="3" width="2" height="1" fill="#fff" opacity="0.2" />

          {/* 眼睛 */}
          <g className="slm-eyes">
            <g className="slm-blink">
              <rect x="5" y="5" width="3" height="3" fill="#fff" />
              <rect x="6" y="6" width="2" height="2" fill="#111" />
              <rect x="12" y="5" width="3" height="3" fill="#fff" />
              <rect x="13" y="6" width="2" height="2" fill="#111" />
            </g>
          </g>

          {/* 嘴 */}
          <g className="slm-mouth">
            <rect x="8" y="10" width="4" height="1" fill={darker} />
          </g>

          {/* 液滴装饰 */}
          <g className="slm-drip">
            <rect x="2" y="7" width="1" height="2" fill={dark} />
            <rect x="2" y="9" width="1" height="1" fill={dark} opacity="0.5" />
          </g>
        </g>
      </g>

      {state === 'sleeping' && <ZzzEffect x={16} y={0} prefix="slm" />}
      {state === 'dizzy' && <StarsEffect cx={10} cy={-1} prefix="slm" />}
    </svg>
  );
}

const SLIME_CSS = `
  /* === 通用 === */
  .slm-body { transform-origin: 10px 14px; }
  .slm-breathe { transform-origin: 10px 13px; animation: slm-br 2.5s infinite ease-in-out; }
  .slm-blink { transform-origin: 10px 6px; animation: slm-bl 3.5s infinite linear; }
  .slm-drip { animation: slm-dr 4s infinite ease-in-out; }
  .slm-shadow { transform-origin: 10px 14.5px; }

  /* === IDLE === */
  .slm-idle { animation: slm-idle 5s infinite ease-in-out; }

  /* === WALKING === */
  .slm-walking { animation: slm-walk 0.6s infinite ease-in-out; }
  .slm-walking .slm-breathe { animation: slm-walk-sq 0.6s infinite ease-in-out; }

  /* === HAPPY — 柔软果冻弹跳 === */
  .slm-happy { animation: slm-bounce 1.2s infinite ease-in-out; }
  .slm-happy .slm-breathe { animation: slm-jig 0.5s infinite ease-in-out; }
  .slm-happy .slm-blink { animation: slm-bl-happy 2s infinite linear; }
  .slm-happy .slm-drip { animation: slm-dr-fast 0.6s infinite ease-in-out; }
  .slm-shadow-happy { animation: slm-shd 1.2s infinite ease-in-out !important; }

  /* === SLEEPING === */
  .slm-sleeping { animation: slm-sleep 4s infinite ease-in-out; }
  .slm-sleeping .slm-blink { transform: scaleY(0.1); animation: none; }

  /* === DIZZY === */
  .slm-dizzy { animation: slm-dizzy 1.5s infinite ease-in-out; }

  /* --- Keyframes --- */
  @keyframes slm-br { 0%,100%{transform:scaleX(1) scaleY(1)}50%{transform:scaleX(1.04) scaleY(0.96)} }
  @keyframes slm-bl { 0%,36%,42%,85%,91%,100%{transform:scaleY(1)}39%,88%{transform:scaleY(0.1)} }
  @keyframes slm-bl-happy { 0%,46%,54%,100%{transform:scaleY(1)}50%{transform:scaleY(0.1)} }
  @keyframes slm-dr { 0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(2px);opacity:0.3} }
  @keyframes slm-dr-fast { 0%,100%{transform:translateY(0);opacity:0.8}50%{transform:translateY(3px);opacity:0.2} }
  @keyframes slm-idle { 0%,100%{transform:translate(0)}30%{transform:translate(1px,0)}70%{transform:translate(-1px,0)} }
  @keyframes slm-walk { 0%{transform:scaleX(1) scaleY(1)}30%{transform:scaleX(0.85) scaleY(1.15)}60%{transform:scaleX(1.15) scaleY(0.85)}100%{transform:scaleX(1) scaleY(1)} }
  @keyframes slm-walk-sq { 0%,100%{transform:scaleX(1) scaleY(1)}50%{transform:scaleX(1.1) scaleY(0.9)} }
  @keyframes slm-jig { 0%,100%{transform:scaleX(1) scaleY(1)}50%{transform:scaleX(1.08) scaleY(0.92)} }

  @keyframes slm-bounce {
    0%, 10%, 100% { transform: translateY(0) scaleY(1) scaleX(1); }
    15%  { transform: translateY(0) scaleY(0.82) scaleX(1.12); }
    30%  { transform: translateY(-6px) scaleY(1.12) scaleX(0.90); }
    42%  { transform: translateY(-8px) scaleY(1.06) scaleX(0.95); }
    54%  { transform: translateY(-6px) scaleY(1.12) scaleX(0.90); }
    70%  { transform: translateY(0) scaleY(0.82) scaleX(1.12); }
    78%  { transform: translateY(0) scaleY(1.04) scaleX(0.98); }
    88%  { transform: translateY(0) scaleY(0.97) scaleX(1.02); }
  }

  @keyframes slm-shd {
    0%, 10%, 100% { transform: scaleX(1); opacity: 0.4; }
    15%  { transform: scaleX(1.15); opacity: 0.5; }
    30%  { transform: scaleX(0.6); opacity: 0.2; }
    42%  { transform: scaleX(0.5); opacity: 0.15; }
    54%  { transform: scaleX(0.6); opacity: 0.2; }
    70%  { transform: scaleX(1.15); opacity: 0.5; }
    78%  { transform: scaleX(1); opacity: 0.4; }
  }

  @keyframes slm-sleep { 0%,100%{transform:scaleX(1.05) scaleY(0.95)}50%{transform:scaleX(1) scaleY(1)} }
  @keyframes slm-dizzy { 0%,100%{transform:translate(0) rotate(0)}25%{transform:translate(2px,0) rotate(4deg)}75%{transform:translate(-2px,0) rotate(-4deg)} }

  /* Sparkle */
  .slm-sparkles use { --sp-delay: 0s; }
  .slm-sparkles .sp-center { opacity:0; animation: sp-fc 1.5s infinite step-end; animation-delay: var(--sp-delay); }
  .slm-sparkles .sp-outer  { opacity:0; animation: sp-fo 1.5s infinite step-end; animation-delay: var(--sp-delay); }
`;

// ============================================================
//  共享组件
// ============================================================

/** 像素十字星光 <defs> — 与 Clawd 原版 sparkle 相同的 2 帧像素闪烁 */
function PixelSparkleDef({ id }: { id: string }) {
  return (
    <g id={id}>
      <rect className="sp-center" x="-0.5" y="-0.5" width="1" height="1" />
      <g className="sp-outer">
        <rect x="-0.5" y="-1.5" width="1" height="1" />
        <rect x="-0.5" y="0.5" width="1" height="1" />
        <rect x="-1.5" y="-0.5" width="1" height="1" />
        <rect x="0.5" y="-0.5" width="1" height="1" />
      </g>
    </g>
  );
}

/** 全局 sparkle keyframes — 所有模板共用 */
const SPARKLE_GLOBAL_CSS = `
  @keyframes sp-fc {
    0%{opacity:0} 10%{opacity:1} 30%{opacity:0} 100%{opacity:0}
  }
  @keyframes sp-fo {
    0%{opacity:0} 20%{opacity:1} 40%{opacity:0} 100%{opacity:0}
  }
`;

function ZzzEffect({ x, y, prefix }: { x: number; y: number; prefix: string }) {
  return (
    <g>
      <style>{`
        .${prefix}-z1 { animation: ${prefix}-zzz 3s linear infinite; }
        .${prefix}-z2 { animation: ${prefix}-zzz 3s 1s linear infinite; }
        .${prefix}-z3 { animation: ${prefix}-zzz 3s 2s linear infinite; }
        @keyframes ${prefix}-zzz {
          0%{opacity:0;transform:translate(0,0) scale(0.5)}
          50%{opacity:1;transform:translate(4px,-8px) scale(1)}
          100%{opacity:0;transform:translate(8px,-16px) scale(1.3)}
        }
      `}</style>
      <text className={`${prefix}-z1`} x={x} y={y} fontSize="6" fill="#a78bfa" fontFamily="monospace" fontWeight="bold">Z</text>
      <text className={`${prefix}-z2`} x={x + 4} y={y - 4} fontSize="7" fill="#c4b5fd" fontFamily="monospace" fontWeight="bold">z</text>
      <text className={`${prefix}-z3`} x={x + 8} y={y - 8} fontSize="8" fill="#ddd6fe" fontFamily="monospace" fontWeight="bold">z</text>
    </g>
  );
}

function StarsEffect({ cx, cy, prefix }: { cx: number; cy: number; prefix: string }) {
  return (
    <g>
      <style>{`
        .${prefix}-star { animation: ${prefix}-orbit 2s linear infinite; }
        @keyframes ${prefix}-orbit {
          0%{transform:rotate(0deg) translate(8px,0) rotate(0deg)}
          100%{transform:rotate(360deg) translate(8px,0) rotate(-360deg)}
        }
      `}</style>
      <g style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <g className={`${prefix}-star`} style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <rect x={cx - 1} y={cy - 1} width="3" height="3" fill="#FDE047" />
        </g>
        <g className={`${prefix}-star`} style={{ transformOrigin: `${cx}px ${cy}px`, animationDelay: '0.66s' }}>
          <rect x={cx - 1} y={cy - 1} width="2" height="2" fill="#FDE047" />
        </g>
        <g className={`${prefix}-star`} style={{ transformOrigin: `${cx}px ${cy}px`, animationDelay: '1.33s' }}>
          <rect x={cx - 1} y={cy - 1} width="2" height="2" fill="#FDE047" />
        </g>
      </g>
    </g>
  );
}

// ============================================================
//  颜色工具
// ============================================================
function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  return rgbToHex(
    Math.max(0, rgb.r - amount),
    Math.max(0, rgb.g - amount),
    Math.max(0, rgb.b - amount),
  );
}

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  return rgbToHex(
    Math.min(255, rgb.r + amount),
    Math.min(255, rgb.g + amount),
    Math.min(255, rgb.b + amount),
  );
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
