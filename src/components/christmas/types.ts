import { createContext, Dispatch, SetStateAction } from 'react';

export type AppState = 'CHAOS' | 'FORMED';
export type CameraViewType = 'DEFAULT' | 'MANUAL' | 'FRONT' | 'TOP' | 'BOTTOM' | 'SIDE_FAR' | 'CLOSEUP' | 'Dynamic';

export interface EditablePhotoConfig {
  id: string;
  url: string;
  title: string; // 用户可编辑；默认图片用日期字符串，上传图片默认空
}

export interface PointerCoords {
  x: number;
  y: number;
}

export interface TreeContextType {
  state: AppState;
  setState: (state: AppState) => void;
  rotationSpeed: number;
  setRotationSpeed: (speed: number) => void;
  webcamEnabled: boolean;
  setWebcamEnabled: (enabled: boolean) => void;
  // 视觉识别：摄像头流（用于控制面板预览，不重复开摄像头）
  gestureStream: MediaStream | null;
  setGestureStream: (stream: MediaStream | null) => void;
  // 控制面板：是否展示摄像头预览
  showGesturePreview: boolean;
  setShowGesturePreview: (show: boolean) => void;

  // 编辑：标题/副标题与图片配置（存 sessionStorage；刷新清空）
  customTitle: string;
  setCustomTitle: (title: string) => void;
  customSubtitleFormed: string;
  setCustomSubtitleFormed: (subtitle: string) => void;
  customSubtitleChaos: string;
  setCustomSubtitleChaos: (subtitle: string) => void;
  photoConfigs: EditablePhotoConfig[];
  setPhotoConfigs: (configs: EditablePhotoConfig[]) => void;
  pointer: PointerCoords | null;
  setPointer: (coords: PointerCoords | null) => void;
  hoverProgress: number;
  setHoverProgress: (progress: number) => void;
  clickTrigger: number;
  setClickTrigger: (time: number) => void;
  selectedPhotoUrl: string | null;
  setSelectedPhotoUrl: (url: string | null) => void;
  panOffset: { x: number, y: number };
  setPanOffset: Dispatch<SetStateAction<{ x: number, y: number }>>;
  rotationBoost: number;
  setRotationBoost: Dispatch<SetStateAction<number>>;
  zoomOffset: number;
  setZoomOffset: Dispatch<SetStateAction<number>>;
  
  // New Controls
  cameraView: CameraViewType;
  setCameraView: (view: CameraViewType) => void;
  autoPlay: boolean;
  setAutoPlay: (auto: boolean) => void;
  showText: boolean;
  setShowText: (show: boolean) => void;
  showTitle: boolean;
  setShowTitle: (show: boolean) => void;
  
  // For Camera Tour
  photoTargets: { id: string; pos: [number, number, number]; rot: [number, number, number]; baseAngle?: number }[];
  setPhotoTargets: (targets: { id: string; pos: [number, number, number]; rot: [number, number, number]; baseAngle?: number }[]) => void;
  
  // 树旋转暂停控制
  isRotationPaused: boolean;
  setIsRotationPaused: (paused: boolean) => void;
  
  // 树当前旋转角度 (用于同步相机)
  treeRotationAngle: number;
  setTreeRotationAngle: (angle: number) => void;
}

export interface ParticleData {
  id: string;
  chaosPos: [number, number, number];
  treePos: [number, number, number];
  chaosRot: [number, number, number];
  treeRot: [number, number, number];
  scale: number;
  color: string;
  image?: string;
  year?: number;
  month?: string;
  title?: string;
  type: 'LEAF' | 'ORNAMENT' | 'PHOTO';
}

export const TreeContext = createContext<TreeContextType>({} as TreeContextType);
