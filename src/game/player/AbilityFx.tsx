import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, CanvasTexture, Color, type BufferAttribute, type Group, type Mesh, type Points, type PointsMaterial, type MeshBasicMaterial } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useTransformStore } from '../../stores/transformStore';

// Special-ability VFX (Q): on each ability use, a burst of the character's colour smoke PLUS a few
// expanding water-ripple rings on the ground, both tinted by transformStore.abilityColor. Idle =
// invisible. Kit particle pattern (one geometry buffer mutated in useFrame; no per-frame allocations).

const SMOKE = 90;
const DURATION = 1.1;   // smoke lifetime (s)
const RINGS = 3;
const RING_LIFE = 0.9;  // per-ring expand/fade (s)
const RING_STAGGER = 0.18;
const RING_MAX = 4.2;   // max ring radius (world units)

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

export const AbilityFx = () => {
  const groupRef = useRef<Group>(null);
  const smokeRef = useRef<Points>(null);
  const ringRefs = useRef<(Mesh | null)[]>([]);
  const tex = useMemo(() => makeSoftTexture(), []);
  const smokeInit = useMemo(() => new Float32Array(SMOKE * 3), []);
  const m = useRef({ vel: new Float32Array(SMOKE * 3), age: Infinity, lastPulse: 0 });
  const tint = useMemo(() => new Color('#ffffff'), []);

  useFrame((_, dtRaw) => {
    const st = m.current;
    const dt = Math.min(dtRaw, 0.05);
    const store = useTransformStore.getState();

    const attr = smokeRef.current?.geometry.attributes.position as BufferAttribute | undefined;
    const arr = attr?.array as Float32Array | undefined;

    // New ability use → spawn coloured smoke + reset rings.
    if (store.abilityPulseId !== st.lastPulse && arr) {
      st.lastPulse = store.abilityPulseId;
      tint.set(store.abilityColor || '#ffffff');
      for (let i = 0; i < SMOKE; i++) {
        const a = rnd(0, Math.PI * 2), r = rnd(0, 0.6), sp = rnd(1.6, 3.6);
        arr[i * 3] = Math.cos(a) * r;
        arr[i * 3 + 1] = rnd(0.0, 1.8);
        arr[i * 3 + 2] = Math.sin(a) * r;
        st.vel[i * 3] = Math.cos(a) * sp;
        st.vel[i * 3 + 1] = rnd(0.6, 2.2);
        st.vel[i * 3 + 2] = Math.sin(a) * sp;
      }
      st.age = 0;
      // Tint smoke + rings to the ability colour.
      const sm = smokeRef.current?.material as PointsMaterial | undefined;
      if (sm) sm.color.copy(tint);
      ringRefs.current.forEach((r) => {
        const mat = r?.material as MeshBasicMaterial | undefined;
        if (mat) mat.color.copy(tint);
      });
    }

    const g = groupRef.current;
    const pos = usePlayerStore.getState().position;
    if (g && pos) g.position.set(pos.x, pos.y - 0.4, pos.z);

    const t = st.age;
    const smokeMat = smokeRef.current?.material as PointsMaterial | undefined;

    if (t > DURATION + RING_LIFE) {
      if (smokeMat && smokeMat.opacity !== 0) smokeMat.opacity = 0;
      ringRefs.current.forEach((r) => { const mt = r?.material as MeshBasicMaterial | undefined; if (mt && mt.opacity !== 0) mt.opacity = 0; });
      return;
    }
    st.age += dt;

    // Smoke
    if (arr && attr && t <= DURATION) {
      for (let i = 0; i < SMOKE * 3; i++) { arr[i] += st.vel[i] * dt; st.vel[i] *= 0.9; }
      attr.needsUpdate = true;
    }
    if (smokeMat) {
      const fade = t < 0.16 ? t / 0.16 : Math.max(0, 1 - (t - 0.16) / (DURATION - 0.16));
      smokeMat.opacity = fade * 0.85;
      smokeMat.size = 1.4 + t * 2.6;
    }

    // Expanding ground rings (staggered).
    ringRefs.current.forEach((r, i) => {
      if (!r) return;
      const rt = t - i * RING_STAGGER;
      const mat = r.material as MeshBasicMaterial;
      if (rt < 0 || rt > RING_LIFE) { mat.opacity = 0; return; }
      const k = rt / RING_LIFE;
      const radius = 0.4 + k * RING_MAX;
      r.scale.set(radius, radius, radius);
      mat.opacity = (1 - k) * 0.7;
    });
  });

  return (
    <group ref={groupRef}>
      <points ref={smokeRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[smokeInit, 3]} count={SMOKE} />
        </bufferGeometry>
        <pointsMaterial map={tex} color="#ffffff" size={1.4} transparent opacity={0} depthWrite={false} sizeAttenuation />
      </points>
      {Array.from({ length: RINGS }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { ringRefs.current[i] = el; }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.05, 0]}
        >
          <ringGeometry args={[0.82, 1.0, 48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
};
