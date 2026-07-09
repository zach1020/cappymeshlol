"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Float, OrbitControls } from "@react-three/drei";

export function AssetViewer() {
  return (
    <div className="viewer-canvas">
      <Canvas camera={{ position: [3.2, 2.6, 4.6], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 4]} intensity={1.8} />
        <Float speed={1.25} rotationIntensity={0.25} floatIntensity={0.55}>
          <group>
            <mesh position={[0, 0.62, 0]} castShadow>
              <boxGeometry args={[1.7, 1.2, 1.7]} />
              <meshStandardMaterial color="#31d07c" roughness={0.44} metalness={0.08} />
            </mesh>
            <mesh position={[0, 1.36, 0]} castShadow>
              <cylinderGeometry args={[0.72, 0.94, 0.5, 8]} />
              <meshStandardMaterial color="#b596ff" roughness={0.5} metalness={0.12} />
            </mesh>
            <mesh position={[-0.65, -0.25, -0.55]} castShadow>
              <cylinderGeometry args={[0.13, 0.13, 1.05, 10]} />
              <meshStandardMaterial color="#ffce6b" roughness={0.5} />
            </mesh>
            <mesh position={[0.65, -0.25, -0.55]} castShadow>
              <cylinderGeometry args={[0.13, 0.13, 1.05, 10]} />
              <meshStandardMaterial color="#ffce6b" roughness={0.5} />
            </mesh>
          </group>
        </Float>
        <ContactShadows opacity={0.38} scale={6} blur={2.4} far={3.5} position={[0, -0.82, 0]} />
        <Environment preset="warehouse" />
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
