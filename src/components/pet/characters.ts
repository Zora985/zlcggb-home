import type { CharacterTemplate } from './PixelCharacter';
import { getCreation } from '../../lib/creatorStore';

export interface CharacterDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  bodyColor: string;
  filter?: string;
  sleepHeadColor: string;
  template?: CharacterTemplate;
  /** AI 工坊自定义角色 SVG 源码 */
  svgData?: string;
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'clawd-original',
    name: 'Clawd',
    emoji: '🦀',
    description: '经典橘色螃蟹',
    bodyColor: '#DE886D',
    sleepHeadColor: '#f97316',
  },
  {
    id: 'clawd-ocean',
    name: '海蓝 Ocean',
    emoji: '🌊',
    description: '深海蓝的冰酷螃蟹',
    bodyColor: '#6D9EDE',
    filter: 'hue-rotate(185deg) saturate(1.3)',
    sleepHeadColor: '#3b82f6',
  },
  {
    id: 'clawd-forest',
    name: '森绿 Forest',
    emoji: '🌿',
    description: '森林绿的自然螃蟹',
    bodyColor: '#7EBD6D',
    filter: 'hue-rotate(105deg) saturate(1.1)',
    sleepHeadColor: '#22c55e',
  },
  {
    id: 'clawd-violet',
    name: '幻紫 Violet',
    emoji: '🔮',
    description: '神秘紫的魔法螃蟹',
    bodyColor: '#A86DDE',
    filter: 'hue-rotate(265deg) saturate(1.3)',
    sleepHeadColor: '#a855f7',
  },
  {
    id: 'clawd-royal',
    name: '皇金 Royal',
    emoji: '👑',
    description: '尊贵的皇家金蟹',
    bodyColor: '#DEC06D',
    filter: 'hue-rotate(35deg) saturate(1.8) brightness(1.05)',
    sleepHeadColor: '#eab308',
  },
  {
    id: 'clawd-sakura',
    name: '樱粉 Sakura',
    emoji: '🌸',
    description: '可爱的樱花粉蟹',
    bodyColor: '#DE6DA8',
    filter: 'hue-rotate(315deg) saturate(1.4)',
    sleepHeadColor: '#ec4899',
  },
];

export const TEMPLATE_CHARACTERS: CharacterDef[] = [
  {
    id: 'pixel-cat',
    name: '像素猫 Mew',
    emoji: '🐱',
    description: '灵巧优雅的像素猫咪',
    bodyColor: '#C8A27A',
    sleepHeadColor: '#C8A27A',
    template: 'cat',
  },
  {
    id: 'pixel-robot',
    name: '机器人 Bolt',
    emoji: '🤖',
    description: '高科技的像素机器人',
    bodyColor: '#8CA0B8',
    sleepHeadColor: '#8CA0B8',
    template: 'robot',
  },
  {
    id: 'pixel-slime',
    name: '史莱姆 Goo',
    emoji: '🟢',
    description: '软萌弹跳的像素史莱姆',
    bodyColor: '#6DD68C',
    sleepHeadColor: '#6DD68C',
    template: 'slime',
  },
];

export const ALL_CHARACTERS = [...CHARACTERS, ...TEMPLATE_CHARACTERS];

export const DEFAULT_CHARACTER_ID = 'clawd-original';

export function getCharacter(id: string): CharacterDef {
  if (id.startsWith('creator-')) {
    const creationId = id.slice('creator-'.length);
    const c = getCreation(creationId);
    if (c?.type === 'character' && c.svgData) {
      return {
        id: `creator-${c.id}`,
        name: c.name,
        emoji: '✨',
        description: c.description || 'AI 工坊创作',
        bodyColor: '#DE886D',
        sleepHeadColor: '#f97316',
        svgData: c.svgData,
      };
    }
  }
  return ALL_CHARACTERS.find(c => c.id === id) ?? CHARACTERS[0];
}
