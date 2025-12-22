import React, { useContext, useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import TreeSystem from './TreeSystem';
import CrystalOrnaments from './CrystalOrnaments';
import { TreeContext, TreeContextType } from './types';

// 检测是否为移动设备
const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth < 768;
};

// 相机控制器组件
const CameraController = () => {
  const { 
    cameraView, 
    setCameraView,
    state, 
    autoPlay, 
    photoTargets, 
    setSelectedPhotoUrl,
    setIsRotationPaused,
    treeRotationAngle
  } = useContext(TreeContext) as TreeContextType;
  
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  
  // 漫游状态
  const [tourIndex, setTourIndex] = useState(0);
  const [tourStep, setTourStep] = useState<'WAITING' | 'ZOOM_IN' | 'HOVERING' | 'ZOOM_OUT'>('WAITING');
  const tourTimerRef = useRef(0);
  const vec = useMemo(() => new THREE.Vector3(), []);
  const targetVec = useMemo(() => new THREE.Vector3(), []);
  const mouseNdc = useMemo(() => new THREE.Vector2(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const rayDir = useMemo(() => new THREE.Vector3(), []);
  const toCenterDir = useMemo(() => new THREE.Vector3(), []);
  const r0 = useMemo(() => new THREE.Vector3(), []);
  const treeCenter = useMemo(() => new THREE.Vector3(0, -2, 0), []); // 树干旋转轴中心（树整体 group 在 y=-2）

  // 视角配置 - target 都指向树干中心 (0, 3, 0)
  const views: Record<string, { pos: [number, number, number], target: [number, number, number] }> = {
    DEFAULT: { pos: [0, 0, 18], target: [0, -2, 0] },       // 默认：正面平视（偏向全景）
    FRONT: { pos: [0, 0, 18], target: [0, -2, 0] },         // 正面视角
    TOP: { pos: [0, 24, 10], target: [0, -2, 0] },          // 俯视：能看到整棵树
    // 仰视：距离更远 + target 更靠近树中部，确保整棵树可见
    BOTTOM: { pos: [0, -14, 32], target: [0, -2, 0] },
    SIDE_FAR: { pos: [26, 4, 26], target: [0, -2, 0] },     // 远景
    CLOSEUP: { pos: [0, 0, 10], target: [0, -2, 0] },        // 近景
  };

  // 固定相机位置 (在树外侧，正前方)
  const CAMERA_ORBIT_RADIUS = 18;
  const CAMERA_FIXED_ANGLE = 0; // 相机固定在 Z 轴正方向 (角度 0)

  // 当进入自动播放时，初始化漫游
  useEffect(() => {
    if (autoPlay) {
      setTourIndex(0);
      setTourStep('WAITING');
      setCameraView('Dynamic');
      setIsRotationPaused(false); // 开始时树在转
    } else {
      setCameraView('MANUAL');
      setSelectedPhotoUrl(null);
      setIsRotationPaused(false);
      // 退出漫游时，确保旋转轴回到树干中心（避免 target 偏移导致“绕偏了”）
      if (controlsRef.current) {
        controlsRef.current.target.copy(treeCenter);
        controlsRef.current.update();
      }
    }
  }, [autoPlay, setCameraView, setSelectedPhotoUrl, setIsRotationPaused, treeCenter]);

  // 自定义“朝鼠标/触摸点缩放”，同时保持旋转轴固定在树干中心
  // 取舍：不使用 OrbitControls.zoomToCursor（它会改变 target，导致旋转轴漂移）
  useEffect(() => {
    const dom = gl.domElement;
    const MIN_DISTANCE = 3;
    const MAX_DISTANCE = 60;
    const ZOOM_SPEED = 1.0;

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    const zoomTowardsPointer = (clientX: number, clientY: number, scale: number) => {
      if (!controlsRef.current) return;
      if (autoPlay) return;

      // 如果用户缩放/双指缩放，直接切到手动，避免被预设视角 useFrame 抢回去
      if (cameraView !== 'MANUAL') {
        setCameraView('MANUAL');
      }

      const rect = dom.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;

      mouseNdc.set(x, y);
      raycaster.setFromCamera(mouseNdc, camera);
      rayDir.copy(raycaster.ray.direction).normalize();

      // 确保缩放方向大致“朝向树”，否则在空白处滚轮会出现奇怪的位移
      toCenterDir.copy(treeCenter).sub(camera.position).normalize();
      if (rayDir.dot(toCenterDir) < 0.15) {
        rayDir.copy(toCenterDir);
      }

      const currentDist = camera.position.distanceTo(treeCenter);
      const nextDist = clamp(currentDist * scale, MIN_DISTANCE, MAX_DISTANCE);

      // 解方程：|(C + d*m) - P| = nextDist
      // m^2 + 2(r0·d)m + (|r0|^2 - nextDist^2) = 0
      r0.copy(camera.position).sub(treeCenter);
      const b = r0.dot(rayDir);
      const c = r0.lengthSq() - nextDist * nextDist;
      const disc = b * b - c;

      let m: number;
      if (disc >= 0) {
        // 选较小的根，获得更自然的推进/拉远
        m = -b - Math.sqrt(disc);
      } else {
        // 极端情况下回退到沿“指向树中心”的方向缩放
        const fallbackDir = toCenterDir;
        r0.copy(camera.position).sub(treeCenter);
        const dist = r0.length();
        const fallbackNext = nextDist;
        const delta = dist - fallbackNext;
        camera.position.addScaledVector(fallbackDir, delta);
        controlsRef.current.target.copy(treeCenter);
        controlsRef.current.update();
        return;
      }

      camera.position.addScaledVector(rayDir, m);

      // 永远锁定旋转轴在树干中心
      controlsRef.current.target.copy(treeCenter);
      controlsRef.current.update();
    };

    const onWheel: EventListener = (evt) => {
      const e = evt as WheelEvent;
      // 在画布上滚轮时不让页面滚动
      e.preventDefault();

      // 模拟 OrbitControls 的缩放阶梯
      const step = Math.pow(0.95, ZOOM_SPEED);
      const scale = e.deltaY < 0 ? step : 1 / step;
      zoomTowardsPointer(e.clientX, e.clientY, scale);
    };

    // 双指缩放（触摸）
    let pinching = false;
    let lastDistance = 0;
    const onTouchStart: EventListener = (evt) => {
      const e = evt as TouchEvent;
      if (autoPlay) return;
      if (e.touches.length === 2) {
        pinching = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastDistance = Math.hypot(dx, dy);
        e.preventDefault();
      }
    };
    const onTouchMove: EventListener = (evt) => {
      const e = evt as TouchEvent;
      if (!pinching) return;
      if (autoPlay) return;
      if (e.touches.length !== 2) return;

      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (dist <= 0) return;

      // 手势“张开” => dist 变大 => ratio < 1 => 拉近（放大）
      const ratio = lastDistance / dist;
      lastDistance = dist;

      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      zoomTowardsPointer(centerX, centerY, ratio);
      e.preventDefault();
    };
    const onTouchEnd: EventListener = (evt) => {
      const e = evt as TouchEvent;
      if (e.touches.length < 2) {
        pinching = false;
      }
    };

    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: false });
    dom.addEventListener('touchmove', onTouchMove, { passive: false });
    dom.addEventListener('touchend', onTouchEnd, { passive: false });
    dom.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      dom.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [autoPlay, camera, cameraView, gl.domElement, mouseNdc, raycaster, rayDir, r0, setCameraView, toCenterDir, treeCenter]);

  useFrame((state3d, delta) => {
    // 1. MANUAL 模式：完全由 OrbitControls 接管
    if (cameraView === 'MANUAL') {
      return;
    }

    // 2. 自动漫游模式 (autoPlay 开启且 photoTargets 准备好)
    if (autoPlay && photoTargets.length > 0 && controlsRef.current) {
      const currentTarget = photoTargets[tourIndex];
      const baseAngle =
        typeof currentTarget.baseAngle === 'number'
          ? currentTarget.baseAngle
          : Math.atan2(currentTarget.pos[2], currentTarget.pos[0]);
      
      // 计算照片当前的世界角度 (基础角度 + 树旋转角度)
      const photoWorldAngle = baseAngle + treeRotationAngle;
      
      // 照片当前的世界坐标
      const photoRadius = Math.sqrt(currentTarget.pos[0] ** 2 + currentTarget.pos[2] ** 2);
      const photoWorldX = Math.cos(photoWorldAngle) * photoRadius;
      const photoWorldZ = Math.sin(photoWorldAngle) * photoRadius;
      const photoWorldY = currentTarget.pos[1] - 2; // 减去 group 的 Y 偏移
      const photoWorldPos = new THREE.Vector3(photoWorldX, photoWorldY, photoWorldZ);
      
      // 相机固定位置 (在树的正前方外侧，Z 轴正方向)
      const cameraFixedPos = new THREE.Vector3(
        0, // X = 0，正前方
        photoWorldY + 1.5, // 稍微高于照片
        CAMERA_ORBIT_RADIUS // Z 轴正方向
      );
      
      // 近景位置 (从照片正面方向靠近)
      // 照片朝外，所以相机应该在照片的外侧（从圆心向外的方向）
      // 照片位置的方向向量（归一化）
      const dirX = photoWorldX / photoRadius;
      const dirZ = photoWorldZ / photoRadius;
      
      // 相机在照片正前方，距离照片 closeDist
      const closeDist = 4.0;
      const closePos = new THREE.Vector3(
        photoWorldX + dirX * closeDist,
        photoWorldY + 0.3, // 稍微高一点点
        photoWorldZ + dirZ * closeDist
      );

      // 检查照片是否转到了相机正前方 (Z 轴正方向，即角度接近 0)
      // 归一化角度到 -PI ~ PI
      let angleDiff = photoWorldAngle - CAMERA_FIXED_ANGLE;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      const isPhotoInFront = Math.abs(angleDiff) < 0.15; // 约 8.6 度的容差

      if (tourStep === 'WAITING') {
        // 相机保持在固定位置，等待照片转到正前方
        camera.position.lerp(cameraFixedPos, 2.0 * delta);
        controlsRef.current.target.lerp(new THREE.Vector3(0, photoWorldY, 0), 2.0 * delta);
        
        if (isPhotoInFront) {
          // 照片到达正前方，暂停树旋转，开始推进
          setIsRotationPaused(true);
          setTourStep('ZOOM_IN');
        }
      } else if (tourStep === 'ZOOM_IN') {
        // 推进到照片正前方近处
        camera.position.lerp(closePos, 2.5 * delta);
        controlsRef.current.target.lerp(photoWorldPos, 2.5 * delta);
        
        if (camera.position.distanceTo(closePos) < 0.5) {
          setTourStep('HOVERING');
          tourTimerRef.current = state3d.clock.getElapsedTime();
        }
      } else if (tourStep === 'HOVERING') {
        // 悬停查看 - 保持相机正对照片
        camera.position.lerp(closePos, 0.5 * delta);
        controlsRef.current.target.lerp(photoWorldPos, 0.5 * delta);
        
        if (state3d.clock.getElapsedTime() - tourTimerRef.current > 3.0) {
          setTourStep('ZOOM_OUT');
        }
      } else if (tourStep === 'ZOOM_OUT') {
        // 拉远回到固定位置
        camera.position.lerp(cameraFixedPos, 2.5 * delta);
        controlsRef.current.target.lerp(new THREE.Vector3(0, photoWorldY, 0), 2.5 * delta);
        
        if (camera.position.distanceTo(cameraFixedPos) < 1.0) {
          // 切换到下一张，恢复树旋转
          setTourIndex((prev) => (prev + 1) % photoTargets.length);
          setTourStep('WAITING');
          setIsRotationPaused(false);
        }
      }
      
      controlsRef.current.update();
      return;
    }

    // 3. 预设视角切换
    if (cameraView !== 'Dynamic' && views[cameraView]) {
      const targetConfig = views[cameraView];
      
      vec.set(...targetConfig.pos);
      if (state === 'CHAOS' && cameraView === 'DEFAULT') {
        const t = state3d.clock.getElapsedTime();
        vec.y += Math.cos(t * 0.3) * 0.3;
      }
      
      camera.position.lerp(vec, 3 * delta);

      if (controlsRef.current) {
        targetVec.set(...targetConfig.target);
        controlsRef.current.target.lerp(targetVec, 3 * delta);
        controlsRef.current.update();
      }
    }
  });

  // 重置 target 到树中心的函数
  const resetTargetToCenter = () => {
    if (controlsRef.current) {
      controlsRef.current.target.copy(treeCenter);
    }
  };

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}  // 禁用平移，保持旋转轴在树中心
      // 禁用默认缩放，改用自定义“朝鼠标/触摸点缩放”，以同时满足：缩放跟随指向 + 旋转轴不漂移
      enableZoom={false}
      minDistance={3}
      maxDistance={60}
      // 放宽角度限制，允许查看树的任意角度
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI - 0.1}
      enableDamping={true}
      dampingFactor={0.05}
      // 保持 target 固定，不使用 zoomToCursor（会导致旋转轴偏移）
      target={[0, -2, 0]}
      onStart={() => {
        if (cameraView !== 'MANUAL' && !autoPlay) {
          setCameraView('MANUAL');
        }
      }}
      onEnd={() => {
        // 每次操作结束后，确保 target 回到树中心
        resetTargetToCenter();
      }}
    />
  );
};

