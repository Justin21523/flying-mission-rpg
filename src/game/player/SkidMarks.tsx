import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, type BufferAttribute, type Group, type Points, type PointsMaterial } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { playerMotion } from './playerMotion';

// Brief skid-mark puffs laid near the ground behind the vehicle while braking/coasting fast
// (playerMotion.skidding). Recycled pool, kit particle pattern; idle → invisible.

const POOL = 40;
const LIFE = 0.6;

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

export const SkidMarks = () => {
  const groupRef = useRef<Group>(null);
  const pointsRef = useRef<Points>(null);
  const tex = useMemo(() => makeSoftTexture(), []);
  const init = useMemo(() => new Float32Array(POOL * 3), []);
  const m = useRef({ vel: new Float32Array(POOL * 3), age: new Float32Array(POOL).fill(LIFE + 1) });

  useFrame((_, dtRaw) => {
    const st = m.current;
    const dt = Math.min(dtRaw, 0.05);
    const mat = pointsRef.current?.material as PointsMaterial | undefined;
    const attr = pointsRef.current?.geometry.attributes.position as BufferAttribute | undefined;
    const arr = attr?.array as Float32Array | undefined;
    if (!arr || !attr) return;

    const g = groupRef.current;
    const pos = usePlayerStore.getState().position;
    if (g && pos) g.position.set(pos.x, 0, pos.z); // ground level

    // Emit behind the player while skidding.
    if (playerMotion.skidding) {
      const h = playerMotion.heading;
      const bx = -Math.sin(h), bz = -Math.cos(h);
      let toSpawn = 2;
      for (let i = 0; i < POOL && toSpawn > 0; i++) {
        if (st.age[i] >= LIFE) {
          arr[i * 3] = bx * rnd(0.1, 0.7) + rnd(-0.3, 0.3);
          arr[i * 3 + 1] = 0.06;
          arr[i * 3 + 2] = bz * rnd(0.1, 0.7) + rnd(-0.3, 0.3);
          st.vel[i * 3] = rnd(-0.2, 0.2);
          st.vel[i * 3 + 2] = rnd(-0.2, 0.2);
          st.age[i] = 0;
          toSpawn--;
        }
      }
    }

    let anyAlive = false;
    for (let i = 0; i < POOL; i++) {
      if (st.age[i] >= LIFE) { arr[i * 3 + 1] = -999; continue; }
      st.age[i] += dt;
      arr[i * 3] += st.vel[i * 3] * dt;
      arr[i * 3 + 2] += st.vel[i * 3 + 2] * dt;
      anyAlive = true;
    }
    attr.needsUpdate = true;
    if (mat) { mat.opacity = anyAlive ? 0.4 : 0; mat.size = 0.7; }
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[init, 3]} count={POOL} />
        </bufferGeometry>
        <pointsMaterial map={tex} color="#3a3a3a" size={0.7} transparent opacity={0} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  );
};
