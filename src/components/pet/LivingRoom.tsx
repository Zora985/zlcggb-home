import React, { useState } from 'react';
import { WindowSceneries } from './WindowSceneries';

export function LivingRoom() {
  const [isLampOn, setIsLampOn] = useState(true);
  const [isTvOn, setIsTvOn] = useState(false);
  const [pictureIdx, setPictureIdx] = useState(0);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [windowThemeIdx, setWindowThemeIdx] = useState(0);

  const THEMES = ['night', 'day', 'sunset'];
  const currentTheme = THEMES[windowThemeIdx];

  const handlePictureClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPictureIdx((prev) => (prev + 1) % 3);
  };

  const handleLampClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLampOn(prev => !prev);
  };

  const handleTvClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTvOn(prev => !prev);
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#2a2438]">
      {/* 如果关了台灯，整体画面加一层暗色滤镜营造氛围 */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000"
        style={{ 
          backgroundColor: '#05030f', 
          opacity: isLampOn ? 0 : 0.6,
          mixBlendMode: 'multiply'
        }}
      />

      {/* 纯 SVG 绘制复古起居室 */}
      <svg
        viewBox="0 0 800 450"
        className="absolute inset-0 w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        style={{ imageRendering: 'pixelated' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 墙纸图案 */}
          <pattern id="wallpaper" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="#2a2438" />
            <rect width="2" height="40" fill="#352d46" opacity="0.5" />
            <rect width="40" height="2" fill="#352d46" opacity="0.3" />
            <circle cx="20" cy="20" r="1.5" fill="#403658" />
          </pattern>

          {/* 窗外天空渐变 */}
          <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b0e14" />
            <stop offset="100%" stopColor="#1a2035" />
          </linearGradient>
          <linearGradient id="sunsetSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c2410c" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fcd34d" />
          </linearGradient>

          {/* 地板渐变 */}
          <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a3b32" />
            <stop offset="10%" stopColor="#3d2f26" />
            <stop offset="100%" stopColor="#1a120e" />
          </linearGradient>

          {/* 台灯光晕 */}
          <radialGradient id="lampGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#ffb86c" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#ffb86c" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffb86c" stopOpacity="0" />
          </radialGradient>

          {/* 动画逻辑 */}
          <style>{`
            @keyframes wall-twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.8; } }
            @keyframes tv-flicker { 0% { opacity: 0.8; } 5% { opacity: 0.95; } 10% { opacity: 0.85; } 15% { opacity: 0.9; } 20%, 100% { opacity: 0.8; } }
            @keyframes cloud-drift { 0% { transform: translateX(-20px); } 100% { transform: translateX(180px); } }
            .star { animation: wall-twinkle var(--dur, 3s) infinite var(--delay, 0s); }
            .tv-screen { animation: tv-flicker 4s infinite alternate; }
            .cloud1 { animation: cloud-drift 20s linear infinite; }
            .cloud2 { animation: cloud-drift 25s linear infinite reverse; }
          `}</style>
        </defs>

        {/* 墙壁 */}
        <rect x="0" y="0" width="800" height="320" fill="url(#wallpaper)" />

        {/* 护墙板/踢脚线 */}
        <rect x="0" y="300" width="800" height="20" fill="#1c1624" />
        <rect x="0" y="300" width="800" height="3" fill="#352d46" />
        <rect x="0" y="317" width="800" height="3" fill="#110d16" />

        {/* ================= 窗户区 ================= */}
        <g transform="translate(480, 50)">
          {/* 1. 窗外底框（固定垫底层） */}
          <rect x="-10" y="-10" width="180" height="220" fill="#3a2e45" rx="4" className="pointer-events-none" />
          <rect x="-5" y="-5" width="170" height="210" fill="#4d3e5e" rx="2" className="pointer-events-none" />
          <rect x="0" y="0" width="160" height="200" fill="#1e1826" className="pointer-events-none" /> {/* 垫底黑洞 */}

          {/* 2. 窗外动态渲染风景 (仅在窗户开启时允许点击切换，移除文字提示) */}
          <g 
             onClick={(e) => { 
               if (isWindowOpen) {
                 e.stopPropagation();
                 setWindowThemeIdx((prev) => (prev + 1) % 3);
               }
             }}
             className={isWindowOpen ? "cursor-pointer transition-opacity hover:opacity-90" : ""}
          >
            <WindowSceneries theme={currentTheme as any} />
          </g>

          {/* 3. 内阴影遮罩（盖在天空边缘） */}
          <rect x="0" y="0" width="160" height="200" fill="none" stroke="#251d2f" strokeWidth="6" className="pointer-events-none" />

          {/* 3. 玻璃与窗扇（分左右两扇开合） */}
          {/* 左窗扇 */}
          <g 
            onClick={(e) => { e.stopPropagation(); setIsWindowOpen(!isWindowOpen); }} 
            className="cursor-pointer"
            style={{ 
              transformOrigin: '0px 100px',
              transform: isWindowOpen ? 'scaleX(0.15)' : 'scaleX(1)',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
             <rect x="0" y="0" width="80" height="200" fill={isWindowOpen ? "#a78bfa" : "#fff"} opacity={isWindowOpen ? 0.3 : 0.05} style={{ transition: "all 0.6s" }} />
             <polygon points="10,190 40,10 60,10 30,190" fill="#fff" opacity={isWindowOpen ? 0 : 0.05} style={{ transition: "opacity 0.6s" }} />
             <rect x="0" y="0" width="80" height="200" fill="none" stroke="#3a2e45" strokeWidth="4" />
             <rect x="2" y="2" width="76" height="196" fill="none" stroke="#5c4a70" strokeWidth="2" />
             <rect x="0" y="96" width="80" height="8" fill="#3a2e45" />
             <rect x="0" y="98" width="80" height="4" fill="#5c4a70" />
             <rect x="70" y="90" width="4" height="20" fill="#b08d6a" rx="1" /> {/* 左把手 */}
          </g>

          {/* 右窗扇 */}
          <g 
            onClick={(e) => { e.stopPropagation(); setIsWindowOpen(!isWindowOpen); }} 
            className="cursor-pointer"
            style={{ 
              transformOrigin: '160px 100px',
              transform: isWindowOpen ? 'scaleX(0.15)' : 'scaleX(1)',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
             <rect x="80" y="0" width="80" height="200" fill={isWindowOpen ? "#a78bfa" : "#fff"} opacity={isWindowOpen ? 0.3 : 0.05} style={{ transition: "all 0.6s" }} />
             <polygon points="90,190 120,10 140,10 110,190" fill="#fff" opacity={isWindowOpen ? 0 : 0.03} style={{ transition: "opacity 0.6s" }} />
             <rect x="80" y="0" width="80" height="200" fill="none" stroke="#3a2e45" strokeWidth="4" />
             <rect x="82" y="2" width="76" height="196" fill="none" stroke="#5c4a70" strokeWidth="2" />
             <rect x="80" y="96" width="80" height="8" fill="#3a2e45" />
             <rect x="80" y="98" width="80" height="4" fill="#5c4a70" />
             <rect x="86" y="90" width="4" height="20" fill="#b08d6a" rx="1" /> {/* 右把手 */}
          </g>

          {/* 4. 窗台（覆盖在最下部） */}
          <rect x="-15" y="210" width="190" height="15" fill="#5c4a70" rx="2" className="pointer-events-none" />
          <rect x="-15" y="225" width="190" height="5" fill="#251d2f" className="pointer-events-none" />
        </g>

        {/* ================= 墙上的挂画 (点击交互点) ================= */}
        <g transform="translate(100, 80)">
          <rect x="4" y="4" width="100" height="120" fill="#000" opacity="0.3" rx="2" />
          <rect x="0" y="0" width="100" height="120" fill="#b08d6a" rx="2" />
          
          {/* 可点击区域 */}
          <g onClick={handlePictureClick} className="cursor-pointer transition-opacity hover:opacity-80">
            <rect x="5" y="5" width="90" height="110" fill="#f4e1c1" />
            
            <image 
              href={`/paintings/${['sunset', 'beach', 'space'][pictureIdx]}.png`} 
              x="10" y="10" width="80" height="100" 
              preserveAspectRatio="xMidYMid slice" 
              style={{ imageRendering: 'pixelated' }} 
            />
            {/* 边框效果 */}
            <rect x="10" y="10" width="80" height="100" fill="none" stroke="#8a6142" strokeWidth="2" />
            <rect x="10" y="10" width="80" height="100" fill="transparent" stroke="#000" strokeOpacity="0.3" strokeWidth="1" className="pointer-events-none" />
          </g>

          {/* 交互提示 */}
          <g className="pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100">
             <text x="50" y="-10" fill="#fff" fontSize="12" textAnchor="middle" opacity="0.6">点击换画</text>
          </g>
        </g>

        {/* ================= 地板与地毯 ================= */}
        <rect x="0" y="320" width="800" height="130" fill="url(#floorGrad)" />
        {[...Array(16)].map((_, i) => (
          <path key={`floor-${i}`} d={`M ${i * 50} 320 L ${i * 55 - 40} 450`} stroke="#110d16" strokeWidth="2" opacity="0.4" />
        ))}

        <g transform="translate(200, 360)">
          <ellipse cx="200" cy="30" rx="180" ry="45" fill="#241b2e" opacity="0.6" />
          <ellipse cx="200" cy="25" rx="170" ry="40" fill="#e27396" />
          <ellipse cx="200" cy="25" rx="140" ry="30" fill="#ea9ab2" />
          <ellipse cx="200" cy="25" rx="100" ry="20" fill="#ffb6b9" />
          {[...Array(20)].map((_, i) => (
            <rect key={'fL'+i} x={35} y={15 + i*1.8} width="6" height="2" fill="#ffcad4" transform={`rotate(${i*3.5}, 30, ${15+i})`} opacity="0.8" />
          ))}
          {[...Array(20)].map((_, i) => (
            <rect key={'fR'+i} x={360} y={15 + i*1.8} width="6" height="2" fill="#ffcad4" transform={`rotate(${-i*3.5}, 370, ${15+i})`} opacity="0.8" />
          ))}
        </g>

        {/* ================= 家具：电视机 (点击交互点) ================= */}
        <g transform="translate(620, 240)">
          <rect x="4" y="80" width="70" height="10" fill="#110d16" rx="2" opacity="0.6" />
          {/* 电视柜 */}
          <rect x="10" y="40" width="90" height="40" fill="#8a6142" rx="2" />
          <rect x="15" y="45" width="80" height="30" fill="#69462b" rx="2" />
          <rect x="20" y="50" width="30" height="20" fill="#4d321d" rx="1" />
          <rect x="60" y="50" width="30" height="20" fill="#4d321d" rx="1" />
          <polygon points="15,80 20,80 18,90 13,90" fill="#4d321d" />
          <polygon points="90,80 95,80 97,90 92,90" fill="#4d321d" />
          
          {/* 电视天线 */}
          <path d="M 45 -10 L 30 -30 M 55 -10 L 75 -25" stroke="#737373" strokeWidth="2" />
          <circle cx="30" cy="-30" r="2" fill="#a3a3a3" />
          <circle cx="75" cy="-25" r="2" fill="#a3a3a3" />
          
          {/* 电视本体 */}
          <rect x="25" y="-10" width="60" height="50" fill="#525252" rx="4" />
          
          {/* 屏幕和光 */}
          <g onClick={handleTvClick} className="cursor-pointer">
            <rect x="30" y="-5" width="40" height="35" fill="#1a1a1a" rx="2" />
            
            {/* 注入真实的视频播放 <foreignObject> */}
            {isTvOn ? (
              <foreignObject x="30" y="-5" width="40" height="35">
                <video 
                  src="https://www.w3schools.com/html/mov_bbb.mp4" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '2px', opacity: 1 }} 
                />
              </foreignObject>
            ) : (
              /* 如果关着，显示微小反光 */
              <>
                <rect x="30" y="-5" width="40" height="35" fill="#45f3ff" opacity="0.05" rx="2" className="tv-screen" />
                <polygon points="32,-3 68,-3 65,28 35,28" fill="#45f3ff" opacity="0.08" className="tv-screen" />
              </>
            )}
          </g>

          {/* 按钮与指示灯 */}
          <circle cx="78" cy="5" r="3" fill="#333" />
          <circle cx="78" cy="15" r="3" fill="#333" />
          <rect x="75" y="25" width="6" height="2" fill={isTvOn ? "#22c55e" : "#f87171"} /> {/* 红/绿 灯 */}
        </g>

        {/* ================= 家具：落地灯 (点击交互点) ================= */}
        <g transform="translate(60, 160)">
          <rect x="-15" y="160" width="50" height="10" fill="#110d16" rx="5" opacity="0.6" />
          {/* 杆 */}
          <rect x="8" y="40" width="4" height="120" fill="#4a5568" />
          <rect x="6" y="160" width="8" height="4" fill="#2d3748" />
          <rect x="0" y="164" width="20" height="4" fill="#a0aec0" rx="2" />
          
          {/* 灯罩主体 */}
          <g onClick={handleLampClick} className="cursor-pointer transition-opacity hover:opacity-80">
            <polygon points="10,0 -10,40 30,40" fill={isLampOn ? "#ed8936" : "#c05621"} style={{ transition: "fill 0.3s" }} />
            <polygon points="10,0 -5,40 25,40" fill={isLampOn ? "#dd6b20" : "#9c4221"} opacity="0.6" style={{ transition: "fill 0.3s" }} />
            <rect x="-10" y="40" width="40" height="5" fill="#7b341e" rx="2" />
            
            {/* 拉绳开关 */}
            <path d="M 20 45 L 20 60" stroke="#fff" strokeWidth="1" opacity="0.5" />
            <circle cx="20" cy="62" r="2" fill="#e2e8f0" />
          </g>
          
          {/* 发光范围 */}
          <g style={{ opacity: isLampOn ? 1 : 0, transition: 'opacity 0.4s ease' }} className="pointer-events-none">
            <circle cx="10" cy="40" r="140" fill="url(#lampGlow)" className="tv-screen" />
            <polygon points="-5,45 25,45 80,180 -60,180" fill="#ffb86c" opacity="0.05" />
          </g>
        </g>
      </svg>
    </div>
  );
}
