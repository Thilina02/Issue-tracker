"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Float, OrbitControls, useGLTF } from "@react-three/drei";

function Model() {
  const gltf = useGLTF("/api/assets/model");
  return <primitive object={gltf.scene} scale={1.8} position={[0, -1.35, 0]} />;
}

export function ModelViewer() {
  return (
    <div className="h-[360px] w-full overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-fuchsia-400/20 via-indigo-500/15 to-cyan-400/20 shadow-2xl shadow-fuchsia-500/15 backdrop-blur">
      <Canvas camera={{ position: [0, 0.4, 4], fov: 40 }}>
        <ambientLight intensity={0.7} />
        <directionalLight intensity={1.4} position={[2, 5, 2]} />
        <Suspense fallback={null}>
          <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
            <Model />
          </Float>
          <Environment preset="city" />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={2.2} maxDistance={7} />
      </Canvas>
    </div>
  );
}
