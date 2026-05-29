export type AvatarBaseShape = 'bean' | 'snake' | 'bird';
export type AvatarEarStyle = 'none' | 'pointy' | 'floppy' | 'round';
export type AvatarTailStyle = 'none' | 'stubby' | 'long' | 'fluffy';
export type AvatarEyeStyle = 'dots' | 'cute' | 'goggles' | 'cyclops' | 'sleepy';
export type AvatarAccessory = 'none' | 'bowTie' | 'headband' | 'scarf';

export interface AvatarConfig {
  /** The core shape of the character */
  baseShape: AvatarBaseShape;
  /** Primary body color (Hex) */
  baseColor: string;
  /** Secondary color for belly, snout, or details (Hex) */
  accentColor: string;
  /** Eye type */
  eyeStyle: AvatarEyeStyle;
  /** Ear type */
  earStyle: AvatarEarStyle;
  /** Tail type */
  tailStyle: AvatarTailStyle;
  /** Accessory */
  accessory: AvatarAccessory;
  /** Base personality that might tweak default animation speed */
  personality: 'energetic' | 'chill' | 'curious' | 'grumpy';
}

export const DEFAULT_AVATAR: AvatarConfig = {
  baseShape: 'bean',
  baseColor: '#FFD54F',
  accentColor: '#FFE082',
  eyeStyle: 'cute',
  earStyle: 'pointy',
  tailStyle: 'stubby',
  accessory: 'none',
  personality: 'energetic'
};
