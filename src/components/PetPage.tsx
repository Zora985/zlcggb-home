import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePetState } from './pet/usePetState';
import { PetHUD } from './pet/PetHUD';
import { RoomNavigation } from './pet/RoomNavigation';
import { PetEngine } from './pet/PetEngine';

// Rooms
import { LivingRoom } from './pet/LivingRoom';
import { Kitchen } from './pet/Kitchen';
import { Bathroom } from './pet/Bathroom';
import { Bedroom } from './pet/Bedroom';
import { Playground } from './pet/Playground';

export default function PetPage() {
  const { state, emotion, updateStats, changeRoom } = usePetState();
  const [isLoaded, setIsLoaded] = useState(false);
  const [petX, setPetX] = useState(50);
  const [flipX, setFlipX] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout>>();

  const DEFAULT_SCROLL_RATIO: Record<string, number> = {
    living_room: 1.0,  // 偏向电视机(靠右)
    kitchen: 0.8,      // 偏向冰箱
    bathroom: 0.8,     // 偏向浴缸
    bedroom: 1.0,      // 偏向小床
    playground: 0.5    // 游乐场居中
  };

  // 房间切换时重置位置，并让移动端全景自动平滑滚动到保存的位置或默认最佳位置
  useEffect(() => {
    setPetX(50);
    setFlipX(false);
    setIsWalking(false);

    if (scrollContainerRef.current) {
      setTimeout(() => {
        const el = scrollContainerRef.current;
        if (el) {
          const savedScrolls = JSON.parse(localStorage.getItem('pet_room_scrolls') || '{}');
          const maxScroll = el.scrollWidth - el.clientWidth;
          
          let targetRatio = savedScrolls[state.currentRoom];
          if (typeof targetRatio !== 'number') {
            targetRatio = DEFAULT_SCROLL_RATIO[state.currentRoom] ?? 0.5;
          }
          
          // 对平滑滚动进行定位
          el.scrollTo({
            left: maxScroll * targetRatio,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [state.currentRoom]);

  // 监听用户滚动，防抖并持久化保存每个房间的浏览偏好
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    
    const ratio = el.scrollLeft / maxScroll;
    
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const saved = JSON.parse(localStorage.getItem('pet_room_scrolls') || '{}');
      saved[state.currentRoom] = ratio;
      localStorage.setItem('pet_room_scrolls', JSON.stringify(saved));
    }, 300); // 滑动停滞 300ms 后落盘
  }, [state.currentRoom]);

  // =============== 交互行为处理 ===============
  const handleFeed = useCallback((nutrition: number, moodBns: number, dropX: number) => {
    // 只有在距离较远时才改变朝向并设置行走状态，防止在原地抽搐
    if (Math.abs(dropX - petX) > 2) {
      setFlipX(dropX < petX);
      setIsWalking(true);
      setPetX(dropX);
    }
    
    // 食物落地约需 1200ms，落地后宠物将其吃掉，触发状态增加
    setTimeout(() => {
      setIsWalking(false);
      // 使用 updater 函数以获取最新的 prev state，避免闭包读取旧状态导致的 `吃完没增加` BUG
      updateStats(prev => ({
        hunger: prev.hunger + nutrition,
        mood: prev.mood + moodBns,
        isSleeping: false
      }));
    }, 1200);
  }, [petX, updateStats]);

  const handleClean = useCallback(() => {
    updateStats({ hygiene: 100, mood: state.mood + 10 });
  }, [state.mood, updateStats]);

  const handleSleepToggle = useCallback(() => {
    if (!state.isSleeping) {
      // 动画: 乖乖走向床，准备盖被子睡觉
      setIsWalking(true);
      setFlipX(false);
      setPetX(75); // 走到画面靠右的床铺位置
      
      const walkTime = Math.abs(75 - petX) * 40;
      setTimeout(() => {
        setIsWalking(false);
        updateStats({ isSleeping: true }); // 抵达床边后关灯上床
      }, walkTime + 300); // 稍微停滞 0.3s 作为准备爬上床的表现
    } else {
      // 起床: 亮灯并站在床边
      updateStats({ isSleeping: false });
    }
  }, [state.isSleeping, updateStats, petX]);

  const handlePlayResult = useCallback((score: number) => {
    const bonus = Math.min(score * 2, 40);
    updateStats({
      hunger: Math.max(0, state.hunger - 10), // 玩游戏消耗饥饿
      mood: state.mood + bonus,
      energy: Math.max(0, state.energy - 15)  // 玩游戏消耗体力
    });
  }, [state, updateStats]);


  // =============== 自由走动逻辑 ===============
  const handleSceneClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // 如果在游戏区，交由 Playground 内部处理；如果睡着了不能走
    if (state.currentRoom === 'playground' || state.isSleeping) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
    
    setFlipX(clickX < petX);
    setIsWalking(true);
    setPetX(clickX);
    
    const walkTime = Math.abs(clickX - petX) * 40;
    setTimeout(() => setIsWalking(false), walkTime);
  }, [petX, state.isSleeping, state.currentRoom]);

  // 渲染当前房间背景及专属交互
  const renderRoom = () => {
    switch (state.currentRoom) {
      case 'living_room': 
        return <LivingRoom />;
      case 'kitchen': 
        return <Kitchen onFeed={handleFeed} isSleeping={state.isSleeping} petX={petX} />;
      case 'bathroom': 
        return <Bathroom onClean={handleClean} hygiene={state.hygiene} />;
      case 'bedroom': 
        return <Bedroom onSleepToggle={handleSleepToggle} isSleeping={state.isSleeping} />;
      case 'playground': 
        return <Playground onPlayResult={handlePlayResult} petX={petX} setPetX={setPetX} setFlip={setFlipX} setIsWalking={setIsWalking} setIsPlaying={setIsPlaying} />;
      default: 
        return <LivingRoom />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#0b0e14] font-sans text-white selection:bg-indigo-500/30 overflow-hidden flex flex-col items-center">
      
      {/* 提供全局的 Portal 挂载点，能够绝对覆盖整个页面区域，完美支持游戏计分板驻留屏幕边缘 */}
      <div id="scene-ui-portal" className="absolute inset-0 z-[100] pointer-events-none" />

      {/* 退出按钮返回主站 */}
      <button 
        onClick={() => navigate('/')} 
        className={`absolute top-4 left-4 md:top-6 md:left-6 z-[70] p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white backdrop-blur-md transition-all duration-700 border border-white/5 shadow-xl ${isPlaying ? 'opacity-0 -translate-y-[150%] pointer-events-none' : 'opacity-100 translate-y-0'}`}
        title="返回主页"
      >
        <ArrowLeft size={20} />
      </button>

      {/* 核心容器层：强制约束为视口高度，禁止滚动 */}
      <div className={`w-full max-w-[1000px] h-[100dvh] px-2 md:px-6 mx-auto flex flex-col justify-between gap-3 md:gap-4 relative transition-all duration-700 ease-in-out ${isPlaying ? 'pt-0 pb-0' : 'pt-16 md:pt-6 pb-24'}`}>
        
        {/* ================= 顶部 HUD ================= */}
        <div className={`flex-none w-full transition-all duration-[800ms] overflow-hidden origin-top ${isPlaying ? 'max-h-0 opacity-0 -translate-y-8' : 'max-h-[300px] opacity-100 translate-y-0'}`}>
          <div className={`transition-all duration-1000 delay-100 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <PetHUD state={state} emotion={emotion} />
          </div>
        </div>

        {/* ================= 主场景区 (响应式按宽高比适配，手机上可横向滑动浏览全景) ================= */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 w-full min-h-0 overflow-x-auto overflow-y-hidden snap-x snap-mandatory relative scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div className="h-full min-w-full w-max flex justify-center">
            <div 
              className={`relative h-full rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-black/50 transition-all duration-1000 delay-200 flex-none snap-center ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'}`}
              style={{ aspectRatio: '16/9', width: 'auto' }}
              onClick={handleSceneClick}
            >
          {/* 渲染具体的场景 SVG 和交互 */}
          <div className={`absolute inset-0 transition-opacity duration-500`}>
            {renderRoom()}
          </div>

          {/* 核心宠物引擎 (在卧室睡觉时由于在被子里，所以实体隐形。游戏区由内部自行渲染实体) */}
          {!(state.currentRoom === 'bedroom' && state.isSleeping) && state.currentRoom !== 'playground' && (
            <PetEngine 
              emotion={emotion}
              x={petX}
              flipX={flipX}
              isWalking={isWalking}
              size={18}
            />
          )}

          {/* 暗角滤镜：增加屏幕内沉浸感立体度 */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.7)] mix-blend-multiply" />
          </div>
          </div>
        </div>

        {/* ================= 操作提示语 ================= */}
        <div className={`flex-none text-center transition-all duration-[800ms] overflow-hidden origin-bottom ${isPlaying ? 'max-h-0 opacity-0 translate-y-8' : 'max-h-[100px] opacity-100 translate-y-0 delay-300'}`}>
          <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-indigo-200/50 text-xs md:text-sm font-medium tracking-wide">
              {state.currentRoom === 'living_room' && '💡 点击地板引导 Clawd 走动'}
              {state.currentRoom === 'kitchen' && '🍖 点击冰箱打开门，选择食物拖给 Clawd'}
              {state.currentRoom === 'bathroom' && '🚿 点击顶部的花洒给 Clawd 洗澡'}
              {state.currentRoom === 'bedroom' && '🌙 点击床头柜上的小黄鸭台灯关灯睡觉'}
              {state.currentRoom === 'playground' && '🎮 控制 Clawd 左右移动，接取天上掉落的星星'}
            </p>
          </div>
        </div>
      </div>

      {/* ================= 底部导航条 ================= */}
      <div className={`transition-transform duration-[800ms] ease-in-out absolute w-full bottom-0 left-0 z-[80] ${isPlaying ? 'translate-y-[150%] pointer-events-none' : 'translate-y-0'}`}>
        <RoomNavigation 
          currentRoom={state.currentRoom}
          onChangeRoom={(room) => {
            if (state.isSleeping) updateStats({ isSleeping: false });
            changeRoom(room);
          }}
        />
      </div>
    </div>
  );
}
