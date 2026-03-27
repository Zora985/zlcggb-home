import React, { useState, Suspense, useContext, useEffect } from 'react';
import { TreeContext, TreeContextType, AppState, PointerCoords, CameraViewType, EditablePhotoConfig } from './christmas/types';
import TechEffects from './christmas/TechEffects';
import ControlPanel from './christmas/ControlPanel';
import { DEFAULT_PHOTOS, DEFAULT_SUBTITLE_CHAOS, DEFAULT_SUBTITLE_FORMED, DEFAULT_TITLE } from './christmas/defaultContent';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';

// 🚀 核心优化：懒加载 Experience（Three.js 相关内容体积大）
const LazyExperience = React.lazy(() => import('./christmas/Experience'));

// 视觉识别模块：仅在用户开启后才动态加载（模型/wasm 体积大）
const LazyGestureInput = React.lazy(() => import('./christmas/GestureInput'));

// 🎄 圣诞树加载动画 - 纯 CSS 实现，秒开无延迟
const ChristmasLoadingScreen: React.FC<{ progress?: number }> = ({ progress = 0 }) => {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#071018] flex flex-col items-center justify-center">
      {/* 星空背景 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 2 + 's',
              animationDuration: Math.random() * 2 + 1 + 's',
              opacity: Math.random() * 0.8 + 0.2,
            }}
          />
        ))}
      </div>

      {/* 圣诞树 SVG 动画 */}
      <div className="relative z-10 mb-8">
        <svg width="120" height="150" viewBox="0 0 120 150" className="drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]">
          {/* 树干 */}
          <rect x="50" y="120" width="20" height="25" fill="#5D4037" rx="2" />
          
          {/* 树的三层 - 从下到上 */}
          <polygon 
            points="60,10 15,60 105,60" 
            fill="#166534"
            className="animate-pulse"
            style={{ animationDuration: '2s' }}
          />
          <polygon 
            points="60,35 25,85 95,85" 
            fill="#15803d"
            className="animate-pulse"
            style={{ animationDuration: '2.2s', animationDelay: '0.2s' }}
          />
          <polygon 
            points="60,55 30,115 90,115" 
            fill="#22c55e"
            className="animate-pulse"
            style={{ animationDuration: '2.4s', animationDelay: '0.4s' }}
          />
          
          {/* 星星 */}
          <polygon 
            points="60,0 63,8 72,8 65,13 68,22 60,17 52,22 55,13 48,8 57,8" 
            fill="#fbbf24"
            className="animate-spin"
            style={{ 
              transformOrigin: '60px 11px',
              animationDuration: '8s'
            }}
          />
          
          {/* 装饰球 */}
          <circle cx="45" cy="70" r="5" fill="#ef4444" className="animate-pulse" />
          <circle cx="75" cy="75" r="5" fill="#3b82f6" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
          <circle cx="55" cy="95" r="5" fill="#fbbf24" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
          <circle cx="70" cy="100" r="5" fill="#a855f7" className="animate-pulse" style={{ animationDelay: '0.9s' }} />
          <circle cx="40" cy="105" r="4" fill="#22d3ee" className="animate-pulse" style={{ animationDelay: '1.2s' }} />
          <circle cx="80" cy="90" r="4" fill="#f97316" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
        </svg>
      </div>

      {/* 标题 */}
      <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-green-300 to-amber-200 mb-4 z-10">
        ✨ Merry Christmas ✨
      </h1>

      {/* 加载进度 */}
      <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden z-10 mb-3">
        <motion.div
          className="h-full bg-gradient-to-r from-red-500 via-green-500 to-amber-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(progress, 10)}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* 加载提示 */}
      <p className="text-white/60 text-sm z-10 animate-pulse">
        {progress < 30 ? '🎄 正在准备魔法...' : progress < 70 ? '❄️ 装饰圣诞树中...' : '🌟 即将呈现...'}
      </p>

      {/* 雪花 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={`snow-${i}`}
            className="absolute text-white/40 animate-bounce"
            style={{
              left: Math.random() * 100 + '%',
              top: -20,
              fontSize: Math.random() * 12 + 8 + 'px',
              animationDuration: Math.random() * 3 + 2 + 's',
              animationDelay: Math.random() * 2 + 's',
            }}
          >
            ❄
          </div>
        ))}
      </div>
    </div>
  );
};

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
  const {
    state,
    selectedPhotoUrl,
    setSelectedPhotoUrl,
    showTitle,
    webcamEnabled,
    pointer,
    hoverProgress,
    customTitle,
    customSubtitleChaos,
    customSubtitleFormed,
  } = useContext(
    TreeContext
  ) as TreeContextType;

  // 🚀 渐进式加载：先显示加载界面，延迟加载 3D 场景
  const [loadingPhase, setLoadingPhase] = useState<'splash' | 'loading' | 'ready'>('splash');
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    // Phase 1: 显示闪屏 300ms（让页面秒开）
    const splashTimer = setTimeout(() => {
      setLoadingPhase('loading');
      setLoadProgress(20);
    }, 300);

    // Phase 2: 模拟加载进度
    const progressInterval = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);

    // Phase 3: 延迟 800ms 后开始加载 3D（给浏览器喘息时间）
    const loadTimer = setTimeout(() => {
      setLoadProgress(100);
      // 再等 200ms 让进度条动画完成
      setTimeout(() => {
        setLoadingPhase('ready');
      }, 200);
    }, 800);

    return () => {
      clearTimeout(splashTimer);
      clearTimeout(loadTimer);
      clearInterval(progressInterval);
    };
  }, []);

  // 预加载所有项目图片（在 3D 加载完成后再预加载图片）
  useEffect(() => {
    if (loadingPhase !== 'ready') return;
    
    const photoUrls = DEFAULT_PHOTOS.map((p) => p.url);
    
    // 延迟预加载，不阻塞 3D 渲染
    const timer = setTimeout(() => {
      photoUrls.forEach((url, index) => {
        setTimeout(() => preloadImage(url), index * 300);
      });
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [loadingPhase]);

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
      {/* 视觉识别层：默认不加载，仅开启后加载并启动 */}
      {webcamEnabled && (
        <Suspense
          fallback={
            <div className="fixed left-4 bottom-4 z-[60] pointer-events-none">
              <div className="px-3 py-2 rounded-lg bg-black/50 backdrop-blur border border-white/10 text-xs text-white/80">
                视觉识别模块加载中…
              </div>
            </div>
          }
        >
          <LazyGestureInput />
        </Suspense>
      )}

      {/* 3D 场景层 - 渐进式加载 */}
      <div className="absolute inset-0 z-10">
        {loadingPhase !== 'ready' ? (
          // 加载动画（纯 CSS，秒开）
          <ChristmasLoadingScreen progress={loadProgress} />
        ) : (
          // 3D 场景（懒加载）
          <Suspense fallback={<ChristmasLoadingScreen progress={95} />}>
            <LazyExperience />
          </Suspense>
        )}
      </div>

      {/* 科技感特效层 */}
      <TechEffects />

      {/* UI 层 */}
      <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-6">
        <header className="flex justify-between items-start w-full gap-2">
          {/* 标题部分 - 受 showTitle 控制，移动端一行显示 */}
          <div className="transition-opacity duration-500 flex-1 min-w-0" style={{ opacity: showTitle ? 1 : 0 }}>
            <h1 className="text-sm sm:text-xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-green-200 to-amber-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {customTitle}
            </h1>
            <p className="text-red-400/80 tracking-wider text-[9px] sm:text-xs mt-0.5 md:mt-2">
              <span className="inline-flex items-center gap-1 md:gap-2">
                <span className="px-1 py-0.5 rounded bg-white/10 border border-white/10 text-white/60 text-[7px] md:text-[10px] tracking-normal">
                  {state === 'CHAOS' ? '星尘' : '成树'}
                </span>
                <span className="text-[8px] md:text-xs truncate">{state === 'CHAOS' ? customSubtitleChaos : customSubtitleFormed}</span>
              </span>
            </p>
          </div>

          {/* 全屏切换按钮 - 移动端更小 */}
          <button
            onClick={onToggleFullscreen}
            className="pointer-events-auto p-1.5 md:p-3 bg-white/10 backdrop-blur-sm rounded-lg md:rounded-xl text-white hover:bg-white/20 transition-all hover:scale-105 border border-white/10 flex-shrink-0"
            title={isFullscreen ? '退出全屏' : '全屏模式'}
          >
            {isFullscreen ? <Minimize2 size={14} className="md:w-5 md:h-5" /> : <Maximize2 size={14} className="md:w-5 md:h-5" />}
          </button>
        </header>

        {/* 控制面板 */}
        <div className="pointer-events-auto">
          <ControlPanel />
        </div>

        {/* 视觉识别指针（便于理解“指向/停留”是否生效） */}
        {webcamEnabled && pointer && (
          <div
            className="fixed z-[90] pointer-events-none"
            style={{
              left: `${pointer.x * 100}%`,
              top: `${pointer.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.8)]" />
              <svg className="absolute -inset-6 w-12 h-12 -rotate-90 overflow-visible">
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  fill="none"
                  stroke="rgba(52,211,153,0.8)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 18}
                  strokeDashoffset={(2 * Math.PI * 18) * (1 - hoverProgress)}
                  className="transition-[stroke-dashoffset] duration-75 ease-linear"
                />
              </svg>
            </div>
          </div>
        )}

        {/* 底部提示 - 受 showTitle 控制 */}
        <div 
          className="flex justify-between items-end transition-opacity duration-500" 
          style={{ opacity: showTitle ? 1 : 0 }}
        >
          <div className="text-white/50 text-xs">
            {webcamEnabled ? (
              <>
                <span className="hidden md:inline">
                  👉 单指指向：暂停/对准 | ⏱️ 指向照片停留1秒：打开 | ⏱️ 打开2秒：自动关闭 | 🧊 冷却3秒（需移开再触发）
                </span>
                <span className="md:hidden">
                  👉 指向暂停 | 停留1秒打开 | 2秒后自动关 | 冷却3秒
                </span>
              </>
            ) : (
              <>
                <span className="hidden md:inline">🖱️ 拖拽旋转 | 滚轮缩放 | 点击照片查看大图</span>
                <span className="md:hidden">👆 拖拽旋转 | 双指缩放 | 点击照片查看大图</span>
              </>
            )}
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
  const EDIT_CACHE_KEY = 'christmas_edit_cache_v1';
  const DEFAULT_ROTATION_SPEED = 0.3;
  const AUTO_PLAY_ROTATION_SPEED = 2;

  const [state, setState] = useState<AppState>('FORMED');
  const [rotationSpeed, setRotationSpeed] = useState<number>(DEFAULT_ROTATION_SPEED);
  const [rotationBoost, setRotationBoost] = useState<number>(0);
  const [webcamEnabled, setWebcamEnabled] = useState<boolean>(false);
  const [gestureStream, setGestureStream] = useState<MediaStream | null>(null);
  const [showGesturePreview, setShowGesturePreview] = useState<boolean>(true);
  const [customTitle, setCustomTitle] = useState<string>(DEFAULT_TITLE);
  const [customSubtitleFormed, setCustomSubtitleFormed] = useState<string>(DEFAULT_SUBTITLE_FORMED);
  const [customSubtitleChaos, setCustomSubtitleChaos] = useState<string>(DEFAULT_SUBTITLE_CHAOS);
  const [photoConfigs, setPhotoConfigs] = useState<EditablePhotoConfig[]>(() =>
    DEFAULT_PHOTOS.map((p) => ({ ...p }))
  );
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

  // 自动播放：加快树旋转，停止后回到默认速度（避免用户感知“越播越慢/越播越晕”）
  useEffect(() => {
    if (autoPlay) {
      setRotationSpeed(AUTO_PLAY_ROTATION_SPEED);
    } else {
      setRotationSpeed(DEFAULT_ROTATION_SPEED);
    }
  }, [AUTO_PLAY_ROTATION_SPEED, DEFAULT_ROTATION_SPEED, autoPlay]);
  
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

  // 2秒后自动进入全屏模式
  useEffect(() => {
    const autoFullscreenTimer = setTimeout(() => {
      setIsFullscreen(true);
    }, 2000);
    return () => clearTimeout(autoFullscreenTimer);
  }, []);

  // 编辑缓存：保存到 sessionStorage；刷新清空（beforeunload 清理）
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          customTitle?: string;
          customSubtitleFormed?: string;
          customSubtitleChaos?: string;
          photoConfigs?: EditablePhotoConfig[];
        };
        if (typeof parsed.customTitle === 'string') setCustomTitle(parsed.customTitle);
        if (typeof parsed.customSubtitleFormed === 'string') setCustomSubtitleFormed(parsed.customSubtitleFormed);
        if (typeof parsed.customSubtitleChaos === 'string') setCustomSubtitleChaos(parsed.customSubtitleChaos);
        if (Array.isArray(parsed.photoConfigs) && parsed.photoConfigs.length > 0) {
          // 规范化：确保 5 张，并对缺失字段回退到默认值
          const normalized: EditablePhotoConfig[] = DEFAULT_PHOTOS.map((d, i) => {
            const item = parsed.photoConfigs?.[i];
            return {
              id: typeof item?.id === 'string' ? item.id : d.id,
              url: typeof item?.url === 'string' && item.url ? item.url : d.url,
              title: typeof item?.title === 'string' ? item.title : d.title,
            };
          });
          setPhotoConfigs(normalized);
        }
      }
    } catch {
      // ignore
    }

    const clearOnReload = () => {
      try {
        sessionStorage.removeItem(EDIT_CACHE_KEY);
      } catch {
        // ignore
      }
    };
    window.addEventListener('beforeunload', clearOnReload);
    return () => window.removeEventListener('beforeunload', clearOnReload);
  }, [EDIT_CACHE_KEY]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        EDIT_CACHE_KEY,
        JSON.stringify({ customTitle, customSubtitleFormed, customSubtitleChaos, photoConfigs })
      );
    } catch {
      // ignore（超出容量时不阻塞功能）
    }
  }, [customSubtitleChaos, customSubtitleFormed, customTitle, photoConfigs]);

  // 关键：关闭视觉识别时，强制释放摄像头（即使 lazy 组件卸载的清理有延迟）
  useEffect(() => {
    if (!webcamEnabled) {
      if (gestureStream) {
        gestureStream.getTracks().forEach((t) => t.stop());
        setGestureStream(null);
      }
      // 同时清理指针/进度，避免残留 UI
      setPointer(null);
      setHoverProgress(0);
    }
  }, [gestureStream, webcamEnabled]);

  return (
    <TreeContext.Provider
      value={{
        state,
        setState,
        rotationSpeed,
        setRotationSpeed,
        webcamEnabled,
        setWebcamEnabled,
        gestureStream,
        setGestureStream,
        showGesturePreview,
        setShowGesturePreview,
        customTitle,
        setCustomTitle,
        customSubtitleFormed,
        setCustomSubtitleFormed,
        customSubtitleChaos,
        setCustomSubtitleChaos,
        photoConfigs,
        setPhotoConfigs,
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