const Experience: React.FC = () => {
  // 移动端性能优化配置
  const mobile = useMemo(() => isMobile(), []);
  
  // 移动端相机更远，看到更完整的树
  const cameraPosition: [number, number, number] = mobile ? [0, 0, 28] : [0, 0, 18];
  
  return (
    <Canvas
      shadows={!mobile} // 移动端禁用阴影
      dpr={mobile ? [1, 1] : [1, 1.5]} // 移动端降低分辨率
      camera={{ position: cameraPosition, fov: 45, near: 0.1, far: 100 }}
      gl={{
        antialias: false,
        alpha: true,
        toneMapping: THREE.ReinhardToneMapping,
        toneMappingExposure: 1.5,
        stencil: false,
        depth: true,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
      }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          console.warn('WebGL context lost, attempting recovery...');
        });
        gl.domElement.addEventListener('webglcontextrestored', () => {
          console.log('WebGL context restored');
        });
      }}
    >
      <ambientLight intensity={0.4} color="#001133" />
      <spotLight
        position={[10, 20, 10]}
        angle={0.5}
        penumbra={1}
        intensity={8}
        color="#fff0dd"
        castShadow={!mobile}
      />
      <pointLight position={[-10, -5, -10]} intensity={3} color="#004225" />
      <pointLight position={[0, 0, 0]} intensity={1} color="#ffaa00" distance={10} />

      {/* 星空和闪烁 - 仅桌面端显示，移动端完全禁用以提升性能 */}
      {!mobile && (
        <>
          <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
          <Sparkles count={200} scale={25} size={4} speed={0.3} opacity={0.6} color="#ffd700" />
          <Sparkles count={150} scale={30} size={3} speed={0.2} opacity={0.4} color="#ffffcc" />
          <Sparkles count={150} scale={20} size={2.5} speed={0.5} opacity={0.5} color="#ffffff" />
        </>
      )}

      {/* Environment - 仅桌面端 */}
      {!mobile && <Environment preset="city" />}

      <group position={[0, -2, 0]}>
        <TreeSystem />
        {/* 水晶装饰 - 移动端禁用以提升性能 */}
        {!mobile && <CrystalOrnaments />}
      </group>

      <CameraController />

      {/* 后处理效果 - 移动端完全禁用以提升性能 */}
      {!mobile && (
        <EffectComposer disableNormalPass>
          <Bloom
            luminanceThreshold={1.0}
            mipmapBlur
            intensity={0.5}
            radius={0.3}
            levels={6}
          />
          <Noise opacity={0.03} />
          <Vignette eskil={false} offset={0.1} darkness={0.8} />
        </EffectComposer>
      )}
    </Canvas>
  );
};

export default Experience;
