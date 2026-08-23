import { useRef, Suspense, useState, useEffect, Component, type ReactNode } from "react";

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

function CSSTrophyFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center relative overflow-hidden`}>
      <div className="relative flex flex-col items-center" style={{ animation: "trophy-float 3s ease-in-out infinite" }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: "radial-gradient(circle at 40% 35%, #ff8c00, #ff6b00 60%, #cc4400)",
            boxShadow: "0 0 60px rgba(255,107,0,0.5), 0 0 120px rgba(255,107,0,0.2)",
          }}>
          <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none">
            <path d="M32 8 L40 28 L60 28 L44 40 L50 60 L32 48 L14 60 L20 40 L4 28 L24 28 Z"
              fill="rgba(255,200,50,0.9)" stroke="rgba(255,160,0,0.8)" strokeWidth="1" />
          </svg>
        </div>

        {[0, 120, 240].map((deg, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: ["#ff6b00", "#e94560", "#7c3aed"][i],
              boxShadow: `0 0 8px ${["#ff6b00", "#e94560", "#7c3aed"][i]}`,
              top: "50%",
              left: "50%",
              transformOrigin: "0 0",
              animation: `orbit-${i} ${4 + i}s linear infinite`,
            }}
          />
        ))}
      </div>

      {[180, 240, 300].map((r, i) => (
        <div
          key={`ring-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: r,
            height: r,
            border: `1px solid ${["#ff6b00", "#e94560", "#7c3aed"][i]}30`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: `spin-ring-${i} ${15 + i * 5}s linear infinite`,
          }}
        />
      ))}

      <style>{`
        @keyframes trophy-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes orbit-0 {
          from { transform: rotate(0deg) translateX(80px); }
          to { transform: rotate(360deg) translateX(80px); }
        }
        @keyframes orbit-1 {
          from { transform: rotate(120deg) translateX(100px); }
          to { transform: rotate(480deg) translateX(100px); }
        }
        @keyframes orbit-2 {
          from { transform: rotate(240deg) translateX(120px); }
          to { transform: rotate(600deg) translateX(120px); }
        }
        @keyframes spin-ring-0 {
          from { transform: translate(-50%, -50%) rotate(0deg) skewX(10deg); }
          to { transform: translate(-50%, -50%) rotate(360deg) skewX(10deg); }
        }
        @keyframes spin-ring-1 {
          from { transform: translate(-50%, -50%) rotate(120deg) skewY(15deg); }
          to { transform: translate(-50%, -50%) rotate(480deg) skewY(15deg); }
        }
        @keyframes spin-ring-2 {
          from { transform: translate(-50%, -50%) rotate(240deg); }
          to { transform: translate(-50%, -50%) rotate(600deg); }
        }
      `}</style>
    </div>
  );
}

function TrophySceneWebGL({ className = "" }: { className?: string }) {
  const [R3F, setR3F] = useState<{
    Canvas: typeof import("@react-three/fiber")["Canvas"];
    Float: typeof import("@react-three/drei")["Float"];
    MeshDistortMaterial: typeof import("@react-three/drei")["MeshDistortMaterial"];
    Environment: typeof import("@react-three/drei")["Environment"];
    useFrame: typeof import("@react-three/fiber")["useFrame"];
    THREE: typeof import("three");
  } | null>(null);

  useEffect(() => {
    Promise.all([
      import("@react-three/fiber"),
      import("@react-three/drei"),
      import("three"),
    ]).then(([fiber, drei, THREE]) => {
      setR3F({
        Canvas: fiber.Canvas,
        Float: drei.Float,
        MeshDistortMaterial: drei.MeshDistortMaterial,
        Environment: drei.Environment,
        useFrame: fiber.useFrame,
        THREE,
      });
    }).catch(() => {});
  }, []);

  if (!R3F) return <CSSTrophyFallback className={className} />;
  const { Canvas, Float, MeshDistortMaterial, Environment, useFrame, THREE } = R3F;

  function Trophy() {
    const ref = useRef<InstanceType<typeof THREE.Group>>(null);
    useFrame((state) => {
      if (!ref.current) return;
      ref.current.rotation.y = state.clock.elapsedTime * 0.5;
    });
    return (
      <group ref={ref}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.8, 0.5, 1.5, 16]} />
          <meshStandardMaterial color="#ff6b00" metalness={0.9} roughness={0.1} envMapIntensity={2} />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <torusGeometry args={[0.82, 0.07, 8, 24]} />
          <meshStandardMaterial color="#ffaa00" metalness={0.95} roughness={0.05} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 1, 0.7, 0]} rotation={[0, 0, side * Math.PI / 2.5]}>
            <torusGeometry args={[0.4, 0.05, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#ff8c00" metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 1.2, 12]} />
          <meshStandardMaterial color="#cc5500" metalness={0.85} roughness={0.15} />
        </mesh>
        <mesh position={[0, -1.3, 0]}>
          <cylinderGeometry args={[0.6, 0.7, 0.25, 16]} />
          <meshStandardMaterial color="#ff6b00" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <MeshDistortMaterial color="#ff6b00" transparent opacity={0.06} distort={0.1} speed={2} />
        </mesh>
      </group>
    );
  }

  function OrbitingRing({ radius, color, speed, tilt }: { radius: number; color: string; speed: number; tilt: [number, number, number] }) {
    const ref = useRef<InstanceType<typeof THREE.Mesh>>(null);
    useFrame((state) => {
      if (!ref.current) return;
      ref.current.rotation.y = state.clock.elapsedTime * speed;
    });
    return (
      <mesh ref={ref} rotation={tilt}>
        <torusGeometry args={[radius, 0.015, 8, 60]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
    );
  }

  return (
    <div className={className} style={{ background: "transparent" }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <pointLight position={[3, 3, 3]} color="#ff6b00" intensity={3} />
          <pointLight position={[-3, -3, 3]} color="#7c3aed" intensity={1} />
          <pointLight position={[0, 5, 0]} color="#ffaa00" intensity={2} />
          <Environment preset="night" />
          <Float speed={2} rotationIntensity={0.2} floatIntensity={0.8}>
            <Trophy />
          </Float>
          <OrbitingRing radius={2.2} color="#ff6b00" speed={0.6} tilt={[Math.PI / 4, 0, 0]} />
          <OrbitingRing radius={2.8} color="#e94560" speed={-0.4} tilt={[Math.PI / 6, Math.PI / 3, 0]} />
          <OrbitingRing radius={3.2} color="#7c3aed" speed={0.3} tilt={[Math.PI / 3, Math.PI / 5, Math.PI / 8]} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default function TrophyScene({ className = "" }: { className?: string }) {
  const [webglSupported] = useState(() => canUseWebGL());

  if (!webglSupported) return <CSSTrophyFallback className={className} />;

  return (
    <WebGLErrorBoundary fallback={<CSSTrophyFallback className={className} />}>
      <TrophySceneWebGL className={className} />
    </WebGLErrorBoundary>
  );
}
