export type WindowTheme = 'night' | 'day' | 'sunset';

// 静态生成的随机数据，防止 React 重新渲染时画面抖动 (如星星瞬移)
const STARS = Array.from({ length: 40 }).map(() => ({
  x: Math.random() * 160,
  y: Math.random() * 150,
  r: 0.4 + Math.random() * 1.2,
  dur: 6 + Math.random() * 8, // 呼吸周期极度放缓 (6秒~14秒)
  del: Math.random() * 10
}));

const TREES = Array.from({ length: 8 }).map((_, i) => ({
  x1: i * 20 + 5,
  x2: i * 20 + 10,
  y2: 185 - Math.random() * 15,
  x3: i * 20 + 15
}));

interface WindowSceneriesProps {
  theme: WindowTheme;
}

export function WindowSceneries({ theme }: WindowSceneriesProps) {
  return (
    <svg width="160" height="200" viewBox="0 0 160 200" style={{ overflow: 'hidden' }}>
      <defs>
        {/* == 渐变定义 == */}
        {/* 白天天空 */}
        <linearGradient id="skyDay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
        {/* 黄昏天空 */}
        <linearGradient id="skySunset" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#581c87" />
          <stop offset="40%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>
        {/* 夜晚天空 */}
        <linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="60%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
        
        {/* 太阳/月亮光晕 */}
        <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="30%" stopColor="#fef08a" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sunsetGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
          <stop offset="20%" stopColor="#f97316" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#e2e8f0" stopOpacity="1" />
          <stop offset="40%" stopColor="#94a3b8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
        </radialGradient>

        <style>{`
          @keyframes float-cloud-fast { 0% { transform: translateX(-60px); } 100% { transform: translateX(180px); } }
          @keyframes float-cloud-slow { 0% { transform: translateX(-100px); } 100% { transform: translateX(200px); } }
          
          /* 星星闪烁非常缓慢且柔和，不要降到极低的透明度 */
          @keyframes star-twinkle { 0%, 100% { opacity: 0.5; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }
          
          /* 流星应该极快地划过，然后等待很长时间 */
          @keyframes shooting-star { 
            0% { transform: translate(180px, -20px); opacity: 1; } 
            5% { transform: translate(-20px, 180px); opacity: 0; } 
            100% { transform: translate(-20px, 180px); opacity: 0; } 
          }
          
          @keyframes bird-fly { 0% { transform: translate(-20px, 0) scale(0.8); } 50% { transform: translate(80px, -10px) scale(1); } 100% { transform: translate(180px, 0) scale(0.6); } }
          
          .cloud-f { animation: float-cloud-fast 18s linear infinite; }
          .cloud-s { animation: float-cloud-slow 35s linear infinite; }
          .star-t { animation: star-twinkle var(--dur) ease-in-out infinite var(--del); }
          .meteor { animation: shooting-star 12s linear infinite var(--del); }
          .bird { animation: bird-fly 15s linear infinite; }
        `}</style>
      </defs>

      {/* ================= 白天风景 ================= */}
      {theme === 'day' && (
        <g>
          <rect x="0" y="0" width="160" height="200" fill="url(#skyDay)" />
          {/* 光晕太阳 */}
          <circle cx="110" cy="50" r="40" fill="url(#sunGlow)" />
          <circle cx="110" cy="50" r="12" fill="#fff" />
          
          {/* 远处的鸟群 */}
          <g className="bird" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round">
            <path d="M0,50 Q4,46 8,50 Q12,46 16,50" />
            <path d="M10,60 Q13,57 16,60 Q19,57 22,60" transform="scale(0.8)" />
          </g>

          {/* 慢速云层 (远景) */}
          <g className="cloud-s" fill="#fff" opacity="0.6">
            <path d="M 0,80 Q 15,60 30,80 Q 40,75 50,80 Q 65,95 30,90 Z" />
            <path d="M -50,50 Q -30,35 -10,50 Q 5,45 15,55 Q -10,65 -50,50 Z" />
          </g>
          {/* 快速云层 (近景) */}
          <g className="cloud-f" fill="#fff" opacity="0.9">
             <path d="M 0,30 Q 10,15 25,30 Q 35,20 45,30 Q 55,25 60,35 Q 30,45 0,30 Z" />
             <path d="M -80,100 Q -60,80 -40,100 Q -30,90 -20,100 Q -10,110 -40,115 Z" />
          </g>

          {/* 远山 (蓝灰绿) */}
          <path d="M -20,180 Q 20,130 60,170 T 140,160 L 180,200 L -20,200 Z" fill="#94a3b8" opacity="0.5" />
          <path d="M -10,200 Q 30,160 80,180 T 180,160 L 180,200 Z" fill="#64748b" opacity="0.6" />
          
          {/* 近山与森林边缘 */}
          <path d="M -20,200 Q 40,170 100,200 Z" fill="#15803d" />
          <path d="M 60,200 Q 120,180 180,200 Z" fill="#166534" />
        </g>
      )}

      {/* ================= 黄昏风景 ================= */}
      {theme === 'sunset' && (
        <g>
          <rect x="0" y="0" width="160" height="200" fill="url(#skySunset)" />
          
          {/* 巨大的夕阳与落日晕 */}
          <circle cx="80" cy="130" r="60" fill="url(#sunsetGlow)" />
          <circle cx="80" cy="130" r="25" fill="#fef08a" />
          {/* 水平条纹切割夕阳 (典型复古波普风格) */}
          <rect x="50" y="135" width="60" height="2" fill="url(#skySunset)" />
          <rect x="45" y="140" width="70" height="3" fill="url(#skySunset)" />
          <rect x="40" y="146" width="80" height="4" fill="url(#skySunset)" />

          {/* 流云 (橙色系) */}
          <g className="cloud-s" fill="#f97316" opacity="0.4">
            <path d="M 0,60 Q 20,50 40,65 Q 60,55 80,60 Q 100,70 60,75 Z" />
          </g>
          <g className="cloud-f" fill="#fbbf24" opacity="0.3">
             <rect x="-20" y="45" width="30" height="4" rx="2" />
             <rect x="-30" y="52" width="50" height="3" rx="1.5" />
             <rect x="25" y="90" width="40" height="5" rx="2" />
             <rect x="15" y="98" width="60" height="3" rx="1.5" />
          </g>

          {/* 群山剪影 (紫色/褐色) */}
          <path d="M -20,160 L 30,130 L 70,160 L 110,120 L 180,170 L 180,200 L -20,200 Z" fill="#4c1d95" opacity="0.7" />
          <path d="M -10,180 L 40,150 L 90,190 L 120,160 L 180,200 L -10,200 Z" fill="#2e1065" />
          
          {/* 地面剪影树木森林 */}
          <path d="M 0,200 Q 20,185 40,200 Q 60,190 80,200 Q 120,180 160,200 Z" fill="#1e1b4b" />
        </g>
      )}

      {/* ================= 星空风景 ================= */}
      {theme === 'night' && (
        <g>
          <rect x="0" y="0" width="160" height="200" fill="url(#skyNight)" />
          
          {/* 星星散布 */}
          {STARS.map((s, i) => (
            <circle 
              key={i} 
              cx={s.x} 
              cy={s.y} 
              r={s.r} 
              fill="#fff" 
              className="star-t" 
              style={{'--dur': `${s.dur}s`, '--del': `${s.del}s`} as any} 
            />
          ))}

          {/* 划过的流星 */}
          <g>
            <path d="M 0,0 L -20,-20" stroke="#fff" strokeWidth="1.5" className="meteor" style={{'--del': '2s'} as any} />
            <path d="M 0,0 L -40,-40" stroke="#fff" strokeWidth="2" className="meteor" style={{'--del': '8s'} as any} strokeDasharray="3,6" opacity="0.6" />
          </g>

          {/* 明月 */}
          <g transform="translate(110, 50)">
            <circle cx="0" cy="0" r="30" fill="url(#moonGlow)" />
            <circle cx="0" cy="0" r="14" fill="#f8fafc" />
            {/* 月海陨石坑 */}
            <circle cx="-4" cy="-3" r="3" fill="#cbd5e1" opacity="0.7" />
            <circle cx="5" cy="-2" r="2" fill="#cbd5e1" opacity="0.6" />
            <circle cx="2" cy="6" r="4" fill="#cbd5e1" opacity="0.8" />
            <circle cx="-6" cy="4" r="1.5" fill="#cbd5e1" opacity="0.5" />
          </g>

          {/* 暗夜远山轮廓 */}
          <path d="M -20,180 Q 20,160 50,190 T 120,160 L 180,190 L 180,200 L -20,200 Z" fill="#020617" opacity="0.8" />
          <path d="M -10,200 L 40,175 L 80,195 L 140,165 L 180,200 Z" fill="#000000" />
          
          {/* 松树剪影 */}
          {TREES.map((t, i) => (
             <path key={'t'+i} d={`M ${t.x1},200 L ${t.x2},${t.y2} L ${t.x3},200 Z`} fill="#000" />
          ))}
        </g>
      )}
    </svg>
  );
}
