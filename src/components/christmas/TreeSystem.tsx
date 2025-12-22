import React, { useRef, useMemo, useContext, useState, useEffect } from 'react';
import { useFrame, extend, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial, Text, Line } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import { TreeContext, ParticleData, TreeContextType } from './types';

const FoliageMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color('#004225'), uColorAccent: new THREE.Color('#00fa9a'), uPixelRatio: 1 },
  `uniform float uTime; uniform float uPixelRatio; attribute float size; varying vec3 vPosition; varying float vBlink; vec3 curl(float x, float y, float z) { float eps=1.,n1,n2,a,b;x/=eps;y/=eps;z/=eps;vec3 curl=vec3(0.);n1=sin(y+cos(z+uTime));n2=cos(x+sin(z+uTime));curl.x=n1-n2;n1=sin(z+cos(x+uTime));n2=cos(y+sin(x+uTime));curl.z=n1-n2;n1=sin(x+cos(y+uTime));n2=cos(z+sin(y+uTime));curl.z=n1-n2;return curl*0.1; } void main() { vPosition=position; vec3 distortedPosition=position+curl(position.x,position.y,position.z); vec4 mvPosition=modelViewMatrix*vec4(distortedPosition,1.0); gl_Position=projectionMatrix*mvPosition; gl_PointSize=size*uPixelRatio*(60.0/-mvPosition.z); vBlink=sin(uTime*2.0+position.y*5.0+position.x); }`,
  `uniform vec3 uColor; uniform vec3 uColorAccent; varying float vBlink; void main() { vec2 xy=gl_PointCoord.xy-vec2(0.5); float ll=length(xy); if(ll>0.5) discard; float strength=pow(1.0-ll*2.0,3.0); vec3 color=mix(uColor,uColorAccent,smoothstep(-0.8,0.8,vBlink)); gl_FragColor=vec4(color,strength); }`
);
extend({ FoliageMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    foliageMaterial: any
    shimmerMaterial: any
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
  
  // 获取项目索引对应的颜色
  const projectIndex = id.split('-')[1] || '0';
  const projectColor = projectColors[projectIndex] || '#666666';

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (url) {
      onSelect(url);
    }
  };

  const frameWidth = 1.6;
  const frameHeight = 0.9;
  const photoWidth = frameWidth * 0.9;
  const photoHeight = frameHeight * 0.9;

  return (
    <group 
      position={position} 
      rotation={rotation} 
      scale={hovered ? scale * 1.15 : scale}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* 相框背景 */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[frameWidth, frameHeight, 0.02]} />
        <meshStandardMaterial 
          color={hovered ? "#ffffee" : "#ffffff"} 
          roughness={0.2} 
          metalness={0.1} 
        />
      </mesh>
      {/* 照片区域 - 正面 */}
      <mesh position={[0, 0, 0.015]}>
        <planeGeometry args={[photoWidth, photoHeight]} />
        {shouldLoad && url ? (
          <PhotoTextureMaterial url={url} fallbackColor={projectColor} />
        ) : (
          <meshBasicMaterial 
            color={projectColor}
          />
        )}
      </mesh>
      {/* 照片区域 - 背面 */}
      <mesh position={[0, 0, -0.015]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[photoWidth, photoHeight]} />
        {shouldLoad && url ? (
          <PhotoTextureMaterial url={url} fallbackColor={projectColor} />
        ) : (
          <meshBasicMaterial 
            color={projectColor}
          />
        )}
      </mesh>
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
    
    return () => {
      cancelled = true;
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
    pointer, 
    clickTrigger, 
    setSelectedPhotoUrl, 
    selectedPhotoUrl, 
    panOffset,
    showText,
    setPhotoTargets,
    isRotationPaused,
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
  const lineRef = useRef<any>(null);

  const [photoObjects, setPhotoObjects] = useState<{ id: string; url: string; ref: React.MutableRefObject<THREE.Group | null>; data: ParticleData; pos: THREE.Vector3; rot: THREE.Euler; scale: number; }[]>([]);

  const { foliageData, photosData, lightsData } = useMemo(() => {
    const particleCount = 4500;
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
      sizes[i] = Math.random() * 1.5 + 0.5;
    }

    const lightCount = 300;
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

    // 项目照片数据 - 使用代理路径避免 CORS
    const projectPhotos = [
      { url: '/api/images/719dd328-3fee-4364-80a7-fb7a2a4e2881/1765715886689-蝎子.png', year: 2022, month: '01', title: '仿生机械蝎子' },
      { url: '/api/images/719dd328-3fee-4364-80a7-fb7a2a4e2881/1765715886689-医疗.png', year: 2022, month: '10', title: '新冠检测设备' },
      { url: '/api/images/719dd328-3fee-4364-80a7-fb7a2a4e2881/1765715886688-车.png', year: 2024, month: '04', title: '无人车-无人机系统' },
      { url: '/api/images/719dd328-3fee-4364-80a7-fb7a2a4e2881/1765716162171-vip.png', year: 2025, month: '02', title: '会员中心' },
      { url: '/api/images/719dd328-3fee-4364-80a7-fb7a2a4e2881/1765716162170-smart.png', year: 2025, month: '06', title: '智能工具平台' },
    ];
    
    const photoCount = projectPhotos.length;
    const photos: ParticleData[] = [];

    for (let i = 0; i < photoCount; i++) {
      const photo = projectPhotos[i];

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
      const r = 12 + Math.random() * 4;

      const chaosX = r * Math.sin(phi) * Math.cos(theta);
      const chaosY = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      const chaosZ = r * Math.cos(phi);

      photos.push({
        id: `photo-${i}`,
        type: 'PHOTO',
        year: photo.year,
        month: photo.month,
        chaosPos: [chaosX, chaosY, chaosZ],
        treePos: [treeX, treeY, treeZ],
        chaosRot: [(Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.1],
        treeRot: [0, -angle + Math.PI / 2, 0],
        scale: 0.9 + Math.random() * 0.3,
        image: photo.url,
        color: 'white'
      });
    }
    return { foliageData: { current: foliage, chaos: foliageChaos, tree: foliageTree, sizes }, photosData: photos, lightsData: { chaos: lightChaos, tree: lightTree, count: lightCount } };
  }, []);

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
    setPhotoTargets(targets as any);
  }, [photosData, setPhotoTargets]);

  const photoOpenTimeRef = useRef<number>(0);

  // 点击/交互检测
  useEffect(() => {
    if (state === 'CHAOS' && pointer) {
      if (selectedPhotoUrl) {
        if (Date.now() - photoOpenTimeRef.current < 3000) return;
      }

      const ndcX = pointer.x * 2 - 1;
      const ndcY = -(pointer.y * 2) + 1;

      let closestPhotoId: string | null = null;
      let minDistance = Infinity;
      const SELECTION_THRESHOLD = 0.05;

      photoObjects.forEach(obj => {
        if (!obj.ref.current) return;
        const worldPos = new THREE.Vector3();
        obj.ref.current.getWorldPosition(worldPos);
        const screenPos = worldPos.clone().project(camera);

        if (screenPos.z < 1) {
          const dist = Math.hypot(screenPos.x - ndcX, screenPos.y - ndcY);
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
      // @ts-ignore
      pointsRef.current.material.uniforms.uTime.value = state3d.clock.getElapsedTime();
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
      const dummy = new THREE.Object3D();
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
        dummy.position.set(fx, y, fz);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        lightsRef.current.setMatrixAt(i, dummy.matrix);
      }
      lightsRef.current.instanceMatrix.needsUpdate = true;
    }

    photoObjects.forEach(obj => {
      if (obj.ref.current) {
        obj.ref.current.traverse((child) => {
          // @ts-ignore
          if (child.material && child.material.uniforms && child.material.uniforms.uTime) {
            // @ts-ignore
            child.material.uniforms.uTime.value = state3d.clock.getElapsedTime() + parseInt(obj.id.split('-')[1] || '0');
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

    // 更新连接线的点位置
    if (lineRef.current && state === 'FORMED') {
      const points: THREE.Vector3[] = [];
      photoObjects.forEach(obj => {
        if (obj.ref.current) {
          const pos = obj.ref.current.position;
          points.push(new THREE.Vector3(pos.x, pos.y, pos.z));
        }
      });
      if (points.length >= 2) {
        lineRef.current.geometry.setPositions(points.flatMap(p => [p.x, p.y, p.z]));
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
          {obj.data.year && obj.data.month && showText && (
            <group position={[0, 0.65, 0.05]}>
              <Text
                position={[0.01, -0.01, -0.01]}
                fontSize={0.18}
                maxWidth={1.2}
                color="#000000"
                anchorX="center"
                anchorY="bottom"
                fillOpacity={0.5}
              >
                {`${obj.data.year}-${obj.data.month}`}
              </Text>
              <Text
                fontSize={0.18}
                maxWidth={1.2}
                color="#ffd700"
                anchorX="center"
                anchorY="bottom"
                fillOpacity={state === 'FORMED' ? 1 : 0.9}
              >
                {`${obj.data.year}-${obj.data.month}`}
              </Text>
            </group>
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
