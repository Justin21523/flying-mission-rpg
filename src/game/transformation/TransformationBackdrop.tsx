import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Object3D, Vector3, type InstancedMesh, type PointLight } from 'three';
import { txFrame } from './transformationRuntime';

// The transformation backdrop — a contrasting solid background (the timeline's backdropColor, which echoes
// but never matches the character colour) + INFINITE white speed lines streaming UPWARD past the camera to
// sell the "falling / descending" feel, plus a brightness pulse tinted by the character colour. The streaks
// are a fixed instanced pool recycled top→bottom (no allocation, no growth). Intensity follows the runner.
const COUNT = 160;
const RADIUS = 16;
const Y_SPAN = 26; // streaks live within ±Y_SPAN/2 of the camera and wrap
const _dummy = new Object3D();
const _c = new Vector3();
const POS: Vector3[] = Array.from({ length: COUNT }, () => new Vector3());

export const TransformationBackdrop = ({ backdropColor = '#101820', glowColor = '#ffffff' }: { backdropColor?: string; glowColor?: string }) => {
  const mesh = useRef<InstancedMesh>(null);
  const light = useRef<PointLight>(null);
  const { camera } = useThree();

  useEffect(() => {
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * RADIUS;
      POS[i].set(Math.cos(a) * r, (Math.random() - 0.5) * Y_SPAN, Math.sin(a) * r);
    }
  }, []);

  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m) return;
    camera.getWorldPosition(_c);
    const intensity = txFrame.snapshot?.backdropIntensity ?? 1;
    const speed = 24 * intensity; // upward streak speed → descending sensation
    for (let i = 0; i < COUNT; i++) {
      const p = POS[i];
      p.y += speed * dt; // move UP (world streams up = craft falls)
      if (p.y - _c.y > Y_SPAN / 2) p.y -= Y_SPAN; // recycle to the bottom
      _dummy.position.set(_c.x + p.x, p.y, _c.z + p.z);
      _dummy.scale.set(1, 1 + intensity * 1.5, 1);
      _dummy.updateMatrix();
      m.setMatrixAt(i, _dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (light.current) light.current.intensity = 0.6 + Math.abs(Math.sin(state.clock.elapsedTime * 6)) * 0.8 * intensity;
  });

  return (
    <>
      <color attach="background" args={[backdropColor]} />
      <ambientLight intensity={0.5} />
      <pointLight ref={light} color={glowColor} intensity={1} distance={40} position={[0, 2, 4]} />
      <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <boxGeometry args={[0.05, 1.6, 0.05]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} transparent opacity={0.7} />
      </instancedMesh>
    </>
  );
};
