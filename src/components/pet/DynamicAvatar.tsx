import { useRef } from 'react';
import { AvatarConfig } from './AvatarConfig';
import { useCharacterAnim, CharacterActionState } from './useCharacterAnim';

export function DynamicAvatar({
  config,
  state = 'idle',
  className = ''
}: {
  config: AvatarConfig;
  state?: CharacterActionState;
  className?: string;
}) {
  const rootRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);
  const tailRef = useRef<SVGGElement>(null);
  const earLRef = useRef<SVGGElement>(null);
  const earRRef = useRef<SVGGElement>(null);
  const eyesGroupRef = useRef<SVGGElement>(null);
  const pupilLRef = useRef<SVGCircleElement>(null);
  const pupilRRef = useRef<SVGCircleElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);

  useCharacterAnim(state, {
    rootRef, bodyRef, shadowRef, tailRef, earLRef, earRRef,
    eyesGroupRef, pupilLRef, pupilRRef, mouthRef
  }, config.personality === 'energetic' ? 1.5 : config.personality === 'chill' ? 0.7 : 1);

  const renderEars = () => {
    switch (config.earStyle) {
      case 'floppy':
        return (
          <>
            <g ref={earLRef}><path d="M 4 4 Q -1 8 2 12" fill="none" stroke={config.baseColor} strokeWidth="2.5" strokeLinecap="round" /></g>
            <g ref={earRRef}><path d="M 11 4 Q 16 8 13 12" fill="none" stroke={config.baseColor} strokeWidth="2.5" strokeLinecap="round" /></g>
          </>
        );
      case 'pointy':
        return (
          <>
            <g ref={earLRef}><polygon points="4,5 7,4 3,0" fill={config.baseColor} /></g>
            <g ref={earRRef}><polygon points="11,5 8,4 12,0" fill={config.baseColor} /></g>
          </>
        );
      case 'round':
        return (
          <>
            <g ref={earLRef}><circle cx="3" cy="2" r="2.5" fill={config.baseColor} /></g>
            <g ref={earRRef}><circle cx="12" cy="2" r="2.5" fill={config.baseColor} /></g>
          </>
        );
      default: return null;
    }
  };

  const renderTail = () => {
    switch (config.tailStyle) {
      case 'long':
        return <g ref={tailRef}><path d="M 2 12 Q -6 14 -3 5" fill="none" stroke={config.baseColor} strokeWidth="3" strokeLinecap="round" /></g>;
      case 'stubby':
        return <g ref={tailRef}><path d="M 2 12 Q -2 14 0 10" fill="none" stroke={config.baseColor} strokeWidth="3.5" strokeLinecap="round" /></g>;
      case 'fluffy':
         return <g ref={tailRef}><circle cx="-2" cy="11" r="3" fill={config.baseColor} /></g>;
      default: return null;
    }
  };

  const renderEyes = () => {
    const eyeColor = "#333333";
    switch (config.eyeStyle) {
      case 'dots':
        return (
          <g ref={eyesGroupRef}>
            <circle ref={pupilLRef} cx="4.5" cy="7" r="1.2" fill={eyeColor} />
            <circle ref={pupilRRef} cx="10.5" cy="7" r="1.2" fill={eyeColor} />
          </g>
        );
      case 'cute':
        return (
          <g ref={eyesGroupRef}>
            <circle cx="4.5" cy="7" r="1.5" fill={eyeColor} />
            <circle ref={pupilLRef} cx="4.8" cy="6.5" r="0.5" fill="#FFF" />
            <circle cx="10.5" cy="7" r="1.5" fill={eyeColor} />
            <circle ref={pupilRRef} cx="10.8" cy="6.5" r="0.5" fill="#FFF" />
          </g>
        );
      case 'sleepy':
        return (
          <g ref={eyesGroupRef}>
            <path d="M 3 7 Q 4.5 9 6 7" fill="none" stroke={eyeColor} strokeWidth="1" strokeLinecap="round" />
            <path d="M 9 7 Q 10.5 9 12 7" fill="none" stroke={eyeColor} strokeWidth="1" strokeLinecap="round" />
          </g>
        );
      case 'goggles':
        return (
          <g ref={eyesGroupRef}>
            <circle cx="4.5" cy="7" r="2" fill="none" stroke={eyeColor} strokeWidth="1.2" />
            <circle cx="10.5" cy="7" r="2" fill="none" stroke={eyeColor} strokeWidth="1.2" />
            <path d="M 6.5 7 L 8.5 7" stroke={eyeColor} strokeWidth="1.2" />
          </g>
        );
      case 'cyclops':
        return (
          <g ref={eyesGroupRef}>
            <circle cx="7.5" cy="7" r="2" fill={eyeColor} />
            <circle cx="8" cy="6" r="0.8" fill="#FFF" />
          </g>
        );
      default: return null;
    }
  };

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="-10 -15 35 35" 
      className={`w-full h-full overflow-visible ${className}`}
    >
      <defs>
        <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
        </filter>
      </defs>

      {/* Ground Shadow */}
      <ellipse ref={shadowRef} cx="7.5" cy="16" rx="9" ry="1.5" fill="#000" opacity="0.15" filter="url(#soft-shadow)" />

      <g ref={rootRef}>
        <g ref={bodyRef}>
          {renderTail()}
          
          {/* Main Body (Bean / Blob) */}
          <path 
            d="M 2 13 C 0 8, 2 3, 7.5 3 C 13 3, 15 8, 13 13 C 12 16, 3 16, 2 13 Z" 
            fill={config.baseColor} 
          />
          
          {/* Belly/Snout Accent */}
          <ellipse 
            cx="7.5" cy="11" rx="4.5" ry="3" 
            fill={config.accentColor} opacity="0.8" 
          />

          {renderEars()}
          {renderEyes()}
          
          {/* Tiny Mouth */}
          <path ref={mouthRef} d="M 6.5 10 Q 7.5 11.5 8.5 10" fill="none" stroke="#666" strokeWidth="0.8" strokeLinecap="round" />
          
          {/* Blush */}
          <circle cx="2.5" cy="9" r="1.2" fill={config.accentColor} opacity="0.7" />
          <circle cx="12.5" cy="9" r="1.2" fill={config.accentColor} opacity="0.7" />
        </g>
      </g>
    </svg>
  );
}
