import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, Object3D, Vector3, type InstancedMesh, type MeshBasicMaterial, type PointLight } from 'three';
import { txFrame } from './transformationRuntime';

// The transformation backdrop — a contrasting solid background (the timeline's backdropColor, which echoes
// but never matches the character colour) + INFINITE white speed lines streaming UPWARD past the camera to
// sell the "falling / descending" feel, plus a brightness pulse tinted by the character colour. The streaks
// are a fixed instanced pool recycled top→bottom (no allocation, no growth). Intensity follows the runner —
// and as the final backdrop-shift fades it to 0, the streaks/light fade out and the background colour lerps
// to open sky (the exit happens mid-air, so the fade lands on sky, never ground).
const COUNT = 160;
const RADIUS = 16;
const Y_SPAN = 26; // streaks live within ±Y_SPAN/2 of the camera and wrap
const SKY = new Color('#7fb8ee'); // fade-out target — open sky
const _dummy = new Object3D();
const _c = new Vector3();
const _bg = new Color();
const POS: Vector3[] = Array.from({ length: COUNT }, () => new Vector3());

export const TransformationBackdrop = ({ backdropColor = '#101820', glowColor = '#ffffff' }: { backdropColor?: string; glowColor?: string }) => {
  const mesh = useRef<InstancedMesh>(null);
  const light = useRef<PointLight>(null);
  const bgRef = useRef<Color>(null);
  const streakMat = useRef<MeshBasicMaterial>(null);
  const { camera } = useThree();
  const baseColor = useMemo(() => new Color(backdropColor), [backdropColor]);

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
    const backdropIntensity = txFrame.snapshot?.backdropIntensity ?? 1;
    const speedLineIntensity = Math.max(backdropIntensity, txFrame.snapshot?.speedLineIntensity ?? 0);
    const speed = 24 * Math.max(0.15, speedLineIntensity); // upward streak speed → descending sensation
    for (let i = 0; i < COUNT; i++) {
      const p = POS[i];
      p.y += speed * dt; // move UP (world streams up = craft falls)
      if (p.y - _c.y > Y_SPAN / 2) p.y -= Y_SPAN; // recycle to the bottom
      _dummy.position.set(_c.x + p.x, p.y, _c.z + p.z);
      _dummy.scale.set(1, 1 + speedLineIntensity * 1.5, 1);
      _dummy.updateMatrix();
      m.setMatrixAt(i, _dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (streakMat.current) streakMat.current.opacity = 0.7 * Math.min(1, speedLineIntensity); // fade out with the backdrop
    if (light.current) light.current.intensity = (0.6 + Math.abs(Math.sin(state.clock.elapsedTime * 6)) * 0.8) * Math.max(backdropIntensity, speedLineIntensity);
    // background colour: theme colour while active → open sky as the backdrop fades (still airborne)
    if (bgRef.current) {
      _bg.copy(baseColor).lerp(SKY, 1 - Math.min(1, backdropIntensity));
      bgRef.current.copy(_bg);
    }
  });

  return (
    <>
      <color ref={bgRef} attach="background" args={[backdropColor]} />
      <ambientLight intensity={0.5} />
      <pointLight ref={light} color={glowColor} intensity={1} distance={40} position={[0, 2, 4]} />
      <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <boxGeometry args={[0.05, 1.6, 0.05]} />
        <meshBasicMaterial ref={streakMat} color="#ffffff" toneMapped={false} transparent opacity={0.7} />
      </instancedMesh>
    </>
  );
};
