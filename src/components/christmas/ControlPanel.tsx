import React, { useContext, useState } from 'react';
import { TreeContext, TreeContextType, CameraViewType } from './types';
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
  Hand
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
    setShowTitle
  } = useContext(TreeContext) as TreeContextType;

  const [isExpanded, setIsExpanded] = useState(true);

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
      className="absolute right-6 top-24 z-40 text-white"
    >
      <div className={`bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden transition-all duration-300 ${isExpanded ? 'w-64' : 'w-auto'}`}>
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Settings2 size={18} className="text-yellow-400" />
            {isExpanded && <h3 className="text-sm font-bold tracking-wider text-yellow-400">控制面板</h3>}
          </div>
          <button className="text-white/50 hover:text-white">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 overflow-hidden"
            >
              {/* 状态控制 */}
              <div className="mb-6 space-y-3 pt-2 border-t border-white/10">
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
              <div>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ControlPanel;
