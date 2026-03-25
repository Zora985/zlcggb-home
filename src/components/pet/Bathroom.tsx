import { useState } from 'react';

interface BathroomProps {
  onClean: () => void;
  hygiene: number;
}

export function Bathroom({ onClean, hygiene }: BathroomProps) {
  const [isShowering, setIsShowering] = useState(false);

  const handleShower = () => {
    if (isShowering) return;
    setIsShowering(true);
    // 模拟洗澡动画时间
    setTimeout(() => {
      onClean();
      setIsShowering(false);
    }, 3000);
  };

  const isDirty = hygiene < 30;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#e0f2fe]">
      {/* 浴室 SVG 场景 */}
      <svg
        viewBox="0 0 800 450"
        className="absolute inset-0 w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        style={{ imageRendering: 'pixelated' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="bathTile" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <rect width="30" height="30" fill="#bae6fd" />
            <rect width="28" height="28" fill="#e0f2fe" />
          </pattern>
          <pattern id="floorTile" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="scale(1, 0.5)">
            <polygon points="0,20 20,0 40,20 20,40" fill="#64748b" />
            <polygon points="20,0 40,-20 60,0 40,20" fill="#94a3b8" />
            <polygon points="0,-20 20,-40 40,-20 20,0" fill="#94a3b8" />
            <polygon points="-20,0 0,-20 20,0 0,20" fill="#94a3b8" />
          </pattern>
        </defs>

        {/* 墙面瓷砖 */}
        <rect x="0" y="0" width="800" height="320" fill="url(#bathTile)" />
        {/* 地面瓷砖 */}
        <rect x="0" y="320" width="800" height="130" fill="url(#floorTile)" />

        {/* 墙腰线 */}
        <rect x="0" y="315" width="800" height="5" fill="#38bdf8" />
        <rect x="0" y="310" width="800" height="5" fill="#0284c7" />

        {/* ================= 镜子与洗手台 ================= */}
        <g transform="translate(100, 100)">
          {/* 镜子背板及边框 */}
          <rect x="15" y="-30" width="100" height="120" fill="#cbd5e1" rx="50" />
          <rect x="25" y="-20" width="80" height="100" fill="#f8fafc" rx="40" />
          {/* 高光反光 */}
          <polygon points="40,60 80,-10 90,-10 50,60" fill="#fff" opacity="0.6" />
          <polygon points="60,60 95,0 100,0 65,60" fill="#fff" opacity="0.4" />
          
          {/* 洗手台 */}
          <rect x="0" y="100" width="130" height="10" fill="#f1f5f9" rx="2" />
          <rect x="10" y="110" width="110" height="40" fill="#94a3b8" rx="2" />
          <path d="M 30 110 Q 65 130 100 110" fill="#cbd5e1" />
          {/* 水龙头 */}
          <path d="M 60 90 Q 65 80 70 90 L 70 100 L 60 100 Z" fill="#64748b" />
          <rect x="62" y="80" width="6" height="4" fill="#64748b" />
          <circle cx="55" cy="95" r="4" fill="#38bdf8" /> {/* 冷水 */}
          <circle cx="75" cy="95" r="4" fill="#f87171" /> {/* 热水 */}
        </g>

        {/* ================= 浴缸 ================= */}
        <g transform="translate(450, 220)">
          {/* 浴缸光影 */}
          <ellipse cx="140" cy="110" rx="160" ry="25" fill="#1e293b" opacity="0.3" />
          {/* 浴缸本体 */}
          <path d="M 0 0 L 280 0 Q 290 100 240 100 L 40 100 Q -10 100 0 0 Z" fill="#f8fafc" />
          <path d="M 20 10 Q 140 30 260 10 Q 280 80 230 90 L 50 90 Q 0 80 20 10 Z" fill="#e2e8f0" />
          <ellipse cx="140" cy="10" rx="140" ry="10" fill="#f1f5f9" />
          {/* 浴缸脚 */}
          <path d="M 40 100 L 50 120 L 30 120 Z" fill="#d4d4d8" />
          <path d="M 240 100 L 250 120 L 230 120 Z" fill="#d4d4d8" />
          
          {/* 花洒头 (可点击开关) */}
          <g 
            transform="translate(140, -180)" 
            onClick={handleShower}
            className={`cursor-pointer transition-opacity ${isShowering ? 'opacity-90' : 'hover:opacity-80'}`}
          >
            {/* 管道 */}
            <path d="M 0 0 Q 0 -40 -40 -40" fill="none" stroke="#64748b" strokeWidth="6" />
            <path d="M 0 0 Q 0 -40 -40 -40" fill="none" stroke="#94a3b8" strokeWidth="2" />
            {/* 盘 */}
            <ellipse cx="0" cy="5" rx="25" ry="8" fill="#475569" />
            <ellipse cx="0" cy="8" rx="20" ry="6" fill="#94a3b8" />
            {/* 出水孔 */}
            <circle cx="-10" cy="8" r="1.5" fill="#334155" />
            <circle cx="0" cy="9" r="1.5" fill="#334155" />
            <circle cx="10" cy="8" r="1.5" fill="#334155" />
            <circle cx="-5" cy="5" r="1" fill="#334155" />
            <circle cx="5" cy="5" r="1" fill="#334155" />
          </g>
        </g>
      </svg>

      {/* 洗澡交互 UI 提示 */}
      {!isShowering && isDirty && (
        <div className="absolute top-[25%] right-[25%] animate-bounce bg-white/90 text-sky-600 px-3 py-1.5 rounded-full shadow-lg border border-sky-200 text-sm font-bold flex items-center gap-2 pointer-events-none">
          <span>🛁</span> 点击花洒洗澡！
        </div>
      )}

      {/* 苍蝇特效 (当特别脏时) */}
      {isDirty && !isShowering && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute left-[50%] bottom-[20%] w-[100px] h-[100px] animate-spin-slow">
            <span className="absolute -top-2 left-2 text-xs">🦟</span>
            <span className="absolute top-10 -right-4 text-xs">🦟</span>
            <span className="absolute -bottom-4 left-10 text-xs">🦟</span>
          </div>
        </div>
      )}

      {/* 洗澡特效 (CSS Canvas 叠加粒子) */}
      {isShowering && (
        <div className="absolute inset-0 pointer-events-none z-30 flex justify-center items-end pb-[20%]">
          {/* 水滴粒子组 */}
          <div className="absolute left-[73.5%] top-[18%] -translate-x-1/2 w-[80px] h-[250px] overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-3 bg-sky-300/80 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  animation: `shower-drop ${0.4 + Math.random() * 0.3}s linear ${Math.random() * 0.5}s infinite`
                }}
              />
            ))}
          </div>
          {/* 底部泡泡组 */}
          <div className="absolute left-[73.5%] bottom-[22%] -translate-x-1/2 w-[160px] flex justify-center">
            {[...Array(15)].map((_, i) => (
              <div 
                key={`b${i}`}
                className="absolute border border-sky-200/60 bg-white/20 rounded-full animate-bubble"
                style={{
                  width: `${10 + Math.random() * 20}px`,
                  height: `${10 + Math.random() * 20}px`,
                  left: `${20 + Math.random() * 60}%`,
                  bottom: `${-10 + Math.random() * 20}px`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shower-drop {
          0% { transform: translateY(0) scaleY(1); opacity: 0; }
          10% { opacity: 1; }
          80% { transform: translateY(220px) scaleY(1.5); opacity: 1; }
          100% { transform: translateY(240px) scaleY(0.5); opacity: 0; }
        }
        @keyframes bubble {
          0%, 100% { transform: scale(0.8) translateY(0); opacity: 0.5; }
          50% { transform: scale(1.1) translateY(-10px); opacity: 0.8; }
        }
        .animate-bubble {
          animation: bubble 2s ease-in-out infinite alternate;
        }
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
      `}</style>
    </div>
  );
}
