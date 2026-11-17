import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

export interface LanternItem { id: string; name: string; lit: boolean }

function Lantern({ item, position, onToggle }: { item: LanternItem; position: [number, number, number]; onToggle: (id: string) => void }) {
  const flame = useRef<THREE.Mesh>(null);
  const glow = useRef(item.lit ? 1 : 0);
  useFrame((s, d) => {
    const dt = Math.min(d, 0.05);
    glow.current += ((item.lit ? 1 : 0) - glow.current) * (1 - Math.exp(-6 * dt));
    if (flame.current) {
      const m = flame.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.1 + glow.current * (2.2 + Math.sin(s.clock.elapsedTime * 6 + position[0]) * 0.3);
      flame.current.scale.setScalar(0.6 + glow.current * 0.5);
    }
  });
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}>
      <mesh position={[0, 0.15, 0]} castShadow><cylinderGeometry args={[0.35, 0.45, 0.3, 8]} /><meshStandardMaterial color="#8a8478" roughness={0.9} /></mesh>
      <mesh position={[0, 0.7, 0]} castShadow><cylinderGeometry args={[0.12, 0.15, 0.8, 8]} /><meshStandardMaterial color="#9a948a" roughness={0.9} /></mesh>
      <mesh position={[0, 1.25, 0]} castShadow><boxGeometry args={[0.55, 0.45, 0.55]} /><meshStandardMaterial color="#a8a196" roughness={0.85} /></mesh>
      <mesh ref={flame} position={[0, 1.25, 0]}><sphereGeometry args={[0.2, 16, 16]} /><meshStandardMaterial color="#ffd9a0" emissive="#ffb347" emissiveIntensity={0.1} /></mesh>
      <mesh position={[0, 1.6, 0]} castShadow><coneGeometry args={[0.5, 0.35, 4]} /><meshStandardMaterial color="#6f6a62" roughness={0.9} /></mesh>
      {item.lit && <pointLight position={[0, 1.3, 0]} color="#ffb347" intensity={3} distance={4} />}
      <Text position={[0, 2.1, 0]} fontSize={0.26} color={item.lit ? "#ffe2b0" : "#f3efe6"} outlineWidth={0.015} outlineColor="#3a3530" anchorX="center">
        {item.name}
      </Text>
    </group>
  );
}

