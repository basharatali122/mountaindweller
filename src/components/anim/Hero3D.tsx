import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment, Sparkles } from "@react-three/drei";
import { Suspense, useRef } from "react";
import type { Mesh } from "three";

function Orb() {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.25;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.4}>
      <mesh ref={ref} scale={1.6}>
        <icosahedronGeometry args={[1, 8]} />
        <MeshDistortMaterial
          color="#6366f1"
          distort={0.45}
          speed={2}
          roughness={0.1}
          metalness={0.85}
        />
      </mesh>
    </Float>
  );
}

function Torus({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.4;
    ref.current.rotation.y = state.clock.elapsedTime * 0.3;
  });
  return (
    <Float speed={1.8} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={ref} position={position} scale={scale}>
        <torusGeometry args={[0.6, 0.18, 32, 100]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.15} />
      </mesh>
    </Float>
  );
}

export function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <pointLight position={[-5, -3, -2]} intensity={1.5} color="#a78bfa" />
        <pointLight position={[5, 3, 2]} intensity={1.2} color="#38bdf8" />
        <Orb />
        <Torus position={[-2.4, 1.2, -1]} color="#a78bfa" scale={0.8} />
        <Torus position={[2.3, -1.1, -1.5]} color="#38bdf8" scale={0.7} />
        <Torus position={[2.1, 1.4, -2]} color="#f0abfc" scale={0.5} />
        <Sparkles count={60} scale={8} size={3} speed={0.5} color="#a5b4fc" />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}
