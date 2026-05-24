import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import { Suspense, useRef } from "react";
import type { Mesh } from "three";
import { useIsMobile } from "@/hooks/use-mobile";

function Orb({ mobile }: { mobile: boolean }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.2;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={1}>
      <mesh ref={ref} scale={mobile ? 1.3 : 1.6}>
        <icosahedronGeometry args={[1, mobile ? 4 : 6]} />
        <MeshDistortMaterial
          color="#6366f1"
          distort={0.4}
          speed={mobile ? 1.2 : 2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

function Torus({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.3;
    ref.current.rotation.y = state.clock.elapsedTime * 0.25;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.8} floatIntensity={1.4}>
      <mesh ref={ref} position={position} scale={scale}>
        <torusGeometry args={[0.6, 0.18, 16, 48]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.2} />
      </mesh>
    </Float>
  );
}

export function Hero3D() {
  const isMobile = useIsMobile();
  // Respect reduced motion preference
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return null;
  }
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={isMobile ? [1, 1.25] : [1, 1.75]}
      gl={{ antialias: !isMobile, alpha: true, powerPreference: "high-performance" }}
      frameloop="always"
      performance={{ min: 0.5 }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -3, -2]} intensity={1.2} color="#a78bfa" />
        {!isMobile && <pointLight position={[5, 3, 2]} intensity={1} color="#38bdf8" />}
        <Orb mobile={isMobile} />
        {!isMobile && (
          <>
            <Torus position={[-2.4, 1.2, -1]} color="#a78bfa" scale={0.8} />
            <Torus position={[2.3, -1.1, -1.5]} color="#38bdf8" scale={0.7} />
            <Torus position={[2.1, 1.4, -2]} color="#f0abfc" scale={0.5} />
          </>
        )}
        <Sparkles count={isMobile ? 20 : 50} scale={8} size={3} speed={0.4} color="#a5b4fc" />
      </Suspense>
    </Canvas>
  );
}
