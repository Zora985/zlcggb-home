import type { EditablePhotoConfig } from './types';
import { getImageUrl } from '../../utils/imageUrl';

export const DEFAULT_TITLE = '🎄 CHRISTMAS MEMORIES ❄️';

export const DEFAULT_SUBTITLE_FORMED = '🎁 MEMORY TREE // TIMELINE OF LOVE';
export const DEFAULT_SUBTITLE_CHAOS = '✨ SCATTERED MEMORIES';

// 图片路径（相对路径，会被工具函数转换为正确的URL）
const IMAGE_PATHS = [
  '719dd328-3fee-4364-80a7-fb7a2a4e2881/1765715886689-蝎子.png',
  '719dd328-3fee-4364-80a7-fb7a2a4e2881/1765715886689-医疗.png',
  '719dd328-3fee-4364-80a7-fb7a2a4e2881/1765715886688-车.png',
  '719dd328-3fee-4364-80a7-fb7a2a4e2881/1765716162171-vip.png',
  '719dd328-3fee-4364-80a7-fb7a2a4e2881/1765716162170-smart.png',
];

export const DEFAULT_PHOTOS: EditablePhotoConfig[] = [
  {
    id: 'default-1',
    url: getImageUrl(IMAGE_PATHS[0]),
    title: '2022-01',
  },
  {
    id: 'default-2',
    url: getImageUrl(IMAGE_PATHS[1]),
    title: '2022-10',
  },
  {
    id: 'default-3',
    url: getImageUrl(IMAGE_PATHS[2]),
    title: '2024-04',
  },
  {
    id: 'default-4',
    url: getImageUrl(IMAGE_PATHS[3]),
    title: '2025-02',
  },
  {
    id: 'default-5',
    url: getImageUrl(IMAGE_PATHS[4]),
    title: '2025-06',
  },
];


