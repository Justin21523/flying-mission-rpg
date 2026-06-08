import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, type BufferAttribute, type Group, type Points, type PointsMaterial } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useTransformStore } from '../../stores/transformStore';
import { playerMotion } from './playerMotion';

// Continuous downwash/exhaust trail while flying: small grey-white gas blobs constantly puff from
// the player's underside + rear and drift down/back, then recycle. Idle (not flying) → invisible.
// Kit particle pattern: one geometry buffer mutated in a single useFrame; per-particle ages in a
// useRef; no per-frame allocations.

const POOL = 56;
const LIFE = 0.7; // seconds per puff

function makeSoftTexture(): CanvasTexture {
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return new CanvasTexture(cv);
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export const FlightJet = () => {
  const groupRef = useRef<Group>(null);
  const pointsRef = useRef<Points>(null);
  const tex = useMemo(() => makeSoftTexture(), []);
  const init = useMemo(() => new Float32Array(POOL * 3), []);

  const m = useRef({
    vel: new Float32Array(POOL * 3),
    age: new Float32Array(POOL).fill(LIFE + 1), // all start expired
  });

  // Spawn one puff at the underside/rear of the player (local space; group is at the player).
  const spawn = (arr: Float32Array, i: number) => {
    const st = m.current;
    // Rear = opposite the facing heading; offset down so it comes from the belly.
    const h = playerMotion.heading;
    const back = -1;
    const bx = Math.sin(h) * back, bz = Math.cos(h) * back;
    arr[i * 3] = bx * rnd(0.0, 0.5) + rnd(-0.25, 0.25);
    arr[i * 3 + 1] = rnd(-0.1, 0.4);
    arr[i * 3 + 2] = bz * rnd(0.0, 0.5) + rnd(-0.25, 0.25);
    st.vel[i * 3] = bx * rnd(0.4, 1.2) + rnd(-0.4, 0.4);
    st.vel[i * 3 + 1] = rnd(-1.8, -0.8); // downwash
    st.vel[i * 3 + 2] = bz * rnd(0.4, 1.2) + rnd(-0.4, 0.4);
    st.age[i] = 0;
  };

  useFrame((_, dtRaw) => {
    const st = m.current;
    const dt = Math.min(dtRaw, 0.05);
    const flying = useTransformStore.getState().flying;
    const mat = pointsRef.current?.material as PointsMaterial | undefined;
    const attr = pointsRef.current?.geometry.attributes.position as BufferAttribute | undefined;
    const arr = attr?.array as Float32Array | undefined;

    if (!flying) {
      if (mat && mat.opacity !== 0) mat.opacity = 0;
      return;
    }
    if (!arr || !attr) return;

    const g = groupRef.current;
    const pos = usePlayerStore.getState().position;
    if (g && pos) g.position.set(pos.x, pos.y, pos.z);

    // Emit a few puffs per frame; integrate + recycle the rest.
    let toSpawn = 3;
    for (let i = 0; i < POOL; i++) {
      st.age[i] += dt;
      if (st.age[i] >= LIFE) {
        if (toSpawn > 0) { spawn(arr, i); toSpawn--; }
        else { arr[i * 3 + 1] = -999; continue; } // park expired off-screen until reused
      }
      arr[i * 3] += st.vel[i * 3] * dt;
      arr[i * 3 + 1] += st.vel[i * 3 + 1] * dt;
      arr[i * 3 + 2] += st.vel[i * 3 + 2] * dt;
      st.vel[i * 3] *= 0.94;
      st.vel[i * 3 + 2] *= 0.94;
    }
    attr.needsUpdate = true;
    if (mat) { mat.opacity = 0.5; mat.size = 0.85; }
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[init, 3]} count={POOL} />
        </bufferGeometry>
        <pointsMaterial map={tex} color="#dfe3e8" size={0.85} transparent opacity={0} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  );
};
