import React, { useContext, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeContext, TreeContextType } from './types';

// 检测是否为移动设备
const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth < 768;
};

const CrystalOrnaments: React.FC = () => {
  const { state, rotationSpeed, panOffset } = useContext(TreeContext) as TreeContextType;
  const groupRef = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const treeRotation = useRef(0);
  const currentPan = useRef({ x: 0, y: 0 });

  // 移动端减少装饰品数量
  const mobile = useMemo(() => isMobile(), []);

  const ornaments = useMemo(() => {
    const count = mobile ? 20 : 50; // 移动端减少到 20 个
    const items = [];
    const colors = ['#D32F2F', '#FFD700', '#2E7D32'];

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const h = t * 11 - 5.5;
      const r = (6 - (h + 5.5)) * 0.5 + 0.5;
      const angle = t * Math.PI * 13;

      const radius = 10 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const chaosPos = [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      ];

      const type = Math.random() > 0.5 ? 'sphere' : 'box';
      const color = colors[Math.floor(Math.random() * colors.length)];

      items.push({
        id: i,
        chaosPos: new THREE.Vector3(...chaosPos),
        treeCyl: { h, r, angle },
        type,
        color,
        scale: Math.random() * 0.2 + 0.15
      });
    }
    return items;
  }, [mobile]);

  useFrame((state3d, delta) => {
    const targetProgress = state === 'FORMED' ? 1 : 0;
    progress.current = THREE.MathUtils.damp(progress.current, targetProgress, 2.0, delta);
    const p = progress.current;
    const ease = p * p * (3 - 2 * p);

    const spinFactor = state === 'FORMED' ? rotationSpeed : 0.05;
    treeRotation.current += spinFactor * delta;

    const targetPanX = panOffset.x;
    const targetPanY = panOffset.y;

    currentPan.current.x = THREE.MathUtils.lerp(currentPan.current.x, targetPanX, 0.2);
    currentPan.current.y = THREE.MathUtils.lerp(currentPan.current.y, targetPanY, 0.2);

    if (groupRef.current) {
      groupRef.current.position.x = currentPan.current.x;
      groupRef.current.position.y = currentPan.current.y;

      groupRef.current.children.forEach((child, i) => {
        if (child.name === 'STAR') {
          const starY = THREE.MathUtils.lerp(10, 7.5, ease);
          child.position.set(0, starY, 0);
          child.rotation.y += delta * 0.5;
          const s = 1.0 + Math.sin(state3d.clock.elapsedTime * 3) * 0.1;
          child.scale.setScalar(THREE.MathUtils.lerp(0, s, ease));
          return;
        }

        const data = ornaments[i];
        if (!data) return;

        const cx = data.chaosPos.x;
        const cy = data.chaosPos.y;
        const cz = data.chaosPos.z;
        const cr = Math.sqrt(cx * cx + cz * cz);
        const cAngle = Math.atan2(cz, cx);

        const { h, r, angle } = data.treeCyl;

        const y = THREE.MathUtils.lerp(cy, h, ease);
        const currentR = THREE.MathUtils.lerp(cr, r, ease);

        const vortexTwist = (1 - ease) * 12.0;
        const currentAngle = angle + vortexTwist + treeRotation.current;

        const cRotatedX = cr * Math.cos(cAngle + treeRotation.current * 0.1);
        const cRotatedZ = cr * Math.sin(cAngle + treeRotation.current * 0.1);

        const tX = currentR * Math.cos(currentAngle);
        const tZ = currentR * Math.sin(currentAngle);

        child.position.x = THREE.MathUtils.lerp(cRotatedX, tX, ease);
        child.position.y = y;
        child.position.z = THREE.MathUtils.lerp(cRotatedZ, tZ, ease);

        child.rotation.x += delta * (1 - ease);
        child.rotation.y += delta * (1 - ease);
      });
    }
  });

  return (
    <group ref={groupRef}>
      {ornaments.map((o, i) => (
        <mesh key={i} scale={o.scale * (mobile ? 0.9 : 0.7)} castShadow={!mobile} receiveShadow={!mobile}>
          {/* 移动端使用更低面数的几何体 */}
          {o.type === 'sphere' && <sphereGeometry args={[1, mobile ? 8 : 16, mobile ? 8 : 16]} />}
          {o.type === 'box' && <boxGeometry args={[1, 1, 1]} />}
          <meshStandardMaterial
            color={o.color}
            roughness={0.4}
            metalness={0.3}
            emissive={o.color}
            emissiveIntensity={mobile ? 0.5 : 0.3}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}

      <mesh name="STAR" position={[0, 7.5, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color="#ffdd00"
          emissive="#ffaa00"
          emissiveIntensity={2}
          roughness={0.2}
          metalness={1.0}
          toneMapped={false}
        />
        <pointLight intensity={1.5} color="#ffaa00" distance={8} decay={2} />
      </mesh>
    </group>
  );
};

export default CrystalOrnaments;
