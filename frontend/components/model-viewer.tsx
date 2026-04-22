"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, Vector3 } from "three";
import type { Group } from "three";

function Model() {
  const url = useMemo(() => "/model.glb", []);
  const gltf = useGLTF(url);
  const ref = useRef<Group>(null);

  useEffect(() => {
    if (!gltf.scene) return;
    const box = new Box3().setFromObject(gltf.scene);
    const center = new Vector3();
    box.getCenter(center);
    gltf.scene.position.sub(center);
  }, [gltf.scene]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y = (ref.current.rotation.y + delta * 0.3) % (Math.PI * 2);
  });

  return (
    <group ref={ref}>
      <primitive object={gltf.scene} scale={1.6} />
    </group>
  );
}

export function ModelViewer() {
  return (
    <div className="h-[360px] w-full overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-fuchsia-400/20 via-indigo-500/15 to-cyan-400/20 shadow-2xl shadow-fuchsia-500/15 backdrop-blur">
      <Canvas camera={{ position: [0, 0.4, 6], fov: 40 }}>
        <ambientLight intensity={0.7} />
        <directionalLight intensity={1.4} position={[2, 5, 2]} />
        <Suspense fallback={null}>
          <Model />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={2.2} maxDistance={7} enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}