import React from 'react';
import { RoomId } from './usePetState';
import { Home, Utensils, Droplet, Moon, Gamepad2, Wand2 } from 'lucide-react';

interface RoomNavigationProps {
  currentRoom: RoomId;
  onChangeRoom: (room: RoomId) => void;
  disabled?: boolean;
}

const ICON_CLS = 'w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]';

export function RoomNavigation({ currentRoom, onChangeRoom, disabled }: RoomNavigationProps) {
  const rooms: { id: RoomId; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'living_room', label: '起居', icon: <Home className={ICON_CLS} />, color: 'hover:text-amber-400' },
    { id: 'kitchen', label: '厨房', icon: <Utensils className={ICON_CLS} />, color: 'hover:text-orange-400' },
    { id: 'bathroom', label: '浴室', icon: <Droplet className={ICON_CLS} />, color: 'hover:text-cyan-400' },
    { id: 'bedroom', label: '卧室', icon: <Moon className={ICON_CLS} />, color: 'hover:text-indigo-400' },
    { id: 'playground', label: '游戏', icon: <Gamepad2 className={ICON_CLS} />, color: 'hover:text-emerald-400' },
    { id: 'workshop', label: '工坊', icon: <Wand2 className={ICON_CLS} />, color: 'hover:text-purple-400' },
  ];

  return (
    <div className="fixed bottom-2 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-12px)]">
      <div className="bg-[#0f1123]/92 backdrop-blur-xl rounded-full p-1 sm:p-1.5 md:p-2 flex items-center gap-0.5 sm:gap-1 md:gap-1.5 border border-white/10 shadow-2xl shadow-indigo-900/40">
        {rooms.map((room) => {
          const isActive = currentRoom === room.id;
          return (
            <button
              key={room.id}
              onClick={() => onChangeRoom(room.id)}
              disabled={disabled}
              className={`
                group relative flex items-center justify-center
                h-7 px-2 sm:h-9 sm:px-3 md:h-10 md:px-4
                rounded-full transition-all duration-300
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isActive
                  ? 'bg-white/10 text-white shadow-inner border border-white/5'
                  : `text-indigo-300/50 hover:bg-white/5 ${room.color}`
                }
              `}
              title={room.label}
            >
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {room.icon}
              </div>

              {isActive && (
                <span className="ml-1 sm:ml-1.5 md:ml-2 text-[9px] sm:text-[10px] md:text-xs font-medium tracking-wide whitespace-nowrap">
                  {room.label}
                </span>
              )}

              {isActive && (
                <div className="absolute -bottom-0.5 sm:-bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
