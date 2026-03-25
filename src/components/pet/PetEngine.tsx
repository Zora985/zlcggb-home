import { useEffect, useState } from 'react';
import { Emotion } from './usePetState';

interface PetEngineProps {
  emotion: Emotion;
  x: number;             // 0-100% position
  flipX: boolean;
  isWalking: boolean;
  customSpriteUrl?: string | null; // Optional override for specific animations
  size?: number;         // percentage size relative to height, default 18
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

export function PetEngine({
  emotion,
  x,
  flipX,
  isWalking,
  customSpriteUrl,
  size = 18,
  className = '',
  onClick
}: PetEngineProps) {
  const [spriteUrl, setSpriteUrl] = useState(SPRITES.idle);

  // Smoothly update sprite mapping
  useEffect(() => {
    if (customSpriteUrl) {
      setSpriteUrl(customSpriteUrl);
    } else {
      setSpriteUrl(getSpriteForEmotion(emotion, isWalking));
    }
  }, [emotion, isWalking, customSpriteUrl]);

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
      {/* 宠物阴影 */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-2 bg-black/30 blur-sm rounded-[100%]"
        style={{ transform: `scaleX(${isWalking ? 1.1 : 1})`, transition: 'transform 0.3s' }}
      />
      
      {/* 宠物本体 SVG */}
      <img
        src={spriteUrl}
        alt="Clawd the pixel crab"
        className="w-full h-full relative z-10 drop-shadow-md"
        style={{ imageRendering: 'pixelated' }}
        draggable={false}
      />
    </div>
  );
}
