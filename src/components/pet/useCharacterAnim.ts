import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export type CharacterActionState = 'idle' | 'walk' | 'happy' | 'sleep' | 'sad' | 'eat';

export interface AnimRefs {
  rootRef: React.RefObject<SVGGElement>;
  bodyRef: React.RefObject<SVGGElement>;
  shadowRef: React.RefObject<SVGEllipseElement>;
  tailRef: React.RefObject<SVGGElement>;
  earLRef: React.RefObject<SVGGElement>;
  earRRef: React.RefObject<SVGGElement>;
  eyesGroupRef: React.RefObject<SVGGElement>;
  pupilLRef: React.RefObject<SVGCircleElement>;
  pupilRRef: React.RefObject<SVGCircleElement>;
  mouthRef: React.RefObject<SVGPathElement>;
}

export function useCharacterAnim(
  state: CharacterActionState,
  refs: AnimRefs,
  baseSpeed: number = 1 // 1 for normal, <1 for chill, >1 for energetic
) {
  useGSAP(() => {
    // 1. Kill all current animations to prevent conflicts
    const allTargets = [
      refs.rootRef.current, refs.bodyRef.current, refs.shadowRef.current,
      refs.tailRef.current, refs.earLRef.current, refs.earRRef.current,
      refs.eyesGroupRef.current, refs.pupilLRef.current, refs.pupilRRef.current,
      refs.mouthRef.current
    ];
    gsap.killTweensOf(allTargets);

    // Default resting states reset
    gsap.set(allTargets, { clearProps: "all" });

    // Pivot points for specific joints
    gsap.set(refs.bodyRef.current, { transformOrigin: "7.5px 15px" });
    gsap.set(refs.tailRef.current, { transformOrigin: "0px 10px" });
    gsap.set(refs.earLRef.current, { transformOrigin: "3px 4px" });
    gsap.set(refs.earRRef.current, { transformOrigin: "12px 4px" });
    gsap.set(refs.shadowRef.current, { transformOrigin: "7.5px 16px" });
    gsap.set(refs.eyesGroupRef.current, { transformOrigin: "7.5px 7px" });

    switch (state) {
      case 'idle':
        // Breathing: body expands/contracts, moves up/down slightly
        gsap.to(refs.bodyRef.current, {
          scaleY: 0.95,
          scaleX: 1.02,
          y: 0.5,
          duration: 1.5 / baseSpeed,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        gsap.to(refs.shadowRef.current, {
          scaleX: 0.9,
          opacity: 0.2,
          duration: 1.5 / baseSpeed,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        // Slow wag
        if (refs.tailRef.current) {
          gsap.to(refs.tailRef.current, {
            rotation: 15,
            duration: 1.5 / baseSpeed,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
        }
        // Occasional blinking
        gsap.to(refs.eyesGroupRef.current, {
          scaleY: 0.1,
          duration: 0.1,
          repeat: -1,
          repeatDelay: 4,
          yoyo: true
        });
        break;

      case 'happy':
        // Bouncing fast
        gsap.to(refs.bodyRef.current, {
          y: -4,
          scaleY: 1.05,
          scaleX: 0.95,
          duration: 0.3 / baseSpeed,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut"
        });
        // Fast tail wag
        if (refs.tailRef.current) {
          gsap.to(refs.tailRef.current, {
            rotation: 35,
            duration: 0.15,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
        }
        // Wide eyes / happy eyes
        gsap.to(refs.eyesGroupRef.current, {
          y: -1,
          duration: 0.2
        });
        break;

      case 'sleep':
        // Sunk down
        gsap.to(refs.bodyRef.current, {
          scaleY: 0.85,
          scaleX: 1.1,
          y: 2,
          duration: 2.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        gsap.to(refs.eyesGroupRef.current, {
          scaleY: 0.1,
          y: 2,
          duration: 0.5
        });
        if (refs.tailRef.current) {
          gsap.to(refs.tailRef.current, {
            rotation: -20,
            y: 2,
            duration: 1
          });
        }
        if (refs.earLRef.current) gsap.to(refs.earLRef.current, { rotation: -30, duration: 1 });
        if (refs.earRRef.current) gsap.to(refs.earRRef.current, { rotation: 30, duration: 1 });
        break;

      case 'walk':
        // Rocking side to side
        gsap.to(refs.bodyRef.current, {
          rotation: 5,
          y: -2,
          duration: 0.4 / baseSpeed,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
        // Opposite rocking for tail to counter-balance
        if (refs.tailRef.current) {
          gsap.to(refs.tailRef.current, {
            rotation: -5,
            duration: 0.4 / baseSpeed,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
        }
        break;
        
      case 'eat':
        // Biting motion (body lurches forward/down, mouth opens)
        const eatTl = gsap.timeline({ repeat: -1 });
        eatTl.to(refs.bodyRef.current, { scaleY: 0.9, y: 1, duration: 0.2, ease: "power1.out" })
             .to(refs.bodyRef.current, { scaleY: 1.05, y: -1, duration: 0.2, ease: "power1.in" });
        if (refs.mouthRef.current) {
          gsap.to(refs.mouthRef.current, {
            scaleY: 2,
            duration: 0.2,
            repeat: -1,
            yoyo: true
          });
        }
        break;
    }

  }, [state, baseSpeed]); // re-run ONLY when state changes
}
