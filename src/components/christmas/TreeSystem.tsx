import React, { useRef, useMemo, useContext, useState, useEffect } from 'react';
import type { ReactThreeFiber, ThreeEvent } from '@react-three/fiber';
import { useFrame, extend, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial, Html, Line } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import type { Line2, LineSegments2 } from 'three-stdlib';
import { TreeContext, ParticleData, TreeContextType } from './types';

// 检测是否为移动设备
const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth < 768;
};

// 性能配置 - 根据设备类型调整（移动端保持视觉效果，仅微调）
const getPerformanceConfig = () => {
  const mobile = isMobile();
  return {
    particleCount: mobile ? 3500 : 4500,  // 移动端仅减少约22%
    lightCount: mobile ? 250 : 300,       // 移动端仅减少约17%
    enableCurl: true,                      // 保持curl动画效果
    useMobileHtmlPhoto: mobile,            // 移动端使用HTML图片替代纹理
  };
};

const FoliageMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color('#004225'), uColorAccent: new THREE.Color('#00fa9a'), uPixelRatio: 1 },
  `uniform float uTime; uniform float uPixelRatio; attribute float size; varying vec3 vPosition; varying float vBlink; vec3 curl(float x, float y, float z) { float eps=1.,n1,n2,a,b;x/=eps;y/=eps;z/=eps;vec3 curl=vec3(0.);n1=sin(y+cos(z+uTime));n2=cos(x+sin(z+uTime));curl.x=n1-n2;n1=sin(z+cos(x+uTime));n2=cos(y+sin(x+uTime));curl.z=n1-n2;n1=sin(x+cos(y+uTime));n2=cos(z+sin(y+uTime));curl.z=n1-n2;return curl*0.1; } void main() { vPosition=position; vec3 distortedPosition=position+curl(position.x,position.y,position.z); vec4 mvPosition=modelViewMatrix*vec4(distortedPosition,1.0); gl_Position=projectionMatrix*mvPosition; gl_PointSize=size*uPixelRatio*(60.0/-mvPosition.z); vBlink=sin(uTime*2.0+position.y*5.0+position.x); }`,
  `uniform vec3 uColor; uniform vec3 uColorAccent; varying float vBlink; void main() { vec2 xy=gl_PointCoord.xy-vec2(0.5); float ll=length(xy); if(ll>0.5) discard; float strength=pow(1.0-ll*2.0,3.0); vec3 color=mix(uColor,uColorAccent,smoothstep(-0.8,0.8,vBlink)); gl_FragColor=vec4(color,strength); }`
);
extend({ FoliageMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    foliageMaterial: ReactThreeFiber.Object3DNode<THREE.ShaderMaterial, typeof FoliageMaterial>;
    shimmerMaterial: ReactThreeFiber.Object3DNode<THREE.ShaderMaterial, typeof ShimmerMaterial>;
  }
}

const ShimmerMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color('#ffffff') },
  `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  `uniform float uTime; uniform vec3 uColor; varying vec2 vUv; void main() { float pos = mod(uTime * 0.8, 2.5) - 0.5; float bar = smoothstep(0.0, 0.2, 0.2 - abs(vUv.x + vUv.y * 0.5 - pos)); float alpha = bar * 0.05; gl_FragColor = vec4(uColor, alpha); }`
);
extend({ ShimmerMaterial });

// 项目颜色映射
const projectColors: { [key: string]: string } = {
  '0': '#D32F2F', // 蝎子 - 红色
  '1': '#1976D2', // 医疗 - 蓝色
  '2': '#7B1FA2', // 车 - 紫色
  '3': '#388E3C', // VIP - 绿色
  '4': '#F57C00', // Smart - 橙色
};

// 图片尺寸缓存
const imageDimensionsCache = new Map<string, { width: number; height: number }>();

// 获取图片尺寸
const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  if (imageDimensionsCache.has(url)) {
    return Promise.resolve(imageDimensionsCache.get(url)!);
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      imageDimensionsCache.set(url, dims);
      resolve(dims);
    };
    img.onerror = () => {
      // 默认 16:9 比例
      resolve({ width: 16, height: 9 });
    };
    img.src = url;
  });
};

const PolaroidPhoto: React.FC<{ 
  url: string; 
  position: THREE.Vector3; 
  rotation: THREE.Euler; 
  scale: number; 
  id: string; 
  shouldLoad: boolean; 
  year: number; 
  title?: string;
  onSelect: (url: string) => void 
}> = ({ url, position, rotation, scale, id, shouldLoad, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(16 / 9); // 默认 16:9
  const mobile = useMemo(() => isMobile(), []);
  
  // 获取项目索引对应的颜色
  const projectIndex = id.split('-')[1] || '0';
  const projectColor = projectColors[projectIndex] || '#666666';

  // 加载图片获取真实比例
  useEffect(() => {
    if (url) {
      getImageDimensions(url).then(dims => {
        setAspectRatio(dims.width / dims.height);
      });
    }
  }, [url]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (url) {
      onSelect(url);
    }
  };

  // 根据图片比例计算框架尺寸
  // 固定宽度，高度根据图片比例自适应
  const baseWidth = 1.6; // 固定宽度
  const frameWidth = baseWidth;
  const frameHeight = baseWidth / aspectRatio; // 高度根据比例计算
  
  // 限制高度范围，避免极端比例
  const clampedFrameHeight = Math.min(2.5, Math.max(0.6, frameHeight));
  const actualFrameWidth = clampedFrameHeight === frameHeight ? frameWidth : clampedFrameHeight * aspectRatio;
  
  const photoWidth = actualFrameWidth * 0.92;
  const photoHeight = clampedFrameHeight * 0.92;

  return (
    <group 
      position={position} 
      rotation={rotation} 
      scale={hovered ? scale * 1.15 : scale}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* 移动端：使用 HTML 直接显示图片（带边框样式） */}
      {mobile && shouldLoad && url ? (
        <Html
          position={[0, 0, 0.02]}
          center
          transform
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            padding: '4px',
            background: hovered ? '#ffffee' : '#ffffff',
            borderRadius: '3px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            <img 
              src={url} 
              alt=""
              style={{
                width: '80px',  // 缩小图片
                height: 'auto',
                maxHeight: '100px',
                objectFit: 'contain',
                display: 'block',
                borderRadius: '2px',
              }}
            />
          </div>
        </Html>
      ) : (
        <>
          {/* 桌面端：相框背景 */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[actualFrameWidth + 0.08, clampedFrameHeight + 0.08, 0.02]} />
            <meshStandardMaterial 
              color={hovered ? "#ffffee" : "#ffffff"} 
              roughness={0.2} 
              metalness={0.1} 
            />
          </mesh>
          {/* 桌面端：使用纹理材质 - 正面 */}
          <mesh position={[0, 0, 0.015]}>
            <planeGeometry args={[photoWidth, photoHeight]} />
            {shouldLoad && url ? (
              <PhotoTextureMaterial url={url} fallbackColor={projectColor} />
            ) : (
              <meshBasicMaterial color={projectColor} />
            )}
          </mesh>
          {/* 桌面端：使用纹理材质 - 背面 */}
          <mesh position={[0, 0, -0.015]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[photoWidth, photoHeight]} />
            {shouldLoad && url ? (
              <PhotoTextureMaterial url={url} fallbackColor={projectColor} />
            ) : (
              <meshBasicMaterial color={projectColor} />
            )}
          </mesh>
        </>
      )}
    </group>
  );
};

// 全局纹理缓存，避免重复加载
const textureCache = new Map<string, THREE.Texture>();
const loadingPromises = new Map<string, Promise<THREE.Texture>>();

// 加载纹理的函数
const loadTexture = async (url: string): Promise<THREE.Texture> => {
  // 如果已经缓存，直接返回
  if (textureCache.has(url)) {
    return textureCache.get(url)!;
  }
  
  // 如果正在加载，返回同一个 Promise
  if (loadingPromises.has(url)) {
    return loadingPromises.get(url)!;
  }
  
  // 开始加载
  const promise = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');
      const blob = await response.blob();
      
      // 使用 FileReader 转换为 data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // 加载图片
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = dataUrl;
      });
      
      // 创建纹理
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      
      // 缓存纹理
      textureCache.set(url, tex);
      loadingPromises.delete(url);
      
      console.log('Texture loaded:', url);
      return tex;
    } catch (err) {
      loadingPromises.delete(url);
      console.error('Texture load error:', url, err);
      throw err;
    }
  })();
  
  loadingPromises.set(url, promise);
  return promise;
};

// 单独的纹理材质组件
const PhotoTextureMaterial: React.FC<{ url: string; fallbackColor: string }> = ({ url, fallbackColor }) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [error, setError] = useState(false);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    let cancelled = false;
    
    // 移动端延迟加载纹理，避免初始渲染时阻塞
    const delay = isMobile() ? 500 : 0;
    
    const timeoutId = setTimeout(() => {
      loadTexture(url)
        .then(tex => {
          if (!cancelled) {
            setTexture(tex);
            setError(false);
            // 强制更新材质
            if (materialRef.current) {
              materialRef.current.map = tex;
              materialRef.current.needsUpdate = true;
            }
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError(true);
          }
        });
    }, delay);
    
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [url]);

  // 当纹理变化时，强制更新材质
  useEffect(() => {
    if (texture && materialRef.current) {
      materialRef.current.map = texture;
      materialRef.current.needsUpdate = true;
    }
  }, [texture]);

  if (error || !texture) {
    return (
      <meshBasicMaterial 
        ref={materialRef}
        color={fallbackColor}
      />
    );
  }

  return (
    <meshBasicMaterial 
      ref={materialRef}
      map={texture}
      toneMapped={false}
    />
  );
};

const TreeSystem: React.FC = () => {
  const { 
    state, 
    rotationSpeed, 
    rotationBoost, 
    autoPlay,
    webcamEnabled,
    photoConfigs,
    pointer, 
    clickTrigger, 
    setSelectedPhotoUrl, 
    selectedPhotoUrl, 
    panOffset,
    showText,
    setHoverProgress,
    setPhotoTargets,
    isRotationPaused,
    setIsRotationPaused,
    setTreeRotationAngle
  } = useContext(TreeContext) as TreeContextType;
  
  const { camera } = useThree();
  const pointsRef = useRef<THREE.Points>(null);
  const lightsRef = useRef<THREE.InstancedMesh>(null);
  const trunkRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const progress = useRef(0);
  const treeRotation = useRef(0);
  const currentPan = useRef({ x: 0, y: 0 });
  const lineRef = useRef<Line2 | LineSegments2 | null>(null);
  
  // 预创建可复用的对象，避免每帧创建新对象导致GC压力
  const dummyObject = useMemo(() => new THREE.Object3D(), []);
  const tempVector = useMemo(() => new THREE.Vector3(), []);

  const [photoObjects, setPhotoObjects] = useState<{ id: string; url: string; ref: React.MutableRefObject<THREE.Group | null>; data: ParticleData; pos: THREE.Vector3; rot: THREE.Euler; scale: number; }[]>([]);

  // 获取性能配置（只在组件挂载时计算一次）
  const perfConfig = useMemo(() => {
    const config = getPerformanceConfig();
    console.log(`[TreeSystem] 性能配置: 粒子=${config.particleCount}, 灯串=${config.lightCount}, HTML图片=${config.useMobileHtmlPhoto}`);
    return config;
  }, []);

  const { foliageData, lightsData } = useMemo(() => {
    const particleCount = perfConfig.particleCount;
    const foliage = new Float32Array(particleCount * 3);
    const foliageChaos = new Float32Array(particleCount * 3);
    const foliageTree = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const sphere = random.inSphere(new Float32Array(particleCount * 3), { radius: 18 });
    for (let i = 0; i < particleCount * 3; i++) foliageChaos[i] = sphere[i];
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const h = Math.random() * 14;
      const coneRadius = (14 - h) * 0.45;
      const angle = h * 3.0 + Math.random() * Math.PI * 2;
      foliageTree[i3] = Math.cos(angle) * coneRadius;
      foliageTree[i3 + 1] = h - 6;
      foliageTree[i3 + 2] = Math.sin(angle) * coneRadius;
      // 粒子大小保持一致
      sizes[i] = Math.random() * 1.5 + 0.5;
    }

    const lightCount = perfConfig.lightCount;
    const lightChaos = new Float32Array(lightCount * 3);
    const lightTree = new Float32Array(lightCount * 3);
    const lSphere = random.inSphere(new Float32Array(lightCount * 3), { radius: 20 });
    for (let i = 0; i < lightCount * 3; i++) lightChaos[i] = lSphere[i];
    for (let i = 0; i < lightCount; i++) {
      const i3 = i * 3;
      const t = i / lightCount;
      const h = t * 13;
      const coneRadius = (14 - h) * 0.48;
      const angle = t * Math.PI * 25;
      lightTree[i3] = Math.cos(angle) * coneRadius;
      lightTree[i3 + 1] = h - 6;
      lightTree[i3 + 2] = Math.sin(angle) * coneRadius;
    }

    return { foliageData: { current: foliage, chaos: foliageChaos, tree: foliageTree, sizes }, lightsData: { chaos: lightChaos, tree: lightTree, count: lightCount } };
  }, [perfConfig]);

  const photosData: ParticleData[] = useMemo(() => {
    const list = (photoConfigs || []).slice(0, 5);
    const photoCount = list.length || 5;
    const photos: ParticleData[] = [];

    // 让照片位置/尺度在编辑时保持稳定：用 index 生成确定性的“伪随机”
    const pseudo = (seed: number) => {
      const x = Math.sin(seed * 9999.123) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < list.length; i++) {
      const photo = list[i];

      // 使用与灯串相同的螺旋线逻辑
      const t = (i + 0.5) / photoCount; // 均匀分布在 0-1 之间
      const h = t * 13; // 高度范围与灯串一致 (0 到 13)
      const coneRadius = (14 - h) * 0.48; // 与灯串相同的锥形半径计算
      const angle = t * Math.PI * 25; // 与灯串相同的螺旋角度

      const treeX = Math.cos(angle) * coneRadius;
      const treeY = h - 6; // 与灯串一致的 Y 偏移
      const treeZ = Math.sin(angle) * coneRadius;

      const phi = Math.acos(1 - 2 * (i + 0.5) / photoCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const r = 12 + pseudo(i + 1) * 4;

      const chaosX = r * Math.sin(phi) * Math.cos(theta);
      const chaosY = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      const chaosZ = r * Math.cos(phi);

      photos.push({
        id: `photo-${i}`,
        type: 'PHOTO',
        chaosPos: [chaosX, chaosY, chaosZ],
        treePos: [treeX, treeY, treeZ],
        chaosRot: [(pseudo(i + 11) - 0.5) * 0.2, (pseudo(i + 21) - 0.5) * 0.2, (pseudo(i + 31) - 0.5) * 0.1],
        treeRot: [0, -angle + Math.PI / 2, 0],
        scale: 0.9 + pseudo(i + 41) * 0.3,
        image: photo.url,
        title: photo.title || '',
        color: 'white',
      });
    }

    return photos;
  }, [photoConfigs]);

  useEffect(() => {
    setPhotoObjects(photosData.map(p => ({ id: p.id, url: p.image!, ref: React.createRef(), data: p, pos: new THREE.Vector3(), rot: new THREE.Euler(), scale: p.scale })));
  }, [photosData]);

  // 将照片目标位置传递给 Context，供漫游使用
  // 包含静态的 treePos 和 baseAngle 信息
  useEffect(() => {
    const targets = photosData.map(p => {
      // 计算基础角度 (照片在树上的静态角度)
      const baseAngle = Math.atan2(p.treePos[2], p.treePos[0]);
      return {
        id: p.image!,
        pos: p.treePos,
        rot: p.treeRot,
        baseAngle: baseAngle // 添加基础角度
      };
    });
    setPhotoTargets(targets);
  }, [photosData, setPhotoTargets]);

  const photoOpenTimeRef = useRef<number>(0);
  const visionPausedRef = useRef(false);
  const lastVisionHoverProgressRef = useRef<number>(0);
  const visionAutoRef = useRef<{
    phase: 'IDLE' | 'AIMING' | 'OPEN' | 'COOLDOWN';
    targetId: string | null;
    aimStartAt: number;
    openedId: string | null;
    openedAt: number;
    cooldownUntil: number;
    blockedId: string | null; // 防止用户一直单指停留导致反复开关
  }>({
    phase: 'IDLE',
    targetId: null,
    aimStartAt: 0,
    openedId: null,
    openedAt: 0,
    cooldownUntil: 0,
    blockedId: null,
  });

  const setPausedByVision = (paused: boolean) => {
    if (autoPlay) return; // 自动演示时由漫游逻辑控制暂停
    if (visionPausedRef.current === paused) return;
    visionPausedRef.current = paused;
    setIsRotationPaused(paused);
  };

  // 点击/交互检测
  useEffect(() => {
    // 非视觉识别：保留旧逻辑（仅 CHAOS + 指针）
    if (state === 'CHAOS' && pointer) {
      if (selectedPhotoUrl) {
        if (Date.now() - photoOpenTimeRef.current < 3000) return;
      }

      const ndcX = pointer.x * 2 - 1;
      const ndcY = -(pointer.y * 2) + 1;

      let closestPhotoId: string | null = null;
      let minDistance = Infinity;
      const SELECTION_THRESHOLD = 0.05;

      // 复用 tempVector 进行计算
      const checkVector = tempVector;
      photoObjects.forEach(obj => {
        if (!obj.ref.current) return;
        obj.ref.current.getWorldPosition(checkVector);
        checkVector.project(camera);

        if (checkVector.z < 1) {
          const dist = Math.hypot(checkVector.x - ndcX, checkVector.y - ndcY);
          if (dist < SELECTION_THRESHOLD && dist < minDistance) {
            minDistance = dist;
            closestPhotoId = obj.data.image!;
          }
        }
      });

      if (closestPhotoId) {
        if (selectedPhotoUrl === closestPhotoId) {
          if (Date.now() - photoOpenTimeRef.current > 3000) {
            setSelectedPhotoUrl(null);
          }
        } else {
          setSelectedPhotoUrl(closestPhotoId);
          photoOpenTimeRef.current = Date.now();
        }
      } else if (selectedPhotoUrl) {
        if (Date.now() - photoOpenTimeRef.current > 3000) {
          setSelectedPhotoUrl(null);
        }
      }
    }
  }, [clickTrigger]);

  useFrame((state3d, delta) => {
    const targetProgress = state === 'FORMED' ? 1 : 0;
    progress.current = THREE.MathUtils.damp(progress.current, targetProgress, 2.0, delta);
    const ease = progress.current * progress.current * (3 - 2 * progress.current);
    
    // 如果没有暂停，则继续旋转
    if (!isRotationPaused) {
      treeRotation.current += (state === 'FORMED' ? (rotationSpeed + rotationBoost) : 0.05) * delta;
    }
    
    // 同步旋转角度到 Context
    setTreeRotationAngle(treeRotation.current);

    const targetPanX = panOffset.x;
    const targetPanY = panOffset.y;
    currentPan.current.x = THREE.MathUtils.lerp(currentPan.current.x, targetPanX, 0.2);
    currentPan.current.y = THREE.MathUtils.lerp(currentPan.current.y, targetPanY, 0.2);

    if (groupRef.current) {
      groupRef.current.position.x = currentPan.current.x;
      groupRef.current.position.y = currentPan.current.y;
    }

    if (pointsRef.current) {
      const mat = pointsRef.current.material as unknown as { uniforms?: { uTime?: { value: number } } };
      if (mat.uniforms?.uTime) {
        mat.uniforms.uTime.value = state3d.clock.getElapsedTime();
      }
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length / 3; i++) {
        const i3 = i * 3;
        const cx = foliageData.chaos[i3]; const cy = foliageData.chaos[i3 + 1]; const cz = foliageData.chaos[i3 + 2];
        const tx = foliageData.tree[i3]; const ty = foliageData.tree[i3 + 1]; const tz = foliageData.tree[i3 + 2];
        const y = THREE.MathUtils.lerp(cy, ty, ease);
        const tr = Math.sqrt(tx * tx + tz * tz);
        const tAngle = Math.atan2(tz, tx);
        const cr = Math.sqrt(cx * cx + cz * cz);
        const r = THREE.MathUtils.lerp(cr, tr, ease);
        const vortexTwist = (1 - ease) * 15.0;
        const currentAngle = tAngle + vortexTwist + treeRotation.current;
        const formedX = r * Math.cos(currentAngle);
        const formedZ = r * Math.sin(currentAngle);
        const cAngle = Math.atan2(cz, cx);
        const cRotatedX = cr * Math.cos(cAngle + treeRotation.current * 0.5);
        const cRotatedZ = cr * Math.sin(cAngle + treeRotation.current * 0.5);
        positions[i3] = THREE.MathUtils.lerp(cRotatedX, formedX, ease);
        positions[i3 + 1] = y;
        positions[i3 + 2] = THREE.MathUtils.lerp(cRotatedZ, formedZ, ease);
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (lightsRef.current) {
      // 使用预创建的 dummy 对象，避免每帧创建新对象
      for (let i = 0; i < lightsData.count; i++) {
        const i3 = i * 3;
        const cx = lightsData.chaos[i3]; const cy = lightsData.chaos[i3 + 1]; const cz = lightsData.chaos[i3 + 2];
        const tx = lightsData.tree[i3]; const ty = lightsData.tree[i3 + 1]; const tz = lightsData.tree[i3 + 2];
        const y = THREE.MathUtils.lerp(cy, ty, ease);
        const tr = Math.sqrt(tx * tx + tz * tz);
        const tAngle = Math.atan2(tz, tx);
        const cr = Math.sqrt(cx * cx + cz * cz);
        const r = THREE.MathUtils.lerp(cr, tr, ease);
        const vortexTwist = (1 - ease) * 12.0;
        const currentAngle = tAngle + vortexTwist + treeRotation.current;
        const cAngle = Math.atan2(cz, cx);
        const cRotatedX = cr * Math.cos(cAngle + treeRotation.current * 0.3);
        const cRotatedZ = cr * Math.sin(cAngle + treeRotation.current * 0.3);
        const fx = THREE.MathUtils.lerp(cRotatedX, r * Math.cos(currentAngle), ease);
        const fz = THREE.MathUtils.lerp(cRotatedZ, r * Math.sin(currentAngle), ease);
        dummyObject.position.set(fx, y, fz);
        dummyObject.scale.setScalar(1);
        dummyObject.updateMatrix();
        lightsRef.current.setMatrixAt(i, dummyObject.matrix);
      }
      lightsRef.current.instanceMatrix.needsUpdate = true;
    }

    photoObjects.forEach(obj => {
      if (obj.ref.current) {
        obj.ref.current.traverse((child) => {
          const maybeMesh = child as unknown as { material?: unknown };
          const mat = maybeMesh.material;
          const mats = Array.isArray(mat) ? mat : mat ? [mat] : [];
          for (const m of mats) {
            const uniforms = (m as unknown as { uniforms?: { uTime?: { value: number } } }).uniforms;
            if (uniforms?.uTime) {
              uniforms.uTime.value =
                state3d.clock.getElapsedTime() + parseInt(obj.id.split('-')[1] || '0', 10);
            }
          }
        });
      }
    });

    if (trunkRef.current) {
      const trunkScale = THREE.MathUtils.smoothstep(ease, 0.3, 1.0);
      trunkRef.current.scale.set(trunkScale, ease, trunkScale);
      trunkRef.current.position.y = 1;
      trunkRef.current.rotation.y = treeRotation.current;
    }

    photoObjects.forEach((obj) => {
      if (!obj.ref.current) return;
      const { chaosPos, treePos, chaosRot, treeRot } = obj.data;
      const [cx, cy, cz] = chaosPos;
      const [tx, ty, tz] = treePos;
      const y = THREE.MathUtils.lerp(cy, ty, ease);
      const cr = Math.sqrt(cx * cx + cz * cz);
      const tr = Math.sqrt(tx * tx + tz * tz);
      const r = THREE.MathUtils.lerp(cr, tr, ease);
      const tAngle = Math.atan2(tz, tx);
      const vortexTwist = (1 - ease) * 10.0;
      const currentAngle = tAngle + vortexTwist + treeRotation.current;
      const cAngle = Math.atan2(cz, cx);
      const cRotatedX = cr * Math.cos(cAngle + treeRotation.current * 0.2);
      const cRotatedZ = cr * Math.sin(cAngle + treeRotation.current * 0.2);
      const targetX = r * Math.cos(currentAngle);
      const targetZ = r * Math.sin(currentAngle);
      obj.ref.current.position.set(THREE.MathUtils.lerp(cRotatedX, targetX, ease), y, THREE.MathUtils.lerp(cRotatedZ, targetZ, ease));
      const lookAtAngle = -currentAngle + Math.PI / 2;
      obj.ref.current.rotation.x = THREE.MathUtils.lerp(chaosRot[0], treeRot[0], ease);
      obj.ref.current.rotation.y = THREE.MathUtils.lerp(chaosRot[1], lookAtAngle, ease);
      obj.ref.current.rotation.z = THREE.MathUtils.lerp(chaosRot[2], treeRot[2], ease);
    });

    // 更新连接线的点位置 - 使用扁平数组避免创建 Vector3 对象
    if (lineRef.current && state === 'FORMED') {
      const positions: number[] = [];
      photoObjects.forEach(obj => {
        if (obj.ref.current) {
          const pos = obj.ref.current.position;
          positions.push(pos.x, pos.y, pos.z);
        }
      });
      if (positions.length >= 6) { // 至少2个点
        const line = lineRef.current;
        const geom = (line as unknown as { geometry?: { setPositions?: (positions: number[]) => void } })?.geometry;
        geom?.setPositions?.(positions);
      }
    }

    // 视觉识别（更好交互）：
    // - 单指(pointer!=null) => 暂停树自转，稳定对准
    // - 指向某张照片停留 2s => 自动打开
    // - 打开后展示 2s => 自动关闭
    // - 关闭后冷却 3s + 需要指针离开该照片才允许下一次触发（避免用户一直单指导致无限循环）
    if (webcamEnabled) {
      const now = state3d.clock.getElapsedTime();
      const OPEN_DWELL = 1.0;
      const VIEW_TIME = 2.0;
      const COOLDOWN = 3.0;
      const SELECTION_THRESHOLD = 0.085;

      const fsm = visionAutoRef.current;

      // 单指模式（pointer 有值）时暂停；打开弹窗时也暂停
      setPausedByVision(!!pointer || !!selectedPhotoUrl);

      // 计算当前指向的照片 - 使用预创建的 tempVector 避免 GC
      let targetId: string | null = null;
      let minDist = Infinity;
      if (pointer && photoObjects.length > 0) {
        const ndcX = pointer.x * 2 - 1;
        const ndcY = -(pointer.y * 2) + 1;
        for (const obj of photoObjects) {
          if (!obj.ref.current) continue;
          obj.ref.current.getWorldPosition(tempVector);
          tempVector.project(camera);
          if (tempVector.z >= 1) continue;

          const dist = Math.hypot(tempVector.x - ndcX, tempVector.y - ndcY);
          if (dist < SELECTION_THRESHOLD && dist < minDist) {
            minDist = dist;
            targetId = obj.data.image!;
          }
        }
      }

      // 只要指针离开被阻止的照片，就解除阻止
      if (fsm.blockedId && targetId !== fsm.blockedId) {
        fsm.blockedId = null;
      }

      // OPEN：自动关闭计时
      if (selectedPhotoUrl) {
        if (fsm.phase !== 'OPEN') {
          fsm.phase = 'OPEN';
          fsm.openedId = selectedPhotoUrl;
          fsm.openedAt = now;
        }

        // 弹窗期间不显示 dwell 进度
        if (lastVisionHoverProgressRef.current !== 0) {
          lastVisionHoverProgressRef.current = 0;
          setHoverProgress(0);
        }

        if (now - fsm.openedAt >= VIEW_TIME) {
          const closedId = fsm.openedId || selectedPhotoUrl;
          setSelectedPhotoUrl(null);
          fsm.phase = 'COOLDOWN';
          fsm.cooldownUntil = now + COOLDOWN;
          fsm.blockedId = closedId; // 必须离开该图才能再次触发
          fsm.targetId = null;
          fsm.aimStartAt = 0;
          fsm.openedId = null;
          fsm.openedAt = 0;
        }
        return;
      }

      // COOLDOWN：冷却中不触发
      if (fsm.phase === 'COOLDOWN') {
        if (now >= fsm.cooldownUntil && !fsm.blockedId) {
          fsm.phase = 'IDLE';
        } else {
          if (lastVisionHoverProgressRef.current !== 0) {
            lastVisionHoverProgressRef.current = 0;
            setHoverProgress(0);
          }
          return;
        }
      }

      // AIMING：停留计时
      if (pointer && targetId && (!fsm.blockedId || fsm.blockedId !== targetId)) {
        if (fsm.phase !== 'AIMING' || fsm.targetId !== targetId) {
          fsm.phase = 'AIMING';
          fsm.targetId = targetId;
          fsm.aimStartAt = now;
        }

        const p = Math.min((now - fsm.aimStartAt) / OPEN_DWELL, 1);
        if (Math.abs(p - lastVisionHoverProgressRef.current) > 0.01) {
          lastVisionHoverProgressRef.current = p;
          setHoverProgress(p);
        }

        if (p >= 1) {
          setSelectedPhotoUrl(targetId);
          photoOpenTimeRef.current = Date.now();
          fsm.phase = 'OPEN';
          fsm.openedId = targetId;
          fsm.openedAt = now;
          fsm.targetId = targetId;
          fsm.aimStartAt = 0;
          lastVisionHoverProgressRef.current = 0;
          setHoverProgress(0);
        }
      } else {
        // 无目标：清空进度与 aiming
        if (fsm.phase === 'AIMING') {
          fsm.phase = 'IDLE';
          fsm.targetId = null;
          fsm.aimStartAt = 0;
        }
        if (lastVisionHoverProgressRef.current !== 0) {
          lastVisionHoverProgressRef.current = 0;
          setHoverProgress(0);
        }
      }
    } else {
      // 退出视觉识别：复位状态机
      setPausedByVision(false);
      const fsm = visionAutoRef.current;
      fsm.phase = 'IDLE';
      fsm.targetId = null;
      fsm.aimStartAt = 0;
      fsm.openedId = null;
      fsm.openedAt = 0;
      fsm.cooldownUntil = 0;
      fsm.blockedId = null;

      if (lastVisionHoverProgressRef.current !== 0) {
        lastVisionHoverProgressRef.current = 0;
        setHoverProgress(0);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={trunkRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.8, 14, 8]} />
        <meshStandardMaterial color="#3E2723" roughness={0.9} metalness={0.1} />
      </mesh>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={foliageData.current.length / 3} array={foliageData.current} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={foliageData.sizes.length} array={foliageData.sizes} itemSize={1} />
        </bufferGeometry>
        <foliageMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <instancedMesh ref={lightsRef} args={[undefined, undefined, lightsData.count]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffddaa" emissive="#ffbb00" emissiveIntensity={3} toneMapped={false} />
      </instancedMesh>
      {photoObjects.map((obj) => (
        <group key={obj.id} ref={(el) => { obj.ref.current = el; }}>
          <PolaroidPhoto
            url={obj.url}
            position={obj.pos}
            rotation={obj.rot}
            scale={obj.scale}
            id={obj.id}
            shouldLoad={true}
            year={obj.data.year!}
            onSelect={setSelectedPhotoUrl}
          />
          {!!obj.data.title && showText && (
            <Html
              position={[0, 0.65, 0.05]}
              center
              // 跟随 3D 位置但使用浏览器字体，解决中文/emoji 方块问题
              distanceFactor={10}
              style={{ pointerEvents: 'none' }}
            >
              <div
                className="px-2 py-1 rounded-md bg-black/40 border border-white/10 text-yellow-200 text-xs whitespace-nowrap"
                style={{
                  fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
                  textShadow: '0 0 10px rgba(255, 215, 0, 0.45)',
                }}
              >
                {obj.data.title}
              </div>
            </Html>
          )}
        </group>
      ))}
      {state === 'FORMED' && photoObjects.length >= 2 && (
        <Line
          ref={lineRef}
          points={photoObjects.map(obj => new THREE.Vector3(...obj.data.treePos))}
          color="#ffd700"
          opacity={0.3}
          transparent
          lineWidth={1}
        />
      )}
    </group>
  );
};

export default TreeSystem;
