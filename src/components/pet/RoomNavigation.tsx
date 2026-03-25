import React from 'react';
import { RoomId } from './usePetState';
import { Home, Utensils, Droplet, Moon, Gamepad2 } from 'lucide-react';

interface RoomNavigationProps {
  currentRoom: RoomId;
  onChangeRoom: (room: RoomId) => void;
  disabled?: boolean;
}

export function RoomNavigation({ currentRoom, onChangeRoom, disabled }: RoomNavigationProps) {
  const rooms: { id: RoomId; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'living_room', label: '起居室', icon: <Home size={20} />, color: 'hover:text-amber-400' },
    { id: 'kitchen', label: '厨房', icon: <Utensils size={20} />, color: 'hover:text-orange-400' },
    { id: 'bathroom', label: '浴室', icon: <Droplet size={20} />, color: 'hover:text-cyan-400' },
    { id: 'bedroom', label: '卧室', icon: <Moon size={20} />, color: 'hover:text-indigo-400' },
    { id: 'playground', label: '游戏区', icon: <Gamepad2 size={20} />, color: 'hover:text-emerald-400' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-[#0f1123]/90 backdrop-blur-xl rounded-full p-2 flex items-center gap-2 border border-white/10 shadow-2xl shadow-indigo-900/40">
        {rooms.map((room) => {
          const isActive = currentRoom === room.id;
          return (
            <button
              key={room.id}
              onClick={() => onChangeRoom(room.id)}
              disabled={disabled}
              className={`
                group relative flex items-center justify-center h-12 px-5 rounded-full transition-all duration-300
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
                <span className="ml-2.5 text-sm font-medium tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 max-w-[80px] opacity-100">
                  {room.label}
                </span>
              )}

              {/* 指示光点 */}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
