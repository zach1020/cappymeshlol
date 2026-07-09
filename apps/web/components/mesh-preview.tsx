"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Float, MeshTransmissionMaterial, OrbitControls } from "@react-three/drei";

function MeshObject() {
  return (
    <Float speed={1.7} rotationIntensity={0.45} floatIntensity={1.2}>
      <group rotation={[0.25, -0.45, 0]}>
        <mesh castShadow receiveShadow position={[0, -0.15, 0]}>
          <icosahedronGeometry args={[1.65, 2]} />
          <MeshTransmissionMaterial
            anisotropicBlur={0.2}
            chromaticAberration={0.04}
            distortion={0.08}
            roughness={0.35}
            thickness={0.85}
            transmission={0.72}
            color="#8dfc9a"
          />
        </mesh>
        <mesh position={[0.9, 0.85, -0.25]} rotation={[0.6, 0.35, 0.2]}>
          <boxGeometry args={[0.72, 0.72, 0.72]} />
          <meshStandardMaterial color="#b596ff" roughness={0.42} metalness={0.14} />
        </mesh>
        <mesh position={[-1.08, -0.8, 0.15]} rotation={[0.2, 0.25, 0.6]}>
          <torusKnotGeometry args={[0.42, 0.13, 96, 12]} />
          <meshStandardMaterial color="#ffce6b" roughness={0.33} metalness={0.25} />
        </mesh>
      </group>
    </Float>
  );
}

export function MeshPreview() {
  return (
    <div className="mesh-stage" aria-label="Animated 3D preview">
      <div className="mesh-toolbar">
        <span className="mesh-badge">Mock GLB viewer</span>
        <span className="mesh-badge">5k tris target</span>
      </div>
      <Canvas camera={{ position: [0, 0, 5.2], fov: 42 }} shadows>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} />
        <MeshObject />
        <Environment preset="city" />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.45} />
      </Canvas>
      <div className="mesh-output">
        <div className="format-tile">
          <strong>GLB</strong>
          <span>game-ready default</span>
        </div>
        <div className="format-tile">
          <strong>OBJ</strong>
          <span>material package</span>
        </div>
        <div className="format-tile">
          <strong>STL</strong>
          <span>print checks</span>
        </div>
      </div>
    </div>
  );
}
