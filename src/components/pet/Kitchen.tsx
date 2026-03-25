import { useState } from 'react';

interface KitchenProps {
  onFeed: (nutrition: number, moodBns: number, dropX: number) => void;
  isSleeping: boolean;
  petX: number;
}

export function Kitchen({ onFeed, isSleeping, petX }: KitchenProps) {
  const [topDoorOpen, setTopDoorOpen] = useState(false);
  const [bottomDoorOpen, setBottomDoorOpen] = useState(false);
  const [fallingFood, setFallingFood] = useState<{id: number, emoji: string, x: number}[]>([]);

  const foods = [
    { emoji: '🍖', nutrition: 25, mood: 5, isTop: true, pos: [40, 45] },
    { emoji: '🍔', nutrition: 30, mood: 10, isTop: true, pos: [100, 45] },
    { emoji: '🍎', nutrition: 10, mood: 2, isTop: false, pos: [40, 130] },
    { emoji: '🥗', nutrition: 15, mood: 1, isTop: false, pos: [100, 130] },
  ];

  const handleDropFood = (food: typeof foods[0]) => {
    if (isSleeping) return;
    
    // 获取当下的宠物坐标（如果正在走动，也是目的地的坐标）
    // 确保食物无条件“精准命中”宠物头顶区域
    const dropX = petX; 
    const dropId = Date.now();
    
    setFallingFood(prev => [...prev, { id: dropId, emoji: food.emoji, x: dropX }]);
    
    // 立即告诉宠物食物掉哪了
    onFeed(food.nutrition, food.mood, dropX);
    
    // 食物动画时长为 1s 左右落地，落在地上后消失 (假装被吃掉)
    setTimeout(() => {
      setFallingFood(prev => prev.filter(f => f.id !== dropId));
    }, 1200);
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#2D3238]">
      {/* 厨房 SVG 场景 */}
      <svg
        viewBox="0 0 800 450"
        className="absolute inset-0 w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        style={{ imageRendering: 'pixelated' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wallLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3E454C" />
            <stop offset="100%" stopColor="#22262A" />
          </linearGradient>
          <pattern id="tile" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="#E2E8F0" />
            <rect width="38" height="38" fill="#F8FAFC" />
            <circle cx="20" cy="20" r="2" fill="#CBD5E1" opacity="0.5" />
          </pattern>
        </defs>

        {/* 墙壁 */}
        <rect x="0" y="0" width="800" height="340" fill="url(#wallLight)" />
        {/* 地板瓷砖 */}
        <g transform="scale(1, 0.4) translate(0, 850)">
          <rect x="0" y="0" width="800" height="300" fill="url(#tile)" />
        </g>
        <rect x="0" y="340" width="800" height="110" fill="#000" opacity="0.2" />

        {/* ================= 橱柜与操作台 ================= */}
        <g transform="translate(60, 200)">
          {/* 地影 */}
          <rect x="10" y="140" width="300" height="20" fill="#111" opacity="0.5" rx="5" />
          
          {/* 柜体 */}
          <rect x="0" y="0" width="300" height="140" fill="#475569" rx="2" />
          <rect x="0" y="0" width="300" height="15" fill="#1E293B" /> {/* 台面 */}
          
          {/* 抽屉/柜门 */}
          <rect x="10" y="25" width="85" height="105" fill="#334155" rx="2" />
          <rect x="20" y="35" width="20" height="4" fill="#94A3B8" rx="1" />

          <rect x="105" y="25" width="85" height="45" fill="#334155" rx="2" />
          <rect x="135" y="35" width="25" height="4" fill="#94A3B8" rx="1" />
          
          <rect x="105" y="80" width="85" height="50" fill="#334155" rx="2" />
          <rect x="135" y="90" width="25" height="4" fill="#94A3B8" rx="1" />

          <rect x="200" y="25" width="90" height="105" fill="#334155" rx="2" />
          <rect x="260" y="35" width="20" height="4" fill="#94A3B8" rx="1" />

          {/* 案板和锅 */}
          <rect x="30" y="-8" width="50" height="8" fill="#D4A373" rx="1" />
          <path d="M 220 0 L 220 -30 L 270 -30 L 270 0 Z" fill="#94A3B8" /> {/* 锅盖 */}
          <rect x="235" y="-35" width="20" height="5" fill="#475569" rx="2" />
        </g>

        {/* ================= 冰箱本体 ================= */}
        <g transform="translate(480, 80)">
          {/* 冰箱地影 */}
          <rect x="0" y="260" width="160" height="15" fill="#111" opacity="0.6" rx="5" />
          
          {/* 冰箱外壳底色 (开门时外壳的边缘) */}
          <rect x="0" y="0" width="160" height="260" fill="#E2E8F0" rx="8" />

          {/* 冰箱内胆阴影区 (开门后可见) */}
          <rect x="5" y="5" width="150" height="73" fill="#64748B" rx="4" />
          <rect x="5" y="82" width="150" height="173" fill="#64748B" rx="4" />
          
          {/* 内胆隔板 */}
          <rect x="5" y="50" width="150" height="4" fill="#94A3B8" />    {/* 上层冷冻室隔板 */}
          <rect x="5" y="140" width="150" height="4" fill="#94A3B8" />   {/* 下层冷藏室高隔板 */}
          <rect x="5" y="200" width="150" height="4" fill="#94A3B8" />   {/* 下层冷藏室低隔板 */}

          {/* ================= 摆放在内胆的食物 ================= */}
          {foods.map((food, i) => (
            <g 
              key={`food-${i}`}
              transform={`translate(${food.pos[0]}, ${food.pos[1]})`}
              className="cursor-pointer transition-opacity hover:opacity-80"
              onClick={(e) => {
                e.stopPropagation();
                handleDropFood(food);
              }}
            >
              <text x="0" y="0" fontSize="30" textAnchor="middle" dominantBaseline="middle">
                {food.emoji}
              </text>
            </g>
          ))}

          {/* ================= 上排冰箱门 (向右翻开) ================= */}
          <g 
            onClick={(e) => { e.stopPropagation(); setTopDoorOpen(prev => !prev); }}
            className="cursor-pointer"
            style={{ 
              transformOrigin: '160px 40px', 
              transform: topDoorOpen ? 'scaleX(0.12)' : 'scaleX(1)',
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* 上门板主体 */}
            <rect x="0" y="0" width="160" height="80" fill="#F1F5F9" rx="6" />
            <rect x="0" y="77" width="160" height="3" fill="#CBD5E1" rx="2" /> {/* 底缝阴影 */}
            
            {/* 左侧把手 */}
            <rect x="15" y="20" width="6" height="40" fill="#94A3B8" rx="3" />
            
            {/* 顶门装饰：红色小磁片 */}
            <circle cx="115" cy="28" r="4" fill="#EF4444" />
          </g>

          {/* ================= 下排冰箱门 (向右翻开) ================= */}
          <g 
            onClick={(e) => { e.stopPropagation(); setBottomDoorOpen(prev => !prev); }}
            className="cursor-pointer"
            style={{ 
              transformOrigin: '160px 170px', 
              transform: bottomDoorOpen ? 'scaleX(0.12)' : 'scaleX(1)',
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* 下门板主体 */}
            <rect x="0" y="82" width="160" height="178" fill="#F1F5F9" rx="6" />
            
            {/* 左侧长把手 */}
            <rect x="15" y="100" width="6" height="70" fill="#94A3B8" rx="3" />
            
            {/* 下门装饰：涂鸦便利贴 */}
            <rect x="100" y="110" width="30" height="30" fill="#FEF08A" transform="rotate(5, 115, 125)" />
            <rect x="110" y="115" width="15" height="2" fill="#CA8A04" transform="rotate(5, 115, 125)" />
            <rect x="105" y="122" width="20" height="2" fill="#CA8A04" transform="rotate(5, 115, 125)" />
            <rect x="110" y="129" width="15" height="2" fill="#CA8A04" transform="rotate(5, 115, 125)" />
          </g>
        </g>
      </svg>

      {/* 掉落特效 */}
      {fallingFood.map(food => (
        <div 
          key={food.id} 
          className="absolute text-4xl animate-bounce"
          style={{ 
            left: `${food.x}%`, 
            top: 'auto', 
            bottom: '22%',
            animation: 'drop-and-bounce 1s cubic-bezier(0.36, 0, 0.66, -0.56) forwards'
          }}
        >
          {food.emoji}
        </div>
      ))}

      <style>{`
        @keyframes drop-and-bounce {
          0% { transform: translateY(-300px) scale(0); opacity: 0; }
          50% { transform: translateY(0) scale(1); opacity: 1; }
          75% { transform: translateY(-30px) scale(1.1); }
          100% { transform: translateY(0) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
