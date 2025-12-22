import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { GestureRecognizer, NormalizedLandmark, FilesetResolver } from '@mediapipe/tasks-vision';
import { TreeContext, TreeContextType } from './types';

type VisionModule = typeof import('@mediapipe/tasks-vision');

type VisionStatus = 'module_loading' | 'camera_loading' | 'model_loading' | 'running' | 'error';

// 说明：
// - 该组件会被 React.lazy 动态加载，默认不会进入首屏 bundle
// - 组件 mount 后才会请求摄像头权限并加载 MediaPipe 模型/wasm
// - UI 做成非遮挡的小提示，避免影响现有圣诞树交互
const GestureInput: React.FC = () => {
  const {
    state: appState,
    setState,
    setRotationBoost,
    setPointer,
    setHoverProgress,
    selectedPhotoUrl,
    setPanOffset,
    setGestureStream,
    gestureStream,
    showGesturePreview,
  } = useContext(TreeContext) as TreeContextType;

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const visionRef = useRef<VisionModule | null>(null);
  const showPreviewRef = useRef<boolean>(showGesturePreview);
  const delegateRef = useRef<'GPU' | 'CPU' | ''>('');
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastFrameTimeRef = useRef<number>(0);
  const lastPalmRef = useRef<{ x: number; y: number } | null>(null);
  const smoothPointerRef = useRef<{ x: number; y: number } | null>(null);
  const actionLabelRef = useRef<{ label: string; lastUpdateAt: number }>({ label: '等待识别…', lastUpdateAt: 0 });
  const debugRef = useRef<{ lastUpdateAt: number }>({ lastUpdateAt: 0 });

  const [status, setStatus] = useState<VisionStatus>('module_loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [actionLabel, setActionLabel] = useState<string>('等待识别…');
  const [debugLine, setDebugLine] = useState<string>('');

  const stateRef = useRef(appState);
  const photoRef = useRef(selectedPhotoUrl);

  const tmpVec = useMemo(() => ({ x: 0, y: 0 }), []);

  useEffect(() => {
    stateRef.current = appState;
    photoRef.current = selectedPhotoUrl;
  }, [appState, selectedPhotoUrl]);

  useEffect(() => {
    showPreviewRef.current = showGesturePreview;
  }, [showGesturePreview]);

  // 预览画布尺寸跟随视频源尺寸
  useEffect(() => {
    const pv = previewVideoRef.current;
    const canvas = previewCanvasRef.current;
    if (!pv || !canvas) return;

    const sync = () => {
      const w = pv.videoWidth || 320;
      const h = pv.videoHeight || 240;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
    };

    pv.addEventListener('loadedmetadata', sync);
    pv.addEventListener('loadeddata', sync);
    sync();

    return () => {
      pv.removeEventListener('loadedmetadata', sync);
      pv.removeEventListener('loadeddata', sync);
    };
  }, [gestureStream, showGesturePreview]);

  const isExtended = (landmarks: NormalizedLandmark[], tipIdx: number, mcpIdx: number, wrist: NormalizedLandmark) => {
    const tipDist = Math.hypot(landmarks[tipIdx].x - wrist.x, landmarks[tipIdx].y - wrist.y);
    const mcpDist = Math.hypot(landmarks[mcpIdx].x - wrist.x, landmarks[mcpIdx].y - wrist.y);
    return tipDist > mcpDist * 1.25;
  };

  // NOTE: 交互策略：不再使用“捏合/微弯点击”，只输出“单指指向(pointer)”
  // 打开/关闭由 TreeSystem 中的 dwell 状态机控制（停留1s打开、2s关闭、冷却3s）

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        setStatus('module_loading');

        // 1) 动态加载 tasks-vision（避免首屏加载）
        const vision: VisionModule = await import('@mediapipe/tasks-vision');
        visionRef.current = vision;
        const FilesetResolverTyped = vision.FilesetResolver as typeof FilesetResolver;
        const GestureRecognizerTyped = vision.GestureRecognizer as unknown as typeof GestureRecognizer;

        if (!mounted) return;

        // 2) 并行：申请摄像头 + 初始化识别器（模型/wasm）
        setStatus('camera_loading');
        const streamPromise = navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, frameRate: { ideal: 30 } },
          audio: false,
        });

        setStatus('model_loading');
        const recognizerPromise = (async () => {
          const visionTasks = await FilesetResolverTyped.forVisionTasks('/wasm');
          // 按用户诉求：优先 GPU（更快）
          const create = async (delegate: 'GPU' | 'CPU') => {
            return await GestureRecognizerTyped.createFromOptions(visionTasks, {
              baseOptions: {
                modelAssetPath: '/models/gesture_recognizer.task',
                delegate,
              },
              runningMode: 'VIDEO',
              numHands: 2,
            });
          };

          try {
            delegateRef.current = 'GPU';
            return await create('GPU');
          } catch (e) {
            console.warn('[GestureInput] GPU delegate init failed, fallback to CPU', e);
            delegateRef.current = 'CPU';
            return await create('CPU');
          }
        })();

        const [stream, recognizer] = await Promise.all([streamPromise, recognizerPromise]);
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        recognizerRef.current = recognizer;
        streamRef.current = stream;
        // 提供给 UI 预览（不重复开摄像头）
        setGestureStream(stream);

        const video = previewVideoRef.current;
        if (!video) throw new Error('previewVideoRef missing');

        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;

        // 确保视频真正开始出帧（否则 recognizeForVideo 可能一直拿不到新帧）
        await video.play();
        await new Promise<void>((resolve) => {
          if (video.readyState >= 2 && video.videoWidth > 0) return resolve();
          const onReady = () => {
            video.removeEventListener('loadeddata', onReady);
            video.removeEventListener('loadedmetadata', onReady);
            resolve();
          };
          video.addEventListener('loadeddata', onReady);
          video.addEventListener('loadedmetadata', onReady);
        });

        lastFrameTimeRef.current = Date.now();
        setStatus('running');
        loop();
      } catch (err: unknown) {
        console.error('[GestureInput] init failed:', err);
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    };

    const loop = () => {
      if (!mounted) return;
      rafRef.current = requestAnimationFrame(loop);

      const video = previewVideoRef.current;
      const recognizer = recognizerRef.current;
      if (!video || !recognizer) return;

      const now = Date.now();
      lastFrameTimeRef.current = now;

      // 防止重复识别同一帧
      if (video.currentTime === lastVideoTimeRef.current) return;
      lastVideoTimeRef.current = video.currentTime;

      const t0 = performance.now();
      const results = recognizer.recognizeForVideo(video, now);
      const inferMs = performance.now() - t0;

      const isPhotoOpen = !!photoRef.current;
      const currentState = stateRef.current;

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0] as NormalizedLandmark[];

        const wrist = landmarks[0];
        const indexTip = landmarks[8];

        // 手指伸出状态（用于两指/状态切换判定）
        const indexExtended = isExtended(landmarks, 8, 5, wrist);
        const middleExtended = isExtended(landmarks, 12, 9, wrist);
        const ringExtended = isExtended(landmarks, 16, 13, wrist);
        const pinkyExtended = isExtended(landmarks, 20, 17, wrist);
        const isTwoFingers = indexExtended && middleExtended && !ringExtended && !pinkyExtended;
        const isSingleFinger = indexExtended && !middleExtended && !ringExtended && !pinkyExtended;

        // 指针：只在“单指模式”输出，避免拳头/张开干扰定位
        if (isSingleFinger) {
          // x 镜像（前置摄像头）
          const rawX = Math.max(0, Math.min(1, 1.0 - indexTip.x));
          const rawY = Math.max(0, Math.min(1, indexTip.y));

          // 指针平滑（降低抖动）
          const alpha = 0.35;
          if (!smoothPointerRef.current) {
            smoothPointerRef.current = { x: rawX, y: rawY };
          } else {
            smoothPointerRef.current.x = smoothPointerRef.current.x + (rawX - smoothPointerRef.current.x) * alpha;
            smoothPointerRef.current.y = smoothPointerRef.current.y + (rawY - smoothPointerRef.current.y) * alpha;
          }

          tmpVec.x = smoothPointerRef.current.x;
          tmpVec.y = smoothPointerRef.current.y;
          setPointer({ x: tmpVec.x, y: tmpVec.y });
        } else {
          setPointer(null);
          smoothPointerRef.current = null;
        }

        // 2) 两指平移（不打开图片时）：让树跟随手势在屏幕中移动
        if (!isPhotoOpen && isTwoFingers) {
          const middleTip = landmarks[12];
          const centerX = (indexTip.x + middleTip.x) / 2;
          const centerY = (indexTip.y + middleTip.y) / 2;
          // 映射到世界坐标（经验值：与子项目保持接近）
          const worldX = (0.5 - centerX) * 20;
          const worldY = (0.5 - centerY) * 12;
          setPanOffset({ x: worldX, y: worldY });
          setHoverProgress(0);
        }

        // 4) 旋转加速（FORMED 状态）：用手掌左右位移给 rotationBoost
        if (currentState === 'FORMED') {
          const palmX = (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3;
          const palmY = (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3;

          if (lastPalmRef.current) {
            const dx = (1.0 - palmX) - (1.0 - lastPalmRef.current.x); // x 镜像
            const dy = palmY - lastPalmRef.current.y;
            const isMoving = Math.abs(dx) > 0.003 || Math.abs(dy) > 0.003;
            if (isMoving) {
              setRotationBoost((prev) => {
                const next = prev - dx * 8.0;
                return Math.max(-3.0, Math.min(3.0, next));
              });
            }
          }
          lastPalmRef.current = { x: palmX, y: palmY };
        } else {
          lastPalmRef.current = null;
        }

        // 4) 手势切换形态（不打开图片时）
        // 注意：单指模式不参与形态切换，避免误触发
        if (!isPhotoOpen && !isSingleFinger && !isTwoFingers && results.gestures && results.gestures.length > 0) {
          const top = results.gestures[0]?.[0];
          if (top && top.score > 0.65) {
            if (top.categoryName === 'Open_Palm' && currentState === 'FORMED') {
              setState('CHAOS');
            }
            if (top.categoryName === 'Closed_Fist' && currentState === 'CHAOS') {
              setState('FORMED');
            }
          }
        }

        // 5) 预览：骨骼 + 动作提示（只在开启预览时绘制）
        const showPreview = showPreviewRef.current;
        if (showPreview) {
          // 动作提示（本地规则优先，其次用分类器）
          let label = '检测到手';
          if (isSingleFinger) label = '单指 👉（停留1秒打开）';
          else if (isTwoFingers) label = '两指 ✌️（移动树）';
          else {
            const top = results.gestures?.[0]?.[0];
            if (top && top.score > 0.6) {
              const name = top.categoryName;
              if (name === 'Open_Palm') label = '张开 ✋（展开）';
              else if (name === 'Closed_Fist') label = '握拳 ✊（成树）';
              else if (name === 'Thumb_Up') label = '点赞 👍';
              else if (name === 'Victory') label = '胜利 ✌️';
              else if (name === 'Pointing_Up') label = '指向 👆';
              else label = name;
            }
          }

          // 降频更新，避免 60fps setState
          if (label !== actionLabelRef.current.label && now - actionLabelRef.current.lastUpdateAt > 120) {
            actionLabelRef.current = { label, lastUpdateAt: now };
            setActionLabel(label);
          }

          // debug：手数量 + 推理耗时（降频，避免频繁 setState）
          if (now - debugRef.current.lastUpdateAt > 250) {
            debugRef.current.lastUpdateAt = now;
            const hands = results.landmarks?.length || 0;
            setDebugLine(`手:${hands}  推理:${inferMs.toFixed(1)}ms  Delegate:${delegateRef.current || '未知'}`);
          }

          const canvas = previewCanvasRef.current;
          const vision = visionRef.current;
          if (canvas && vision) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              try {
                const drawingUtils = new vision.DrawingUtils(ctx);
                const color = 'rgba(0, 255, 200, 0.9)';
                for (const hand of results.landmarks) {
                  drawingUtils.drawConnectors(hand, vision.GestureRecognizer.HAND_CONNECTIONS, { color, lineWidth: 2 });
                  drawingUtils.drawLandmarks(hand, { color: 'rgba(0, 255, 200, 0.7)', lineWidth: 1, radius: 2 });
                }
              } catch {
                // 某些环境 DrawingUtils 不可用时，忽略绘制
              }
            }
          }
        }
      } else {
        setPointer(null);
        setHoverProgress(0);
        smoothPointerRef.current = null;
        lastPalmRef.current = null;
        // 没检测到手也给出 debug，便于排查是否“真的没识别”还是 UI 没更新
        if (showPreviewRef.current && now - debugRef.current.lastUpdateAt > 250) {
          debugRef.current.lastUpdateAt = now;
          setDebugLine(`手:0  推理:${inferMs.toFixed(1)}ms  Delegate:${delegateRef.current || '未知'}`);
        }
      }
    };

    setup();

    return () => {
      mounted = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      setPointer(null);
      setHoverProgress(0);
      setGestureStream(null);

      // 强制释放摄像头（不要依赖 videoRef，因为 React 的 passive effect cleanup 可能拿不到 ref）
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      streamRef.current = null;

      const pv = previewVideoRef.current;
      if (pv) {
        pv.srcObject = null;
      }

      // 释放识别器资源（若存在）
      try {
        const maybeClose = recognizerRef.current as unknown as { close?: () => void };
        maybeClose.close?.();
      } catch {
        // ignore
      }
      recognizerRef.current = null;
    };
  }, [
    setGestureStream,
    setHoverProgress,
    setPanOffset,
    setPointer,
    setRotationBoost,
    setState,
    tmpVec,
  ]);

  const statusText =
    status === 'module_loading'
      ? '视觉识别：加载模块中…'
      : status === 'camera_loading'
        ? '视觉识别：请求摄像头…'
        : status === 'model_loading'
          ? '视觉识别：加载模型中…'
          : status === 'running'
            ? '视觉识别：运行中（手势可控）'
            : `视觉识别：启动失败${errorMsg ? `：${errorMsg}` : ''}`;

  return (
    <>
      {/* 左上角：摄像头预览 + 骨骼 + 当前动作 */}
      <div
        className="fixed z-[70] pointer-events-none transition-opacity duration-200 right-4 bottom-24 md:left-6 md:top-24 md:right-auto md:bottom-auto"
        style={{ opacity: showGesturePreview ? 1 : 0 }}
      >
        <div className="w-[200px] md:w-[220px] rounded-xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur shadow-lg">
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
              <div className="text-xs text-white/70">摄像头预览</div>
              <div className="text-[10px] text-white/50">{status === 'running' ? '运行中' : '加载中'}</div>
            </div>
            {/* 状态提示：移到左上角预览里（不挡底部操作提示），隐藏摄像头时一起隐藏 */}
            <div className="px-3 py-1.5 text-[10px] text-white/70 bg-black/30 border-b border-white/10">
              {statusText}
            </div>
            <div className="relative w-full aspect-video bg-black">
              {!gestureStream && (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/50">
                  {statusText}
                </div>
              )}
              <video
                ref={previewVideoRef}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
                autoPlay
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={previewCanvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ transform: 'scaleX(-1)' }}
              />
            </div>
            <div className="px-3 py-2 text-[11px] text-emerald-200 bg-black/30">
              动作：{actionLabel}
            </div>
            <div className="px-3 py-1.5 text-[10px] text-white/60 bg-black/40">
              {debugLine || '调试信息：—'}
            </div>
        </div>
      </div>
    </>
  );
};

export default GestureInput;


