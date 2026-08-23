import { useRef, useMemo, Suspense, useState, useEffect, Component, type ReactNode } from "react";

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

class WebGLErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function CSSHeroFallback() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {[
        { size: 420, x: "70%", y: "20%", color: "#ff6b00", delay: "0s", dur: "8s" },
        { size: 300, x: "15%", y: "60%", color: "#e94560", delay: "-3s", dur: "10s" },
        { size: 200, x: "85%", y: "70%", color: "#7c3aed", delay: "-5s", dur: "12s" },
        { size: 150, x: "40%", y: "10%", color: "#ff6b00", delay: "-2s", dur: "7s" },
      ].map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle at 40% 40%, ${orb.color}18, transparent 70%)`,
            border: `1px solid ${orb.color}15`,
            animation: `hero-float ${orb.dur} ease-in-out infinite`,
            animationDelay: orb.delay,
          }}
        />
      ))}

      {[
        { r: 340, color: "#ff6b00", dur: "20s", delay: "0s" },
        { r: 460, color: "#e94560", dur: "30s", delay: "-8s" },
        { r: 580, color: "#7c3aed", dur: "25s", delay: "-5s" },
      ].map((ring, i) => (
        <div
          key={`ring-${i}`}
          className="absolute rounded-full"
          style={{
            width: ring.r,
            height: ring.r,
            left: "65%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            border: `1px solid ${ring.color}20`,
            animation: `hero-spin ${ring.dur} linear infinite`,
            animationDelay: ring.delay,
          }}
        />
      ))}

      <style>{`
        @keyframes hero-float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) scale(1); }
          50% { transform: translate(-50%, -50%) translateY(-20px) scale(1.05); }
        }
        @keyframes hero-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function HeroSceneWebGL() {
  const [R3F, setR3F] = useState<{
    Canvas: typeof import("@react-three/fiber")["Canvas"];
    Float: typeof import("@react-three/drei")["Float"];
    MeshDistortMaterial: typeof import("@react-three/drei")["MeshDistortMaterial"];
    useFrame: typeof import("@react-three/fiber")["useFrame"];
    THREE: typeof import("three");
  } | null>(null);

  useEffect(() => {
    Promise.all([
      import("@react-three/fiber"),
      import("@react-three/drei"),
      import("three"),
    ]).then(([fiber, drei, THREE]) => {
      setR3F({ Canvas: fiber.Canvas, Float: drei.Float, MeshDistortMaterial: drei.MeshDistortMaterial, useFrame: fiber.useFrame, THREE });
    }).catch(() => {});
  }, []);

  if (!R3F) return null;
  const { Canvas, Float, MeshDistortMaterial, useFrame, THREE } = R3F;

  function FloatingOrb({ position, color, speed = 1, scale = 1 }: { position: [number, number, number]; color: string; speed?: number; scale?: number }) {
    const meshRef = useRef<InstanceType<typeof THREE.Mesh>>(null);
    useFrame((state) => {
      if (!meshRef.current) return;
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3 * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5 * speed;
    });
    return (
      <Float speed={speed * 1.5} rotationIntensity={0.5} floatIntensity={1.5}>
        <mesh ref={meshRef} position={position} scale={scale}>
          <icosahedronGeometry args={[1, 1]} />
          <MeshDistortMaterial color={color} wireframe transparent opacity={0.15} distort={0.3} speed={2} />
        </mesh>
      </Float>
    );
  }

  function GeometricRing({ radius, color, speed = 1 }: { radius: number; color: string; speed?: number }) {
    const ref = useRef<InstanceType<typeof THREE.Mesh>>(null);
    useFrame((state) => {
      if (!ref.current) return;
      ref.current.rotation.x = state.clock.elapsedTime * 0.2 * speed;
      ref.current.rotation.z = state.clock.elapsedTime * 0.3 * speed;
    });
    return (
      <mesh ref={ref}>
        <torusGeometry args={[radius, 0.02, 8, 60]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
    );
  }

  function ParticleField() {
    const count = 300;
    const positions = useMemo(() => {
      const arr = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        arr[i * 3] = (Math.random() - 0.5) * 20;
        arr[i * 3 + 1] = (Math.random() - 0.5) * 12;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
      }
      return arr;
    }, []);
    const ref = useRef<InstanceType<typeof THREE.Points>>(null);
    useFrame((state) => {
      if (!ref.current) return;
      ref.current.rotation.y = state.clock.elapsedTime * 0.03;
    });
    return (
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.04} color="#ff6b00" transparent opacity={0.5} sizeAttenuation />
      </points>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        dpr={[1, 1.5]}
        onCreated={() => {}}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.1} />
          <pointLight position={[5, 5, 5]} color="#ff6b00" intensity={1} />
          <pointLight position={[-5, -5, -5]} color="#7c3aed" intensity={0.5} />
          <ParticleField />
          <GeometricRing radius={4} color="#ff6b00" speed={0.5} />
          <GeometricRing radius={5.5} color="#e94560" speed={-0.3} />
          <GeometricRing radius={7} color="#7c3aed" speed={0.2} />
          <FloatingOrb position={[-6, 2, -4]} color="#ff6b00" speed={0.8} scale={1.5} />
          <FloatingOrb position={[5, -1, -3]} color="#e94560" speed={1.2} scale={1.2} />
          <FloatingOrb position={[3, 3, -5]} color="#7c3aed" speed={0.6} scale={0.8} />
          <FloatingOrb position={[-4, -3, -4]} color="#ff6b00" speed={1} scale={1} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default function HeroScene() {
  const [webglSupported] = useState(() => canUseWebGL());

  if (!webglSupported) return <CSSHeroFallback />;

  return (
    <WebGLErrorBoundary fallback={<CSSHeroFallback />}>
      <HeroSceneWebGL />
    </WebGLErrorBoundary>
  );
}
