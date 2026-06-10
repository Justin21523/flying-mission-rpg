import { Grid } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

// Batch 0 grey-box scene — the bare 3D base the whole game is built on:
// a ground plane, a reference grid, simple lights, and a few test boxes (one slowly spinning so it's
// obvious the render loop is alive). No gameplay, no physics, no player — just proof the canvas,
// camera, lighting and resize all work. Later batches replace this with the base hangar + flight FSM.
export const GreyBoxScene = () => {
  const cube = useRef<Mesh>(null);

  // Single allocation-free rotation (no per-frame object literals).
  useFrame((_, delta) => {
    const m = cube.current;
    if (m) m.rotation.y += delta * 0.6;
  });

  return (
    <group>
      {/* Lights — kept here so the grey-box is visible regardless of the ambience layer. */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 4]} intensity={1.4} castShadow />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#3a4250" />
      </mesh>

      {/* Reference grid for scale / orientation. */}
      <Grid
        args={[60, 60]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#52607a"
        sectionSize={5}
        sectionThickness={1.1}
        sectionColor="#7c8db0"
        fadeDistance={45}
        infiniteGrid
      />

      {/* Test cube — spins to prove the render loop is alive. */}
      <mesh ref={cube} position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>

      {/* Static reference boxes. */}
      <mesh position={[-4, 0.5, -3]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[4, 1, -3]} castShadow>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#34d399" />
      </mesh>
    </group>
  );
};
