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

export default function ZenGardenScene({ items, onToggle }: { items: LanternItem[]; onToggle: (id: string) => void }) {
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
      {items.map((it, i) => {
        const a = (i / items.length) * Math.PI * 2;
        return <Lantern key={it.id} item={it} onToggle={onToggle} position={[Math.sin(a) * radius, 0, Math.cos(a) * radius]} />;
      })}
      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.2} minDistance={6} maxDistance={radius + 14} autoRotate autoRotateSpeed={0.3} />
    </Canvas>
  );
}
