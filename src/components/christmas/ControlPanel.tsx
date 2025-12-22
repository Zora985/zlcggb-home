import React, { useContext, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { TreeContext, TreeContextType, CameraViewType, EditablePhotoConfig } from './types';
import { DEFAULT_PHOTOS, DEFAULT_SUBTITLE_CHAOS, DEFAULT_SUBTITLE_FORMED, DEFAULT_TITLE } from './defaultContent';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  RotateCw, 
  Play, 
  Pause, 
  Type, 
  Maximize, 
  Minimize,
  Eye,
  Settings2,
  ChevronDown,
  ChevronUp,
  Hand,
  Pencil,
  RotateCcw,
  Images
} from 'lucide-react';

const ControlPanel: React.FC = () => {
  const { 
    state, 
    setState, 
    rotationSpeed, 
    setRotationSpeed, 
    cameraView, 
    setCameraView,
    autoPlay,
    setAutoPlay,
    showTitle,
    setShowTitle,
    webcamEnabled,
    setWebcamEnabled,
    showGesturePreview,
    setShowGesturePreview,
    customTitle,
    setCustomTitle,
    customSubtitleFormed,
    setCustomSubtitleFormed,
    customSubtitleChaos,
    setCustomSubtitleChaos,
    photoConfigs,
    setPhotoConfigs
  } = useContext(TreeContext) as TreeContextType;

  const [isExpanded, setIsExpanded] = useState(true);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'control' | 'edit'>('control');
  const [batchUploading, setBatchUploading] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const batchFileInputRef = useRef<HTMLInputElement | null>(null);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 自动隐藏控制面板（2秒后）
  const startAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
    }
    autoHideTimerRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 2000);
  }, []);

  const cancelAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  // 首次加载时启动自动隐藏
  useEffect(() => {
    startAutoHideTimer();
    return () => cancelAutoHideTimer();
  }, [startAutoHideTimer, cancelAutoHideTimer]);

  // 用户交互时取消自动隐藏
  const handlePanelInteraction = useCallback(() => {
    cancelAutoHideTimer();
  }, [cancelAutoHideTimer]);

  const normalizedPhotos: EditablePhotoConfig[] = useMemo(() => {
    const arr = Array.isArray(photoConfigs) ? [...photoConfigs] : [];
    while (arr.length < 5) {
      arr.push({ id: `empty-${arr.length}`, url: DEFAULT_PHOTOS[arr.length]?.url || '', title: DEFAULT_PHOTOS[arr.length]?.title || '' });
    }
    return arr.slice(0, 5);
  }, [photoConfigs]);

  const readAsDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('读取图片失败'));
      reader.readAsDataURL(file);
    });
  };

  const compressImageToDataUrl = async (file: File) => {
    // 先读成 dataURL
    const dataUrl = await readAsDataUrl(file);
    // 尝试用 canvas 压缩（避免 sessionStorage 爆掉）
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('图片解码失败'));
        i.src = dataUrl;
      });

      const maxSide = 1024;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return dataUrl;
      ctx.drawImage(img, 0, 0, w, h);

      // 优先 webp（更小），不支持则回退 jpeg
      const webp = canvas.toDataURL('image/webp', 0.85);
      if (webp.startsWith('data:image/webp')) return webp;
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return dataUrl;
    }
  };

  const updatePhotoAt = (index: number, patch: Partial<EditablePhotoConfig>) => {
    setPhotoConfigs(
      normalizedPhotos.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );
  };

  const handlePickFile = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const handleUpload = async (index: number, file: File | null) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const url = await compressImageToDataUrl(file);
      updatePhotoAt(index, {
        id: `upload-${index}-${Date.now()}`,
        url,
        title: '', // 上传后默认空标题
      });
    } finally {
      setUploadingIndex(null);
    }
  };

  // 一键上传多张图片
  const handleBatchUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBatchUploading(true);
    try {
      const fileArray = Array.from(files).slice(0, 5); // 最多5张
      const uploadPromises = fileArray.map(async (file, index) => {
        const url = await compressImageToDataUrl(file);
        return {
          id: `batch-${index}-${Date.now()}`,
          url,
          title: '', // 默认空标题
        };
      });
      
      const results = await Promise.all(uploadPromises);
      
      // 更新所有图片配置
      const newConfigs = [...normalizedPhotos];
      results.forEach((result, index) => {
        if (index < 5) {
          newConfigs[index] = result;
        }
      });
      setPhotoConfigs(newConfigs);
    } finally {
      setBatchUploading(false);
      // 清空 input 以便可以重复上传相同文件
      if (batchFileInputRef.current) {
        batchFileInputRef.current.value = '';
      }
    }
  };

  const resetAll = () => {
    setCustomTitle(DEFAULT_TITLE);
    setCustomSubtitleFormed(DEFAULT_SUBTITLE_FORMED);
    setCustomSubtitleChaos(DEFAULT_SUBTITLE_CHAOS);
    setPhotoConfigs(DEFAULT_PHOTOS.map((p) => ({ ...p })));
  };

  const resetPhoto = (index: number) => {
    const d = DEFAULT_PHOTOS[index];
    if (!d) return;
    updatePhotoAt(index, { id: d.id, url: d.url, title: d.title });
  };

  const views: { id: CameraViewType; label: string; icon: string }[] = [
    { id: 'MANUAL', label: '手动', icon: '✋' },
    { id: 'FRONT', label: '正面', icon: '👁️' },
    { id: 'TOP', label: '俯视', icon: '⬆️' },
    { id: 'BOTTOM', label: '仰视', icon: '⬇️' },
    { id: 'SIDE_FAR', label: '远景', icon: '🔭' },
    { id: 'CLOSEUP', label: '近景', icon: '🔍' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute right-2 md:right-6 top-20 md:top-24 z-40 text-white"
      onMouseEnter={handlePanelInteraction}
      onTouchStart={handlePanelInteraction}
    >
      <div className={`bg-black/40 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/10 shadow-xl overflow-hidden transition-all duration-300 ${isExpanded ? 'w-56 md:w-64' : 'w-auto'}`}>
        {/* Header - 移动端更紧凑 */}
        <div 
          className="flex items-center justify-between p-2 md:p-4 cursor-pointer hover:bg-white/5"
          onClick={() => { handlePanelInteraction(); setIsExpanded(!isExpanded); }}
        >
          <div className="flex items-center gap-1.5 md:gap-2">
            <Settings2 size={14} className="text-yellow-400 md:w-[18px] md:h-[18px]" />
            {isExpanded && <h3 className="text-xs md:text-sm font-bold tracking-wider text-yellow-400">控制面板</h3>}
          </div>
          <button className="text-white/50 hover:text-white">
            {isExpanded ? <ChevronUp size={14} className="md:w-4 md:h-4" /> : <ChevronDown size={14} className="md:w-4 md:h-4" />}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 overflow-hidden flex flex-col max-h-[calc(100svh-180px)] md:max-h-[calc(100vh-220px)]"
            >
              {/* Tabs：控制 / 编辑 */}
              <div className="pt-2 border-t border-white/10">
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                  <button
                    onClick={() => setActiveTab('control')}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${
                      activeTab === 'control'
                        ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/20'
                        : 'text-white/60 hover:bg-white/5'
                    }`}
                  >
                    控制
                  </button>
                  <button
                    onClick={() => setActiveTab('edit')}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${
                      activeTab === 'edit'
                        ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/20'
                        : 'text-white/60 hover:bg-white/5'
                    }`}
                  >
                    编辑
                  </button>
                </div>
              </div>

              {/* 内容区：可滚动 */}
              <div className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1 overscroll-contain">
                {activeTab === 'control' ? (
                  <>
                    {/* 状态控制 */}
                    <div className="mb-6 space-y-3">
                      <div className="text-xs text-white/50 uppercase tracking-wider mb-2">形态控制</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setState(state === 'CHAOS' ? 'FORMED' : 'CHAOS')}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                            state === 'FORMED' 
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          {state === 'FORMED' ? <Minimize size={14} /> : <Maximize size={14} />}
                          {state === 'FORMED' ? '折叠/成树' : '展开/星尘'}
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <RotateCw size={14} className="text-white/50" />
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={rotationSpeed}
                          onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                        />
                      </div>

                      <div className="p-2 rounded-lg bg-black/30 border border-white/10 text-[10px] text-white/50 leading-relaxed">
                        <div>
                          当前形态：
                          <span className="ml-1 text-yellow-200/90">
                            {state === 'CHAOS' ? '星尘' : '成树'}
                          </span>
                        </div>
                        <div className="mt-1 break-words">
                          当前副标题：{state === 'CHAOS' ? customSubtitleChaos : customSubtitleFormed}
                        </div>
                      </div>
                    </div>

                    {/* 视角控制 */}
                    <div className="mb-6">
                      <div className="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Camera size={12} />
                        视角切换
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {views.map((view) => (
                          <button
                            key={view.id}
                            onClick={() => setCameraView(view.id)}
                            className={`py-1.5 px-2 rounded-md text-[10px] transition-all border ${
                              cameraView === view.id
                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'
                            }`}
                          >
                            {view.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 播放控制 */}
                    <div className="mb-6">
                      <div className="text-xs text-white/50 uppercase tracking-wider mb-2">自动演示</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setAutoPlay(!autoPlay)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 border ${
                            autoPlay
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'
                          }`}
                        >
                          {autoPlay ? <Pause size={14} /> : <Play size={14} />}
                          {autoPlay ? '停止' : '播放图片'}
                        </button>

                        <button
                          onClick={() => setShowTitle(!showTitle)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 border ${
                            showTitle
                              ? 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'
                              : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          }`}
                        >
                          {showTitle ? <Eye size={14} /> : <Type size={14} />}
                          {showTitle ? '隐藏标题' : '显示标题'}
                        </button>
                      </div>
                    </div>

                    {/* 视觉识别 */}
                    <div>
                      <div className="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Hand size={12} />
                        视觉识别
                      </div>
                      <button
                        onClick={() => {
                          if (webcamEnabled) {
                            setShowGesturePreview(false);
                            setWebcamEnabled(false);
                          } else {
                            setShowGesturePreview(true);
                            setWebcamEnabled(true);
                          }
                        }}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 border ${
                          webcamEnabled
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'
                        }`}
                      >
                        <Hand size={14} />
                        {webcamEnabled ? '关闭视觉识别' : '开启视觉识别'}
                      </button>

                      {webcamEnabled && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setShowGesturePreview(!showGesturePreview)}
                            className="py-2 px-3 rounded-lg text-xs font-medium transition-all border bg-white/5 text-white/70 hover:bg-white/10"
                          >
                            {showGesturePreview ? '隐藏摄像头' : '显示摄像头'}
                          </button>
                          <div className="py-2 px-3 rounded-lg text-[10px] border bg-black/30 border-white/10 text-white/50 flex items-center justify-center">
                            单指停留1秒打开
                          </div>
                        </div>
                      )}

                      <div className="mt-2 text-[10px] text-white/40 leading-relaxed">
                        首次开启会加载模型（可能需要一段时间）。关闭后会释放浏览器摄像头。
                      </div>
                      <div className="mt-2 text-[10px] text-white/35">
                        预览窗口：桌面左上 / 移动端右下（可用“显示摄像头”开关控制）。
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <Pencil size={14} className="text-yellow-300" />
                      <div className="text-xs text-white/60">编辑内容（刷新会清空）</div>
                    </div>

                    <div className="mb-4 p-2 rounded-lg bg-black/30 border border-white/10">
                      <div className="text-[10px] text-white/50">
                        当前形态：
                        <span className="ml-1 text-yellow-200/90">
                          {state === 'CHAOS' ? '星尘' : '成树'}
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] text-white/45 break-words">
                        当前显示副标题：{state === 'CHAOS' ? customSubtitleChaos : customSubtitleFormed}
                      </div>
                      <div className="mt-1 text-[10px] text-emerald-200/70">
                        提示：副标题会随“展开/星尘”和“折叠/成树”状态切换显示。
                      </div>
                    </div>

                    {/* 标题编辑 */}
                    <div className="mb-4">
                      <div className="text-[10px] text-white/50 mb-1">主标题</div>
                      <input
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        placeholder="输入主标题…"
                      />
                    </div>

                    {/* 副标题编辑 */}
                    <div className="mb-4">
                      <div className="text-[10px] text-white/50 mb-1">副标题（成树态）</div>
                      <input
                        value={customSubtitleFormed}
                        onChange={(e) => setCustomSubtitleFormed(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        placeholder="输入副标题…"
                      />
                    </div>

                    <div className="mb-4">
                      <div className="text-[10px] text-white/50 mb-1">副标题（星尘态）</div>
                      <input
                        value={customSubtitleChaos}
                        onChange={(e) => setCustomSubtitleChaos(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        placeholder="输入副标题…"
                      />
                    </div>

                    {/* 图片编辑 */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] text-white/50">图片（最多 5 张）</div>
                        <button
                          onClick={() => batchFileInputRef.current?.click()}
                          disabled={batchUploading}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-red-500/80 to-green-500/80 hover:from-red-500 hover:to-green-500 text-white text-[10px] font-medium transition-all disabled:opacity-50"
                        >
                          <Images size={12} />
                          {batchUploading ? '上传中...' : '一键上传'}
                        </button>
                        <input
                          ref={batchFileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleBatchUpload(e.target.files)}
                        />
                      </div>
                      <div className="space-y-2">
                        {normalizedPhotos.map((p, idx) => (
                          <div key={`${p.id}-${idx}`} className="p-2 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex gap-2">
                              <div className="w-12 h-12 rounded-md overflow-hidden bg-black/40 border border-white/10 flex-shrink-0">
                                {p.url ? (
                                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-white/30">空</div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex gap-2 mb-2">
                                  <button
                                    onClick={() => handlePickFile(idx)}
                                    className="flex-1 py-1.5 px-2 rounded-md text-[10px] bg-emerald-500/15 text-emerald-200 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                                    disabled={uploadingIndex === idx}
                                  >
                                    {uploadingIndex === idx ? '处理中…' : '上传'}
                                  </button>
                                  <button
                                    onClick={() => resetPhoto(idx)}
                                    className="py-1.5 px-2 rounded-md text-[10px] bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition flex items-center gap-1"
                                    title="恢复默认图片"
                                  >
                                    <RotateCcw size={12} />
                                    默认
                                  </button>
                                  <input
                                    ref={(el) => { fileInputRefs.current[idx] = el; }}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      e.target.value = '';
                                      handleUpload(idx, file);
                                    }}
                                  />
                                </div>

                                <input
                                  value={p.title}
                                  onChange={(e) => updatePhotoAt(idx, { title: e.target.value })}
                                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                                  placeholder="图片标题（可为空）"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 text-[10px] text-white/35">
                        上传图片会自动压缩以便缓存；刷新页面会清空编辑内容。
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-1">
                      <button
                        onClick={resetAll}
                        className="py-2 px-3 rounded-lg text-xs font-medium bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition flex items-center justify-center gap-2"
                      >
                        <RotateCcw size={14} />
                        恢复默认
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ControlPanel;
