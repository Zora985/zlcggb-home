import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { CHARACTERS, TEMPLATE_CHARACTERS, type CharacterDef } from './characters';
import { PixelCharacter } from './PixelCharacter';
import { getCreations, svgToDataUri } from '../../lib/creatorStore';

interface CharacterSelectProps {
  currentId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function CharacterSelect({ currentId, onSelect, onClose }: CharacterSelectProps) {
  if (typeof document === 'undefined') return null;

  const myCharacters = getCreations('character');

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#12142b] border border-indigo-500/20 w-full max-w-lg sm:rounded-[2rem] rounded-t-[2rem] p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🎨</span> 选择角色
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-indigo-300/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-indigo-200/50 text-sm mb-4">
          选择你喜欢的角色和配色方案，切换后立即生效
        </p>

        {/* Clawd 配色变体 */}
        <h4 className="text-indigo-200/40 text-xs font-bold tracking-wider uppercase mb-2">🦀 Clawd 配色</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {CHARACTERS.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              isActive={currentId === char.id}
              onSelect={() => { onSelect(char.id); onClose(); }}
            />
          ))}
        </div>

        {/* 新造型角色 */}
        <h4 className="text-indigo-200/40 text-xs font-bold tracking-wider uppercase mb-2">✨ 独特造型</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TEMPLATE_CHARACTERS.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              isActive={currentId === char.id}
              onSelect={() => { onSelect(char.id); onClose(); }}
            />
          ))}
        </div>

        {myCharacters.length > 0 && (
          <>
            <h4 className="text-indigo-200/40 text-xs font-bold tracking-wider uppercase mb-2 mt-6">
              ✨ 我的创作（工坊）
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {myCharacters.map((c) => {
                const char: CharacterDef = {
                  id: `creator-${c.id}`,
                  name: c.name,
                  emoji: '✨',
                  description: c.description || 'AI 工坊',
                  bodyColor: '#6366f1',
                  sleepHeadColor: '#f97316',
                  svgData: c.svgData,
                };
                return (
                  <CharacterCard
                    key={c.id}
                    character={char}
                    isActive={currentId === char.id}
                    onSelect={() => { onSelect(char.id); onClose(); }}
                  />
                );
              })}
            </div>
          </>
        )}

        <div className="mt-6 pt-4 border-t border-white/5">
          <p className="text-indigo-200/30 text-xs text-center">
            更多角色造型持续更新中...
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CharacterCard({ character, isActive, onSelect }: {
  character: CharacterDef;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`
        relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 border
        ${isActive
          ? 'bg-indigo-500/20 border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.2)] scale-[1.02]'
          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15 active:scale-95'
        }
      `}
    >
      {isActive && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
      )}

      {/* 角色预览 */}
      <div className="w-16 h-16 flex items-center justify-center">
        {character.svgData ? (
          <img
            src={svgToDataUri(character.svgData)}
            alt={character.name}
            className="w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />
        ) : character.template ? (
          <PixelCharacter
            template={character.template}
            state="idle"
            color={character.bodyColor}
            className="w-full h-full"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <img
            src="/pet-sprites/clawd-idle.svg"
            alt={character.name}
            className="w-full h-full"
            style={{ imageRendering: 'pixelated', filter: character.filter }}
            draggable={false}
          />
        )}
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <span className="text-base">{character.emoji}</span>
          <span className="text-white text-sm font-bold">{character.name}</span>
        </div>
        <p className="text-indigo-200/40 text-[10px] leading-tight">{character.description}</p>
      </div>

      {/* 颜色条预览 */}
      <div
        className="w-8 h-1.5 rounded-full"
        style={{ backgroundColor: character.bodyColor }}
      />
    </button>
  );
}
