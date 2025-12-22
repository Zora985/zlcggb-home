import React, { useState, Suspense, useContext, useEffect } from 'react';
import { TreeContext, TreeContextType, AppState, PointerCoords, CameraViewType } from './christmas/types';
import Experience from './christmas/Experience';
import TechEffects from './christmas/TechEffects';
import ControlPanel from './christmas/ControlPanel';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';

// 图片预加载缓存
const imageCache = new Map<string, HTMLImageElement>();

// 预加载图片函数
const preloadImage = (url: string): Promise<HTMLImageElement> => {
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = (err) => {
      console.warn('预加载图片失败:', url, err);
      reject(err);
    };
    img.src = url;
  });
};

// 照片弹窗
const PhotoModal: React.FC<{ url: string | null; onClose: () => void }> = ({
  url,
  onClose,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    if (url) {
      setHasError(false);
      // 检查是否已缓存
      if (imageCache.has(url)) {
        setIsLoaded(true);
      } else {
        setIsLoaded(false);
        preloadImage(url)
          .then(() => setIsLoaded(true))
          .catch(() => setHasError(true));
      }
    }
  }, [url]);

  if (!url) return null;
  
  return (
    <motion.div
      id="photo-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50, rotate: -5 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        exit={{ scale: 0.5, opacity: 0, y: 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative max-w-4xl max-h-full bg-white p-3 rounded shadow-[0_0_50px_rgba(255,215,0,0.3)] border-8 border-white"
        onClick={(e) => e.stopPropagation()}
      >
        {!isLoaded && !hasError && (
          <div className="w-[400px] h-[300px] flex items-center justify-center bg-gray-100 rounded">
            <div className="text-gray-400 animate-pulse">加载中...</div>
          </div>
        )}
        {hasError && (
          <div className="w-[400px] h-[300px] flex items-center justify-center bg-gray-100 rounded">
            <div className="text-red-400">图片加载失败</div>
          </div>
        )}
        <img
          src={url}
          alt="Memory"
          className={`max-h-[80vh] object-contain rounded shadow-inner transition-opacity duration-300 ${isLoaded && !hasError ? 'opacity-100' : 'opacity-0 absolute'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
        <div className="absolute -bottom-12 w-full text-center text-red-300/70 text-sm">
          ❄️ 点击任意位置关闭 ❄️
        </div>
      </motion.div>
    </motion.div>
  );
};

const ChristmasContent: React.FC<{
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}> = ({ isFullscreen, onToggleFullscreen }) => {
  const { state, selectedPhotoUrl, setSelectedPhotoUrl, showTitle } = useContext(
    TreeContext
  ) as TreeContextType;

  // 预加载所有项目图片
  useEffect(() => {
    const photoUrls = [
      '/api/images/719dd328-3fee-4364-80a7-fb7a2a4e2881/1765715886689-蝎子.png',
      '/api/images/719dd328-3fee-4364-80a7-fb7a2a4e2881/1765715886689-医疗.png',
      '/api/images/719dd328-3fee-4364-80a7-fb7a2a4e2881/1765715886688-车.png',
      '/api/images/719dd328-3fee-4364-80a7-fb7a2a4e2881/1765716162171-vip.png',
      '/api/images/719dd328-3fee-4364-80a7-fb7a2a4e2881/1765716162170-smart.png',
    ];
    
    // 延迟预加载，不阻塞首屏
    const timer = setTimeout(() => {
      photoUrls.forEach((url, index) => {
        setTimeout(() => preloadImage(url), index * 300);
      });
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // 全屏样式
  const fullscreenStyle = isFullscreen
    ? {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        height: '100vh',
      }
    : {
        height: 'calc(100vh - 48px)',
      };

  return (
    <main
      className="relative w-full bg-black text-white overflow-hidden"
      style={fullscreenStyle}
    >
      {/* 3D 场景层 */}
      <div className="absolute inset-0 z-10">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-red-400 animate-pulse text-2xl">
              🎄 Loading Christmas Magic... ❄️
            </div>
          }
        >
          <Experience />
        </Suspense>
      </div>

      {/* 科技感特效层 */}
      <TechEffects />

      {/* UI 层 */}
      <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-6">
        <header className="flex justify-between items-start w-full">
          {/* 标题部分 - 受 showTitle 控制 */}
          <div className="transition-opacity duration-500" style={{ opacity: showTitle ? 1 : 0 }}>
            <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-green-200 to-amber-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
              🎄 CHRISTMAS MEMORIES ❄️
            </h1>
            <p className="text-red-400/80 tracking-widest text-xs mt-2">
              {state === 'CHAOS'
                ? '✨ SCATTERED MEMORIES'
                : '🎁 MEMORY TREE // TIMELINE OF LOVE'}
            </p>
          </div>

          {/* 全屏切换按钮 - 始终显示，不受 showTitle 控制 */}
          <button
            onClick={onToggleFullscreen}
            className="pointer-events-auto p-3 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all hover:scale-105 border border-white/10 ml-auto"
            title={isFullscreen ? '退出全屏' : '全屏模式'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </header>

        {/* 控制面板 */}
        <div className="pointer-events-auto">
          <ControlPanel />
        </div>

        {/* 底部提示 - 受 showTitle 控制 */}
        <div 
          className="flex justify-between items-end transition-opacity duration-500" 
          style={{ opacity: showTitle ? 1 : 0 }}
        >
          <div className="text-white/50 text-xs">
            <span className="hidden md:inline">🖱️ 拖拽旋转 | 滚轮缩放 | 点击照片查看大图</span>
            <span className="md:hidden">👆 拖拽旋转 | 双指缩放 | 点击照片查看大图</span>
          </div>

          {/* 全屏模式退出提示 - 右下角 - 仅桌面端显示 */}
          {isFullscreen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden md:flex pointer-events-auto items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10"
            >
              <span className="text-white/70 text-xs">按 ESC 或点击</span>
              <button
                onClick={onToggleFullscreen}
                className="text-green-400 hover:text-green-300 text-xs font-medium flex items-center gap-1"
              >
                <Minimize2 size={14} />
                退出全屏
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* 弹窗层 */}
      <AnimatePresence>
        {selectedPhotoUrl && (
          <PhotoModal
            url={selectedPhotoUrl}
            onClose={() => setSelectedPhotoUrl(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

const ChristmasPage: React.FC = () => {
  const [state, setState] = useState<AppState>('FORMED');
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.3);
  const [rotationBoost, setRotationBoost] = useState<number>(0);
  const [webcamEnabled, setWebcamEnabled] = useState<boolean>(false);
  const [pointer, setPointer] = useState<PointerCoords | null>(null);
  const [hoverProgress, setHoverProgress] = useState<number>(0);
  const [clickTrigger, setClickTrigger] = useState<number>(0);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [zoomOffset, setZoomOffset] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 新增状态
  const [cameraView, setCameraView] = useState<CameraViewType>('MANUAL');
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [showText, setShowText] = useState<boolean>(true);
  const [showTitle, setShowTitle] = useState<boolean>(true);
  const [photoTargets, setPhotoTargets] = useState<{ id: string; pos: [number, number, number]; rot: [number, number, number] }[]>([]);
  
  // 树旋转控制
  const [isRotationPaused, setIsRotationPaused] = useState<boolean>(false);
  const [treeRotationAngle, setTreeRotationAngle] = useState<number>(0);

  // ESC 键退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <TreeContext.Provider
      value={{
        state,
        setState,
        rotationSpeed,
        setRotationSpeed,
        webcamEnabled,
        setWebcamEnabled,
        pointer,
        setPointer,
        hoverProgress,
        setHoverProgress,
        clickTrigger,
        setClickTrigger,
        selectedPhotoUrl,
        setSelectedPhotoUrl,
        panOffset,
        setPanOffset,
        rotationBoost,
        setRotationBoost,
        zoomOffset,
        setZoomOffset,
        cameraView,
        setCameraView,
        autoPlay,
        setAutoPlay,
        showText,
        setShowText,
        showTitle,
        setShowTitle,
        photoTargets,
        setPhotoTargets,
        isRotationPaused,
        setIsRotationPaused,
        treeRotationAngle,
        setTreeRotationAngle
      }}
    >
      <ChristmasContent
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />
    </TreeContext.Provider>
  );
};

export default ChristmasPage;
