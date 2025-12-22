import { createContext, Dispatch, SetStateAction } from 'react';

export type AppState = 'CHAOS' | 'FORMED';
export type CameraViewType = 'DEFAULT' | 'MANUAL' | 'FRONT' | 'TOP' | 'BOTTOM' | 'SIDE_FAR' | 'CLOSEUP' | 'Dynamic';

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
  photoTargets: { id: string; pos: [number, number, number]; rot: [number, number, number] }[];
  setPhotoTargets: (targets: { id: string; pos: [number, number, number]; rot: [number, number, number] }[]) => void;
  
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
  type: 'LEAF' | 'ORNAMENT' | 'PHOTO';
}

export const TreeContext = createContext<TreeContextType>({} as TreeContextType);