function Ground() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 512;
    const g = c.getContext("2d")!;
    g.fillStyle = "#d8cfbf"; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "#c6bba8"; g.lineWidth = 3;
    for (let r = 20; r < 380; r += 16) { g.beginPath(); g.arc(256, 256, r, 0, Math.PI * 2); g.stroke(); }
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(90,80,70,${Math.random() * 0.15})`; g.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <circleGeometry args={[14, 64]} /><meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  );
}

function Pond({ progress }: { progress: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => { if (ref.current) ref.current.position.y = 0.03 + Math.sin(s.clock.elapsedTime) * 0.01; });
  return (
    <group>
      <mesh ref={ref} rotation-x={-Math.PI / 2}><circleGeometry args={[2, 48]} /><meshStandardMaterial color="#5f8a86" roughness={0.15} metalness={0.3} /></mesh>
      <mesh position={[0, 0.3 + progress * 0.6, 0]}><icosahedronGeometry args={[0.35 + progress * 0.25, 1]} /><meshStandardMaterial color="#f3e7c9" emissive="#ffcc80" emissiveIntensity={progress * 1.5} flatShading /></mesh>
    </group>
  );
}

function rand(i: number) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

function Tree({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.6, 0]} castShadow><cylinderGeometry args={[0.1, 0.15, 1.2, 6]} /><meshStandardMaterial color="#6b4f3a" roughness={1} /></mesh>
      <mesh position={[0, 1.5, 0]} castShadow><icosahedronGeometry args={[0.7, 0]} /><meshStandardMaterial color="#6f8f5a" flatShading roughness={0.9} /></mesh>
      <mesh position={[0.3, 1.9, 0.1]} castShadow><icosahedronGeometry args={[0.45, 0]} /><meshStandardMaterial color="#e8a8b8" flatShading roughness={0.9} /></mesh>
    </group>
  );
}

const FLOWER_COLORS = ["#e98a9b", "#f2c14e", "#f6f1e7", "#b78fd6", "#ef8f5a"];
function Flower({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.015, 0.015, 0.24, 4]} /><meshStandardMaterial color="#5c7a45" /></mesh>
      <mesh position={[0, 0.26, 0]}><dodecahedronGeometry args={[0.07, 0]} /><meshStandardMaterial color={color} flatShading /></mesh>
    </group>
  );
}

function Growth({ streak, radius }: { streak: number; radius: number }) {
  const flowers = Math.min(streak * 3, 90);
  const trees = Math.min(Math.floor(streak / 3), 16);
  return (
    <group>
      {Array.from({ length: flowers }, (_, i) => {
        const a = rand(i) * Math.PI * 2, r = 2.4 + rand(i + 50) * (radius - 3);
        return <Flower key={"f" + i} color={FLOWER_COLORS[i % 5]} position={[Math.sin(a) * r, 0, Math.cos(a) * r]} />;
      })}
      {Array.from({ length: trees }, (_, i) => {
        const a = (i / Math.max(trees, 1)) * Math.PI * 2 + 0.3, r = radius + 2.2 + rand(i + 9) * 2;
        return <Tree key={"t" + i} scale={0.8 + rand(i + 3) * 0.6} position={[Math.sin(a) * r, 0, Math.cos(a) * r]} />;
      })}
    </group>
  );
}

function Celebration() {
  const ref = useRef<THREE.Points>(null);
  const N = 300;
  const { pos, vel } = useMemo(() => {
    const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3 + 1] = 0.8;
      const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3;
      vel[i * 3] = Math.cos(a) * s; vel[i * 3 + 1] = 3 + Math.random() * 4; vel[i * 3 + 2] = Math.sin(a) * s;
    }
    return { pos, vel };
  }, []);
  useFrame((_, d) => {
    const dt = Math.min(d, 0.05);
    for (let i = 0; i < N; i++) {
      vel[i * 3 + 1] -= 2.5 * dt;
      for (let k = 0; k < 3; k++) pos[i * 3 + k] += vel[i * 3 + k] * dt;
      if (pos[i * 3 + 1] < 0) { pos[i * 3] = 0; pos[i * 3 + 1] = 0.8; pos[i * 3 + 2] = 0; }
    }
    if (ref.current) ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial size={0.15} color="#ffcf7a" transparent opacity={0.9} />
    </points>
  );
}

export default function ZenGardenScene({ items, onToggle, streak = 0, celebrate = false }: { items: LanternItem[]; onToggle: (id: string) => void; streak?: number; celebrate?: boolean }) {
  const radius = Math.max(4.5, items.length * 0.42);
  const progress = items.length ? items.filter((i) => i.lit).length / items.length : 0;
  return (
    <Canvas shadows camera={{ position: [0, 9, radius + 6], fov: 50 }} onCreated={({ gl }) => gl.domElement.parentElement?.parentElement?.setAttribute("data-scene-ready", "1")}>
      <color attach="background" args={["#e9dfcf"]} />
      <fog attach="fog" args={["#e9dfcf", 18, 34]} />
      <hemisphereLight args={["#fff4e0", "#8a7d6a", 0.6]} />
      <directionalLight position={[6, 10, 4]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <Environment resolution={64}>
        <Lightformer intensity={1.5} position={[0, 5, 0]} scale={[10, 10, 1]} />
        <Lightformer intensity={0.8} color="#ffd8a8" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
      </Environment>
      <Ground />
      <Pond progress={progress} />
      <Growth streak={streak} radius={radius} />
      {celebrate && <Celebration />}
      {items.map((it, i) => {
        const a = (i / items.length) * Math.PI * 2;
        return <Lantern key={it.id} item={it} onToggle={onToggle} position={[Math.sin(a) * radius, 0, Math.cos(a) * radius]} />;
      })}
      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.2} minDistance={6} maxDistance={radius + 14} autoRotate autoRotateSpeed={0.3} />
    </Canvas>
  );
}
