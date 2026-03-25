

interface BedroomProps {
  onSleepToggle: () => void;
  isSleeping: boolean;
}

export function Bedroom({ onSleepToggle, isSleeping }: BedroomProps) {
  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden transition-colors duration-1000 ${isSleeping ? 'bg-[#0a0a1a]' : 'bg-[#e2e8f0]'}`}>
      {/* 卧室 SVG 场景 */}
      <svg
        viewBox="0 0 800 450"
        className="absolute inset-0 w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        style={{ imageRendering: 'pixelated', transition: 'filter 1s ease', filter: isSleeping ? 'brightness(0.2) contrast(1.2)' : 'none' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="bedWallpaper" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <rect width="30" height="30" fill="#f8fafc" />
            <path d="M 0 15 Q 15 0 30 15" fill="none" stroke="#e2e8f0" strokeWidth="2" />
          </pattern>
          <linearGradient id="bedFloor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* 墙面 */}
        <rect x="0" y="0" width="800" height="300" fill="url(#bedWallpaper)" />
        {/* 踢脚线 */}
        <rect x="0" y="300" width="800" height="15" fill="#f1f5f9" />
        <rect x="0" y="312" width="800" height="3" fill="#cbd5e1" />
        {/* 地板 */}
        <rect x="0" y="315" width="800" height="135" fill="url(#bedFloor)" />

        {/* ================= 大飘窗 ================= */}
        <g transform="translate(100, 40)">
          {/* 窗外: 如果在睡觉显示星空，否则浅蓝 */}
          <rect x="0" y="0" width="200" height="220" fill={isSleeping ? "#0f172a" : "#bae6fd"} style={{ transition: "all 1s" }} />
          {isSleeping && (
            <g>
              <circle cx="150" cy="50" r="25" fill="#fef08a" />
              <rect x="30" y="40" width="2" height="2" fill="#fff" opacity="0.8" />
              <rect x="70" y="90" width="2" height="2" fill="#fff" opacity="0.6" />
              <rect x="180" y="120" width="2" height="2" fill="#fff" opacity="0.9" />
              <rect x="50" y="160" width="2" height="2" fill="#fff" opacity="0.7" />
            </g>
          )}
          {/* 窗框 */}
          <rect x="-10" y="-10" width="220" height="240" fill="#f8fafc" rx="5" />
          <rect x="-5" y="-5" width="210" height="230" fill="#e2e8f0" rx="3" />
          <rect x="0" y="0" width="200" height="220" fill="none" stroke="#cbd5e1" strokeWidth="6" />
          <rect x="96" y="0" width="8" height="220" fill="#f8fafc" />
          <rect x="0" y="140" width="200" height="8" fill="#f8fafc" />
          
          {/* 窗帘 */}
          <path d="M -10 -10 Q 30 -5 50 220 L 0 220 Z" fill="#38bdf8" opacity="0.8" />
          <path d="M 0 -10 Q 15 10 30 220 L 0 220 Z" fill="#0284c7" opacity="0.6" />
          
          <path d="M 210 -10 Q 170 -5 150 220 L 200 220 Z" fill="#38bdf8" opacity="0.8" />
          <path d="M 200 -10 Q 185 10 170 220 L 200 220 Z" fill="#0284c7" opacity="0.6" />
        </g>

        {/* ================= 床床 ================= */}
        <g transform="translate(400, 180)">
          {/* 地影 */}
          <rect x="10" y="140" width="300" height="30" fill="#1e293b" opacity="0.3" rx="15" />
          
          {/* 床头板 */}
          <rect x="280" y="0" width="20" height="150" fill="#8b5cf6" rx="10" />
          
          {/* 床架 */}
          <rect x="0" y="110" width="300" height="20" fill="#c4b5fd" rx="5" />
          
          {/* 床垫 */}
          <rect x="10" y="90" width="270" height="25" fill="#f8fafc" rx="5" />
          
          {/* 这里是人躺的地方：根据是否睡着切换被窝与宠物的画面 */}
          {isSleeping ? (
            <>
              {/* 宠物睡在床上的头和身体轮廓（压扁一点的枕头） */}
              <rect x="220" y="78" width="55" height="18" fill="#e2e8f0" rx="8" />
              
              {/* 宠物橘黄色的头（只露出半个身位，且闭着眼睛） */}
              <g transform="translate(225, 65)">
                <rect x="0" y="0" width="36" height="26" fill="#f97316" rx="4" />
                {/* 闭着的眼睛 (- -) */}
                <rect x="6" y="10" width="8" height="3" fill="#431407" />
                <rect x="22" y="10" width="8" height="3" fill="#431407" />
                {/* 轻轻呼气的嘴巴 */}
                <rect x="16" y="18" width="4" height="2" fill="#431407" />
              </g>

              {/* 盖得非常严实的紫罗兰色被子 */}
              <path d="M 10 90 Q 120 70 235 88 L 235 115 L 10 115 Z" fill="#8b5cf6" />
              <path d="M 10 90 Q 120 75 220 95 L 220 115 L 10 115 Z" fill="#a78bfa" /> {/* 被子褶皱渐变过渡层 */}
            </>
          ) : (
            <>
              {/* 没睡觉时那高高鼓起的纯白枕头 */}
              <rect x="230" y="70" width="50" height="25" fill="#fff" rx="10" transform="rotate(-10, 255, 82)" />
              {/* 被子跑到了一旁（乱乱的皱巴巴轮廓） */}
              <path d="M 120 85 Q 150 50 200 85 Q 230 110 270 95 L 270 140 Q 200 130 150 150 Q 80 130 120 85" fill="#a78bfa" />
            </>
          )}
        </g>

        {/* ================= 床头柜与台灯（交互点） ================= */}
        <g transform="translate(710, 240)">
          <rect x="-10" y="80" width="70" height="15" fill="#1e293b" opacity="0.3" rx="5" />
          
          {/* 边桌 */}
          <rect x="0" y="30" width="50" height="50" fill="#fcd34d" rx="2" />
          <rect x="5" y="40" width="40" height="15" fill="#fbbf24" rx="2" />
          <circle cx="25" cy="47" r="2" fill="#d97706" />
          <rect x="5" y="60" width="40" height="15" fill="#fbbf24" rx="2" />
          <circle cx="25" cy="67" r="2" fill="#d97706" />

          {/* 小黄鸭台灯 */}
          <g 
            onClick={onSleepToggle} 
            className="cursor-pointer transition-opacity hover:opacity-80" 
            transform="translate(15, -15)"
          >
            {/* 底座 */}
            <ellipse cx="10" cy="45" rx="15" ry="5" fill="#fff" />
            <rect x="8" y="25" width="4" height="20" fill="#e2e8f0" />
            {/* 鸭子灯罩 */}
            <path d="M -5 15 Q 10 -10 25 15 Q 10 30 -5 15" fill="#fef08a" />
            <circle cx="2" cy="12" r="2" fill="#000" />
            <polygon points="-8,15 -2,12 -2,18" fill="#f97316" />
          </g>
        </g>

        {/* Zzz... 特效 */}
        {isSleeping && (
          <g transform="translate(560, 160)">
            <text x="0" y="0" fontSize="24" fill="#a78bfa" className="animate-sleep-z1">Z</text>
            <text x="15" y="-20" fontSize="32" fill="#c4b5fd" className="animate-sleep-z2">z</text>
            <text x="35" y="-45" fontSize="40" fill="#ddd6fe" className="animate-sleep-z3">z</text>
          </g>
        )}
      </svg>

      {/* 关灯提示 */}
      {!isSleeping && (
        <div className="absolute top-[35%] right-[2%] animate-pulse bg-white/90 text-indigo-600 px-3 py-1.5 rounded-full shadow-lg border border-indigo-200 text-sm font-bold flex items-center gap-2 pointer-events-none">
          <span>💡</span> 点击台灯关灯睡觉
        </div>
      )}

      <style>{`
        @keyframes zzz {
          0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
          50% { opacity: 1; transform: translate(10px, -20px) scale(1.1); }
          100% { opacity: 0; transform: translate(20px, -40px) scale(1.5); }
        }
        .animate-sleep-z1 { animation: zzz 3s linear infinite; }
        .animate-sleep-z2 { animation: zzz 3s linear 1s infinite; }
        .animate-sleep-z3 { animation: zzz 3s linear 2s infinite; }
      `}</style>
    </div>
  );
}
