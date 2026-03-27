import { useState } from 'react';
import { createPortal } from 'react-dom';
import { PetState, Emotion } from './usePetState';
import { HelpCircle, X, Palette } from 'lucide-react';

interface PetHUDProps {
  state: PetState;
  emotion: Emotion;
  onOpenCharacterSelect?: () => void;
}

export function PetHUD({ state, emotion, onOpenCharacterSelect }: PetHUDProps) {
  const [showGuide, setShowGuide] = useState(false);

  const emotionInfo = {
    happy: { emoji: '😊', text: '开心' },
    normal: { emoji: '😐', text: '一般' },
    sad: { emoji: '😢', text: '难过' },
    sleeping: { emoji: '😴', text: '呼噜噜...' },
    dizzy: { emoji: '😵', text: '不舒服' },
  };

  return (
    <>
      <div className="w-full flex flex-col md:flex-row gap-2.5 md:gap-4 justify-between items-stretch md:items-center">
        {/* 宠物名牌与心情 */}
        <div className="flex justify-center md:justify-start">
          <div className="bg-[#1a1a2e]/80 backdrop-blur-md rounded-2xl px-3 md:px-4 py-1.5 md:py-3 border border-indigo-500/20 shadow-lg flex items-center justify-center gap-2 md:gap-3 min-w-[180px]">
            <span className="text-orange-300 font-bold font-mono tracking-wider text-sm md:text-base">🦀 CLAWD</span>
            <div className="w-px h-3 md:h-6 bg-white/10" />
            <span className="text-base md:text-xl">{emotionInfo[emotion].emoji}</span>
            <span className="text-indigo-200 text-xs md:text-sm font-medium">{emotionInfo[emotion].text}</span>
            
            <button 
              onClick={onOpenCharacterSelect}
              className="ml-1 p-1 md:p-1.5 rounded-full text-indigo-300/60 hover:text-white hover:bg-white/10 transition-colors"
              title="更换角色"
            >
              <Palette size={16} />
            </button>
            <button 
              onClick={() => setShowGuide(true)}
              className="p-1 md:p-1.5 rounded-full text-indigo-300/60 hover:text-white hover:bg-white/10 transition-colors"
              title="查看指南"
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </div>

        {/* 四大属性条 (移动端展示更为紧凑宽敞的2x2网格) */}
        <div className="flex-1 w-full max-w-2xl grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-4">
          <StatusBar label="饥饿" emoji="🍖" value={state.hunger} color="#f59e0b" />
          <StatusBar label="清洁" emoji="🛁" value={state.hygiene} color="#06b6d4" />
          <StatusBar label="心情" emoji="💛" value={state.mood} color="#ec4899" />
          <StatusBar label="体力" emoji="⚡" value={state.energy} color="#22c55e" />
        </div>
      </div>

      {/* 帮助指南弹窗 (使用 Portal 脱离 transform 限制，确保全局覆盖) */}
      {showGuide && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#12142b] border border-indigo-500/30 w-full max-w-md rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 p-2 text-indigo-300/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-2xl">📖</span> 护理指南
            </h3>
            <p className="text-sm md:text-base text-indigo-200/80 mb-6 leading-relaxed">
              当任何一项指标<strong className="text-red-400">低于 20%</strong> 时，Clawd 会感到<strong className="text-white">「不舒服」</strong>。请前往底部各个房间照顾它：
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-white/5 p-3 md:p-4 rounded-2xl border border-white/5">
                <div className="text-xl md:text-2xl">🍖</div>
                <div>
                  <h4 className="text-sm md:text-base font-bold text-orange-300 mb-0.5">饥饿 (去厨房)</h4>
                  <p className="text-xs md:text-sm text-indigo-200/60">点击打开冰箱门，点击存放的肉获取食物喂饱它。</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-white/5 p-3 md:p-4 rounded-2xl border border-white/5">
                <div className="text-xl md:text-2xl">🛁</div>
                <div>
                  <h4 className="text-sm md:text-base font-bold text-cyan-300 mb-0.5">清洁 (去浴室)</h4>
                  <p className="text-xs md:text-sm text-indigo-200/60">点击顶部的淋浴花洒，为它洗个舒舒服服的澡。</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 p-3 md:p-4 rounded-2xl border border-white/5">
                <div className="text-xl md:text-2xl">💛</div>
                <div>
                  <h4 className="text-sm md:text-base font-bold text-pink-400 mb-0.5">心情 (去游戏区)</h4>
                  <p className="text-xs md:text-sm text-indigo-200/60">接住天上掉落的星星，但玩耍会消耗一定体力和饥饿。</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 p-3 md:p-4 rounded-2xl border border-white/5">
                <div className="text-xl md:text-2xl">⚡</div>
                <div>
                  <h4 className="text-sm md:text-base font-bold text-green-400 mb-0.5">体力 (去卧室)</h4>
                  <p className="text-xs md:text-sm text-indigo-200/60">点击床头柜的小黄鸭台灯关灯，让它睡一觉恢复体力。</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 text-white font-bold rounded-xl transition-all active:scale-95 text-sm md:text-base"
            >
              我知道了
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function StatusBar({ label, emoji, value, color }: { label: string; emoji: string; value: number; color: string }) {
  const v = Math.max(0, Math.min(100, value));
  const isWarning = v <= 20;

  return (
    <div className="bg-[#1a1a2e]/60 backdrop-blur-sm rounded-xl p-1.5 md:p-3 border border-white/5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1 md:mb-2 px-0.5">
        <div className="flex items-center gap-1 md:gap-1.5">
          <span className="text-xs md:text-base">{emoji}</span>
          <span className="text-indigo-200/70 text-[10px] md:text-xs font-medium">{label}</span>
        </div>
        <span className={`text-[9.5px] md:text-xs font-mono tabular-nums ${isWarning ? 'text-red-400 font-bold' : 'text-indigo-200/50'}`}>
          {Math.round(v)}%
        </span>
      </div>
      <div className="h-1.5 md:h-2 w-full bg-black/40 rounded-full overflow-hidden p-[1px]">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${isWarning ? 'animate-pulse' : ''}`}
          style={{ 
            width: `${v}%`, 
            backgroundColor: color, 
            boxShadow: `0 0 10px ${color}60` 
          }}
        />
      </div>
    </div>
  );
}
