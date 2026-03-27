import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

interface PlaygroundProps {
  onPlayResult: (score: number) => void;
  petX: number; 
  setPetX: (x: number) => void;
  setFlip: (flip: boolean) => void;
  setIsWalking?: (walking: boolean) => void;
  setIsPlaying?: (playing: boolean) => void;
  characterFilter?: string;
}

interface Item { id: number; x: number; y: number; vy: number; type: 'star'|'heart'; size: number; rot: number; }

export function Playground({ onPlayResult, setIsPlaying, characterFilter }: PlaygroundProps) {
  const [gameMode, setGameMode] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showHint, setShowHint] = useState(false);

  // 触发重渲染的轻量状态，仅在需要时增删 React 节点
  const [, setItemsFlag] = useState(0);
  const [effects, setEffects] = useState<{id: number; x: number; y: number; emoji: string}[]>([]);

  const gameActiveRef = useRef(false);
  const scoreRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 高帧率物理引擎专用引用（杜绝闭包与渲染负担）
  const itemsRef = useRef<Item[]>([]);
  const lastTimeRef = useRef<number>(0);
  const reqRef = useRef<number>();
  const lastSpawnRef = useRef<number>(0);

  // 动态可视区域边界（百分比），每次游戏开始时基于实际 DOM 测量
  const viewBoundsRef = useRef({ minX: 5, maxX: 95 });
  const pendingCenterRef = useRef(false);

  const playerRef = useRef({ x: 50, flip: false, walking: false });
  const targetXRef = useRef<number | null>(null);
  const keys = useRef({ left: false, right: false });

  const itemNodesRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const playerNodeRef = useRef<HTMLDivElement>(null);

  // 测量当前视口下，游戏容器中哪部分百分比是可见的
  const calcViewBounds = useCallback(() => {
    const el = containerRef.current;
    if (!el) return { minX: 5, maxX: 95 };
    
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    
    // 如果没有铺满屏幕，或者已经在这个视口内
    if (w <= window.innerWidth) {
      return { minX: 5, maxX: 95 };
    }
    
    // 关键修复：rect.left 是容器左边缘相对于屏幕左边缘的位置
    // 如果向右滑动了屏幕，容器就会往左偏，rect.left 是负数
    // 我们需要算出当前屏幕在容器的哪一段百分比
    const visibleLeftPx = Math.max(0, -rect.left);
    const visibleRightPx = visibleLeftPx + window.innerWidth;
    
    // 转换为百分比，留出 5% 的物理安全边距
    const minX = Math.max(5, (visibleLeftPx / w) * 100 + 5);
    const maxX = Math.min(95, (visibleRightPx / w) * 100 - 5);
    
    return { minX, maxX };
  }, []);

  // === SVG 静态背景生成器 ===
  const stars = useMemo(() => Array.from({ length: 60 }).map(() => ({
    x: Math.random() * 800, y: Math.random() * 250, r: Math.random() * 1.5 + 0.5,
    dur: 2 + Math.random() * 3, delay: Math.random() * 2
  })), []);
  
  const grasses = useMemo(() => Array.from({ length: 100 }).map((_, i) => ({
    x: i * 8 + Math.random() * 4, h: 4 + Math.random() * 8
  })), []);
  
  const fireflies = useMemo(() => Array.from({ length: 15 }).map(() => ({
    x: 50 + Math.random() * 700, y: 220 + Math.random() * 100,
    dur: 4 + Math.random() * 4, delay: Math.random() * 4
  })), []);

  // ====== 核心 rAF 引擎 ======
  const spawnEffect = (x: number, y: number, emoji: string) => {
    const id = Date.now() + Math.random();
    setEffects(prev => [...prev, { id, x, y, emoji }]);
    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== id));
    }, 600);
  };

  const gameLoop = useCallback((time: number) => {
    if (!gameActiveRef.current) return;
    reqRef.current = requestAnimationFrame(gameLoop);

    const delta = time - lastTimeRef.current;
    if (delta > 50) { 
      lastTimeRef.current = time; 
      return; 
    }
    lastTimeRef.current = time;

    // === 核心修复：如果在“等待屏幕居中”阶段（即过渡动画进行中），不断更新边界 ===
    if (pendingCenterRef.current) {
       viewBoundsRef.current = calcViewBounds();
       const { minX, maxX } = viewBoundsRef.current;
       const centerX = (minX + maxX) / 2;
       playerRef.current.x = centerX;

       // 让 DOM 时刻跟随居中，直到过渡结束 (1000ms 过渡，我们可以在这里直接跟随)
       if (playerNodeRef.current) {
          playerNodeRef.current.style.transition = 'none';
          playerNodeRef.current.style.left = `${centerX}%`;
       }
    }

    const { minX, maxX } = viewBoundsRef.current;

    // 1. 玩家物理与操控解析
    let walked = false;
    let newX = playerRef.current.x;
    const speed = 1.6 * (delta / 16.6); // 加速移动手感

    if (keys.current.left) {
      newX = Math.max(minX, newX - speed);
      playerRef.current.flip = true;
      walked = true;
    } else if (keys.current.right) {
      newX = Math.min(maxX, newX + speed);
      playerRef.current.flip = false;
      walked = true;
    } else if (targetXRef.current !== null) {
      const target = Math.max(minX, Math.min(maxX, targetXRef.current));
      const diff = target - newX;
      if (Math.abs(diff) > speed) {
         newX += Math.sign(diff) * speed;
         playerRef.current.flip = diff < 0;
         walked = true;
      } else {
         newX = target;
         targetXRef.current = null;
      }
    }
    
    playerRef.current.x = newX;
    playerRef.current.walking = walked;

    // Direct DOM Update 极速修改位置，跳过 React Diff
    if (playerNodeRef.current) {
      playerNodeRef.current.style.left = `${newX}%`;
      playerNodeRef.current.style.transform = `translateX(-50%) scaleX(${playerRef.current.flip ? -1 : 1})`;
      const img = playerNodeRef.current.querySelector('img');
      if (img) {
        const src = walked ? '/pet-sprites/clawd-walking.svg' : '/pet-sprites/clawd-idle.svg';
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      }
    }

    // 2. 物品引擎 — 只在可视区域内生成
    let needsStateSync = false;
    const now = performance.now();
    const spawnRange = maxX - minX;
    if (now - lastSpawnRef.current > 420) { // 更高频生成
      lastSpawnRef.current = now;
      itemsRef.current.push({
        id: Date.now() + Math.random(),
        x: minX + Math.random() * spawnRange,
        y: -8,
        vy: 0.35 + Math.random() * 0.25, // 更快下落 0.35~0.6
        type: Math.random() > 0.4 ? 'star' : 'heart',
        size: 24 + Math.random() * 8,
        rot: Math.random() * 360
      });
      needsStateSync = true;
    }

    let collisionScore = 0;
    
    // 碰撞检测的精确阈值（百分比），根据可视区域动态调节
    const hitboxX = Math.max(4, spawnRange * 0.08); // 可视宽度的 8%，最小 4%
    
    // 自底向上遍历，安全进行 splice 中断
    for (let i = itemsRef.current.length - 1; i >= 0; i--) {
      const item = itemsRef.current[i];
      item.y += item.vy * (delta / 16.6);
      item.rot += item.vy * 2;

      const el = itemNodesRef.current.get(item.id);
      if (el) {
        el.style.top = `${item.y}%`;
        el.style.transform = `translateX(-50%) rotate(${item.rot}deg)`;
      }

      let removed = false;
      // 碰撞：精确匹配宠物 y 区间 (bottom:10% → 约 y=78~90) + 宽度阈值
      if (item.y > 72 && item.y < 92 && Math.abs(item.x - playerRef.current.x) < hitboxX) {
         const p = item.type === 'star' ? 3 : 5;
         collisionScore += p;
         spawnEffect(item.x, 82, `+${p}`); 
         removed = true;
      } else if (item.y > 105) {
         removed = true;
      }

      if (removed) {
        itemsRef.current.splice(i, 1);
        needsStateSync = true;
        itemNodesRef.current.delete(item.id);
        if (el) el.style.display = 'none';
      }
    }

    if (collisionScore > 0) {
       scoreRef.current += collisionScore;
       setScore(scoreRef.current);
    }

    if (needsStateSync) {
       setItemsFlag(f => f + 1);
    }

  }, []);

  const startGame = useCallback(() => {
    setGameMode(true);
    
    // 通知父级隐藏上下功能栏启动沉浸模式
    if (setIsPlaying) setIsPlaying(true);

    // 显示操作提示，3秒后自动淡出
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3000);

    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(30);
    itemsRef.current = [];
    setItemsFlag(0);
    setEffects([]);
    targetXRef.current = null;
    gameActiveRef.current = true;
    
    // 打开“持续居中追踪”模式
    pendingCenterRef.current = true;
    
    // 假设沉浸模式（隐藏导航栏、缩放等）的过渡动画最长 1000ms
    // 在 1000ms 后关闭追踪，正式锁定边界开始游戏操控
    setTimeout(() => {
       pendingCenterRef.current = false;
    }, 1000);

    lastSpawnRef.current = performance.now();
    lastTimeRef.current = performance.now();

    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          gameActiveRef.current = false;
          if (reqRef.current) cancelAnimationFrame(reqRef.current);
          
          setTimeout(() => {
            onPlayResult(scoreRef.current);
            setGameMode(false);
            if (setIsPlaying) setIsPlaying(false);
          }, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    reqRef.current = requestAnimationFrame(gameLoop);

    return () => {
      clearInterval(t);
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [gameLoop, onPlayResult, setIsPlaying, calcViewBounds]);

  useEffect(() => {
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    }
  }, []);

  // 键盘劫持
  useEffect(() => {
    if (!gameMode) return;
    const onKeyD = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = true;
    };
    const onKeyU = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = false;
    };
    window.addEventListener('keydown', onKeyD);
    window.addEventListener('keyup', onKeyU);
    return () => {
      window.removeEventListener('keydown', onKeyD);
      window.removeEventListener('keyup', onKeyU);
      keys.current = { left: false, right: false };
    }
  }, [gameMode]);

  const handlePointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!gameMode || !gameActiveRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    targetXRef.current = Math.max(2, Math.min(98, xPercent));
  }, [gameMode]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden bg-[#0a1128] transition-colors duration-1000 touch-none select-none"
      onPointerDown={handlePointer}
      onPointerMove={(e) => { if (e.buttons > 0) handlePointer(e); }}
    >
      <svg
        viewBox="0 0 800 450"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
        style={{ imageRendering: 'pixelated' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pgSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B0F3A" />
            <stop offset="40%" stopColor="#381D5E" />
            <stop offset="100%" stopColor="#25093A" />
          </linearGradient>
          <linearGradient id="pgGround" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#120A2E" />
            <stop offset="30%" stopColor="#0B061D" />
            <stop offset="100%" stopColor="#040209" />
          </linearGradient>
          <radialGradient id="moonG" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#D8B4E2" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#F9A8D4" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="800" height="360" fill="url(#pgSky)" />
        
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#F9A8D4" opacity="0.6" className="star-anim" style={{animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s`}} />
        ))}
        
        <circle cx="200" cy="180" r="160" fill="url(#moonG)" />
        <circle cx="200" cy="180" r="40" fill="#F472B6" />
        <circle cx="220" cy="160" r="15" fill="#BE185D" opacity="0.4" />
        <circle cx="185" cy="195" r="8" fill="#9D174D" opacity="0.3" />

        <path d="M 0 360 L 120 220 L 300 280 L 450 180 L 650 300 L 800 130 L 800 360 Z" fill="#2E1065" opacity="0.7" />
        <path d="M 0 360 L 180 260 L 400 320 L 600 240 L 800 310 L 800 360 Z" fill="#1C094B" opacity="0.8" />

        <g transform="translate(620, 160)">
          <rect x="-15" y="60" width="30" height="140" fill="#110526" rx="5" />
          <path d="M -10 120 Q -40 100 -50 110" fill="none" stroke="#110526" strokeWidth="10" strokeLinecap="round" />
          <path d="M 10 100 Q 50 80 60 90" fill="none" stroke="#110526" strokeWidth="10" strokeLinecap="round" />
          <ellipse cx="0" cy="40" rx="100" ry="80" fill="#D8B4E2" opacity="0.1" />
          <ellipse cx="0" cy="40" rx="80" ry="60" fill="#9333EA" opacity="0.8" />
          <ellipse cx="-20" cy="15" rx="60" ry="45" fill="#A855F7" />
          <ellipse cx="30" cy="30" rx="50" ry="40" fill="#C084FC" />
          <ellipse cx="-5" cy="-10" rx="45" ry="35" fill="#D8B4E2" />
          <circle cx="-10" cy="10" r="4" fill="#fff" opacity="0.8" />
          <circle cx="30" cy="20" r="3" fill="#fff" opacity="0.6" />
          <circle cx="10" cy="40" r="5" fill="#fff" opacity="0.9" />
        </g>

        <rect x="0" y="360" width="800" height="90" fill="url(#pgGround)" />
        {grasses.map((g, i) => (
          <rect key={i} x={g.x} y={360 - g.h} width="3" height={g.h} fill="#3B0764" />
        ))}

        {fireflies.map((f, i) => (
          <g key={i} className="firefly-anim" style={{animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`}}>
            <circle cx={f.x} cy={f.y} r="18" fill="#F0ABFC" opacity="0.15" />
            <circle cx={f.x} cy={f.y} r="3" fill="#FBCFE8" />
          </g>
        ))}
      </svg>

      {!gameMode && timeLeft === 30 && (
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2">
          <button 
            onClick={startGame}
            className="group relative px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-bold text-xl text-white shadow-[0_0_40px_rgba(236,72,153,0.5)] hover:shadow-[0_0_60px_rgba(236,72,153,0.8)] transition-all hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            <span className="relative flex items-center gap-3">🎮 开始捕星派对</span>
          </button>
        </div>
      )}

      {gameMode && (
        <>
          {typeof document !== 'undefined' && document.getElementById('scene-ui-portal') ? createPortal(
            <>
              {/* 计分板 - 左上角 */}
              <div className="absolute top-3 left-3 md:top-6 md:left-6 bg-purple-900/60 backdrop-blur-xl px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl border border-pink-400/50 text-pink-300 font-mono text-sm md:text-2xl font-black shadow-[0_0_15px_rgba(236,72,153,0.3)] tracking-wider pointer-events-auto">
                ⭐ <span className="text-white">{score.toString().padStart(4, '0')}</span>
              </div>
              {/* 倒计时 - 右上角 */}
              <div className="absolute top-3 right-3 md:top-6 md:right-6 bg-purple-900/60 backdrop-blur-xl px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl border border-purple-400/50 font-mono text-sm md:text-2xl font-black shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center gap-1.5 md:gap-2 pointer-events-auto">
                <span className={timeLeft <= 5 ? "text-pink-400 animate-pulse" : "text-purple-200"}>
                  ⏱ {timeLeft}<span className="text-[10px] md:text-sm ml-0.5">s</span>
                </span>
              </div>
              {/* 操作提示 - 开局3秒后自动淡出 */}
              <div className={`absolute bottom-[12%] md:bottom-12 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-5 py-2 md:px-6 md:py-2.5 rounded-full text-pink-200/90 text-xs md:text-sm font-bold tracking-widest pointer-events-none border border-pink-500/30 whitespace-nowrap shadow-[0_5px_15px_rgba(0,0,0,0.5)] transition-all duration-700 ${showHint ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                👆 左右滑动 / 按←→箭头接星星
              </div>
            </>,
            document.getElementById('scene-ui-portal')!
          ) : null}

          {/* 高性能图层 */}
          {itemsRef.current.map(i => (
            <div 
              key={i.id} 
              ref={el => { if (el) itemNodesRef.current.set(i.id, el); }}
              className="absolute z-10 pointer-events-none" 
              style={{ 
                left: `${i.x}%`, 
                top: `${i.y}%`, 
                width: i.size, 
                height: i.size,
                transform: `translateX(-50%) rotate(${i.rot}deg)`, 
                willChange: 'transform, top'
              }}
            >
              {i.type === 'star' ? (
                <svg viewBox="0 0 100 100" className="drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] w-full h-full">
                  <path d="M50 0 L63 35 L100 35 L70 57 L82 95 L50 72 L18 95 L30 57 L0 35 L37 35 Z" fill="#FDE047" stroke="#CA8A04" strokeWidth="4" strokeLinejoin="round" />
                  <path d="M50 15 L60 38 L90 38 L65 55 L75 85 L50 65 L25 85 L35 55 L10 38 L40 38 Z" fill="#FEF08A" opacity="0.6" />
                </svg>
              ) : (
                <svg viewBox="0 0 100 100" className="drop-shadow-[0_0_15px_rgba(244,63,94,0.9)] w-full h-full">
                  <path d="M50 90 Q 0 45 10 15 A 20 20 0 0 1 50 30 A 20 20 0 0 1 90 15 Q 100 45 50 90 Z" fill="#F43F5E" stroke="#BE123C" strokeWidth="4" strokeLinejoin="round" />
                  <path d="M25 25 A 5 5 0 0 1 40 20" fill="none" stroke="#FDA4AF" strokeWidth="6" strokeLinecap="round" />
                </svg>
              )}
            </div>
          ))}

          <div
            ref={playerNodeRef}
            className="absolute bottom-[10%] z-20 pointer-events-none"
            style={{ 
               width: 'max(110px, min(24%, 180px))', 
               aspectRatio: '1', 
               left: `50%`, 
               transform: `translateX(-50%)`,
               willChange: 'left, transform'
            }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-2 bg-black/30 blur-sm rounded-[100%]" />
            <img 
               src="/pet-sprites/clawd-idle.svg" 
               alt="Clawd Player" 
               className="w-full h-full relative z-10 drop-shadow-md" 
               style={{ imageRendering: 'pixelated', filter: characterFilter }} 
               draggable={false} 
            />
          </div>
        </>
      )}

      {effects.map(e => (
        <div 
          key={e.id}
          className="absolute font-black text-4xl italic z-50 pointer-events-none tracking-tighter" 
          style={{ 
            left: `${e.x}%`, 
            top: `${e.y}%`, 
            transform: 'translate(-50%, -100%)',
            color: '#fff',
            textShadow: '0 4px 0 #db2777, 0 8px 20px rgba(219,39,119,0.8)',
            animation: 'pop-score 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
          }}
        >
          {e.emoji}
        </div>
      ))}

      {gameMode === false && timeLeft === 0 && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex flex-col justify-center items-center z-[120] animate-in fade-in duration-300 p-4">
          <div className="bg-[#12142b] border border-indigo-500/30 rounded-[2rem] p-8 md:p-12 shadow-2xl flex flex-col items-center animate-in zoom-in-95 w-full max-w-sm">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">游戏结束!</h2>
            <p className="text-xl md:text-2xl text-yellow-300 font-mono mb-8">最终得分: {score}</p>
            <button 
              onClick={startGame} 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl text-base md:text-lg shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95 transition-all"
            >
              🎮 再来一局
            </button>
            <button 
              onClick={() => {
                setTimeLeft(30); // 重置到初始状态（显示开始按钮）
                if (setIsPlaying) setIsPlaying(false); // 退出沉浸模式，恢复导航栏
              }} 
              className="w-full mt-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium px-8 py-3 rounded-xl text-sm md:text-base border border-white/10 active:scale-95 transition-all"
            >
              退出游戏
            </button>
          </div>
        </div>,
        document.body
      ) : null}

      <style>{`
        @keyframes star-twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        .star-anim { animation: star-twinkle infinite alternate; }
        
        @keyframes firefly-wander { 
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(20px, -15px); }
          66% { transform: translate(-10px, -25px); }
        }
        .firefly-anim { animation: firefly-wander infinite ease-in-out; }
        
        @keyframes pop-score {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5) translateY(20px); text-shadow: 0 0 0 #db2777; }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3) translateY(-40px); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1) translateY(-60px); }
        }
      `}</style>
    </div>
  );
}
