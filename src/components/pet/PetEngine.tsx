import { useEffect, useState, useMemo } from 'react';
import { Emotion } from './usePetState';
import { PixelCharacter, type CharacterTemplate, type CharacterAnimState } from './PixelCharacter';
import { svgToDataUri } from '../../lib/creatorStore';

interface PetEngineProps {
  emotion: Emotion;
  x: number;             // 0-100% position
  flipX: boolean;
  isWalking: boolean;
  customSpriteUrl?: string | null;
  customSvgData?: string | null;
  size?: number;         // percentage size relative to height, default 18
  characterFilter?: string;
  characterTemplate?: CharacterTemplate;
  characterColor?: string;
  className?: string;
  onClick?: () => void;
}

const SPRITES: Record<string, string> = {
  idle: '/pet-sprites/clawd-idle.svg',
  happy: '/pet-sprites/clawd-happy.svg',
  sad: '/pet-sprites/clawd-dizzy.svg',
  sleeping: '/pet-sprites/clawd-sleeping.svg',
  dizzy: '/pet-sprites/clawd-dizzy.svg',
  walking: '/pet-sprites/clawd-walking.svg',
  typing: '/pet-sprites/clawd-typing.svg',
  notification: '/pet-sprites/clawd-notification.svg',
};

function getSpriteForEmotion(emotion: Emotion, isWalking: boolean): string {
  if (isWalking) return SPRITES.walking;
  switch (emotion) {
    case 'happy': return SPRITES.happy;
    case 'sad': return SPRITES.sad;
    case 'dizzy': return SPRITES.dizzy;
    case 'sleeping': return SPRITES.sleeping;
    case 'normal':
    default: return SPRITES.idle;
  }
}

function getAnimState(emotion: Emotion, isWalking: boolean): CharacterAnimState {
  if (isWalking) return 'walking';
  switch (emotion) {
    case 'happy': return 'happy';
    case 'sad':
    case 'dizzy': return 'dizzy';
    case 'sleeping': return 'sleeping';
    default: return 'idle';
  }
}

export function PetEngine({
  emotion,
  x,
  flipX,
  isWalking,
  customSpriteUrl,
  customSvgData,
  size = 18,
  characterFilter,
  characterTemplate,
  characterColor,
  className = '',
  onClick
}: PetEngineProps) {
  const [spriteUrl, setSpriteUrl] = useState(SPRITES.idle);

  useEffect(() => {
    if (customSvgData) return;
    if (customSpriteUrl) {
      setSpriteUrl(customSpriteUrl);
    } else {
      setSpriteUrl(getSpriteForEmotion(emotion, isWalking));
    }
  }, [emotion, isWalking, customSpriteUrl, customSvgData]);

  const animState = useMemo(() => getAnimState(emotion, isWalking), [emotion, isWalking]);

  return (
    <div
      onClick={onClick}
      className={`absolute bottom-[10%] z-20 ${
        onClick ? 'cursor-pointer pointer-events-auto' : 'pointer-events-none'
      } ${className}`}
      style={{
        left: `${x}%`,
        transform: `translateX(-50%) scaleX(${flipX ? -1 : 1})`,
        transitionProperty: 'left',
        transitionTimingFunction: 'linear',
        transitionDuration: isWalking ? '2s' : '0.3s',
        width: `max(110px, min(${size + 6}%, 200px))`,
        aspectRatio: '1',
      }}
    >
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-2 bg-black/30 blur-sm rounded-[100%]"
        style={{ transform: `scaleX(${isWalking ? 1.1 : 1})`, transition: 'transform 0.3s' }}
      />

      {customSvgData ? (
        <img
          src={svgToDataUri(customSvgData)}
          alt="Custom pet"
          className="w-full h-full relative z-10 drop-shadow-md"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />
      ) : characterTemplate && characterColor ? (
        <PixelCharacter
          template={characterTemplate}
          state={animState}
          color={characterColor}
          className="w-full h-full relative z-10 drop-shadow-md"
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        <img
          src={spriteUrl}
          alt="Clawd the pixel crab"
          className="w-full h-full relative z-10 drop-shadow-md"
          style={{ imageRendering: 'pixelated', filter: characterFilter }}
          draggable={false}
        />
      )}
    </div>
  );
}
