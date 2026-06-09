import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, CanvasTexture, Color, type BufferAttribute, type Group, type Mesh, type Points, type PointsMaterial, type MeshBasicMaterial } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useTransformStore } from '../../stores/transformStore';

// Special-ability VFX (Q): on each use, a big burst of the character's colour fog/smoke + a bright glow
// flash + several expanding water-ripple rings on the ground + an outward sparkle burst — all tinted by
// transformStore.abilityColor. Idle = invisible. Kit particle pattern (preallocated buffers mutated in
// useFrame; no per-frame allocations / no re-renders).

const SMOKE = 150;
const DURATION = 1.2;    // smoke lifetime (s)
const SPARK = 90;
const SPARK_LIFE = 0.9;
const RINGS = 5;
const RING_LIFE = 1.0;   // per-ring expand/fade (s)
const RING_STAGGER = 0.13;
const RING_MAX = 7.5;    // max ring radius (world units)
const GLOW_LIFE = 0.5;

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
  const sparkRef = useRef<Points>(null);
  const glowRef = useRef<Mesh>(null);
  const ringRefs = useRef<(Mesh | null)[]>([]);
  const tex = useMemo(() => makeSoftTexture(), []);
  const smokeInit = useMemo(() => new Float32Array(SMOKE * 3), []);
  const sparkInit = useMemo(() => new Float32Array(SPARK * 3), []);
  const m = useRef({ smokeVel: new Float32Array(SMOKE * 3), sparkVel: new Float32Array(SPARK * 3), age: Infinity, lastPulse: 0 });
  const tint = useMemo(() => new Color('#ffffff'), []);

  useFrame((_, dtRaw) => {
    const st = m.current;
    const dt = Math.min(dtRaw, 0.05);
    const store = useTransformStore.getState();

    const sAttr = smokeRef.current?.geometry.attributes.position as BufferAttribute | undefined;
    const sArr = sAttr?.array as Float32Array | undefined;
    const pAttr = sparkRef.current?.geometry.attributes.position as BufferAttribute | undefined;
    const pArr = pAttr?.array as Float32Array | undefined;

    // New ability use → spawn fog + sparks + flash, reset rings.
    if (store.abilityPulseId !== st.lastPulse && sArr && pArr) {
      st.lastPulse = store.abilityPulseId;
      tint.set(store.abilityColor || '#ffffff');
      for (let i = 0; i < SMOKE; i++) {
        const a = rnd(0, Math.PI * 2), r = rnd(0, 0.8), sp = rnd(1.8, 4.2);
        sArr[i * 3] = Math.cos(a) * r; sArr[i * 3 + 1] = rnd(0, 2.0); sArr[i * 3 + 2] = Math.sin(a) * r;
        st.smokeVel[i * 3] = Math.cos(a) * sp; st.smokeVel[i * 3 + 1] = rnd(0.8, 2.6); st.smokeVel[i * 3 + 2] = Math.sin(a) * sp;
      }
      for (let i = 0; i < SPARK; i++) {
        const a = rnd(0, Math.PI * 2), sp = rnd(4, 9);
        pArr[i * 3] = 0; pArr[i * 3 + 1] = rnd(0.3, 1.2); pArr[i * 3 + 2] = 0;
        st.sparkVel[i * 3] = Math.cos(a) * sp; st.sparkVel[i * 3 + 1] = rnd(2.5, 6); st.sparkVel[i * 3 + 2] = Math.sin(a) * sp;
      }
      st.age = 0;
      const sm = smokeRef.current?.material as PointsMaterial | undefined; if (sm) sm.color.copy(tint);
      const pm = sparkRef.current?.material as PointsMaterial | undefined; if (pm) pm.color.copy(tint);
      const gm = glowRef.current?.material as MeshBasicMaterial | undefined; if (gm) gm.color.copy(tint);
      ringRefs.current.forEach((r) => { const mat = r?.material as MeshBasicMaterial | undefined; if (mat) mat.color.copy(tint); });
    }

    const g = groupRef.current;
    const pos = usePlayerStore.getState().position;
    if (g && pos) g.position.set(pos.x, pos.y - 0.4, pos.z);

    const t = st.age;
    const smokeMat = smokeRef.current?.material as PointsMaterial | undefined;
    const sparkMat = sparkRef.current?.material as PointsMaterial | undefined;
    const glowMat = glowRef.current?.material as MeshBasicMaterial | undefined;

    if (t > DURATION + RING_LIFE) {
      if (smokeMat && smokeMat.opacity !== 0) smokeMat.opacity = 0;
      if (sparkMat && sparkMat.opacity !== 0) sparkMat.opacity = 0;
      if (glowMat && glowMat.opacity !== 0) glowMat.opacity = 0;
      ringRefs.current.forEach((r) => { const mt = r?.material as MeshBasicMaterial | undefined; if (mt && mt.opacity !== 0) mt.opacity = 0; });
      return;
    }
    st.age += dt;

    // Fog/smoke
    if (sArr && sAttr && t <= DURATION) {
      for (let i = 0; i < SMOKE * 3; i++) { sArr[i] += st.smokeVel[i] * dt; st.smokeVel[i] *= 0.9; }
      sAttr.needsUpdate = true;
    }
    if (smokeMat) {
      const fade = t < 0.16 ? t / 0.16 : Math.max(0, 1 - (t - 0.16) / (DURATION - 0.16));
      smokeMat.opacity = fade * 0.9;
      smokeMat.size = 1.8 + t * 3.2;
    }

    // Sparkles (outward + gravity)
    if (pArr && pAttr && t <= SPARK_LIFE) {
      for (let i = 0; i < SPARK; i++) {
        st.sparkVel[i * 3 + 1] -= 9 * dt; // gravity
        pArr[i * 3] += st.sparkVel[i * 3] * dt;
        pArr[i * 3 + 1] = Math.max(0.05, pArr[i * 3 + 1] + st.sparkVel[i * 3 + 1] * dt);
        pArr[i * 3 + 2] += st.sparkVel[i * 3 + 2] * dt;
      }
      pAttr.needsUpdate = true;
    }
    if (sparkMat) {
      sparkMat.opacity = Math.max(0, 1 - t / SPARK_LIFE);
      sparkMat.size = 0.9;
    }

    // Central glow flash
    if (glowRef.current && glowMat) {
      if (t <= GLOW_LIFE) {
        const k = t / GLOW_LIFE;
        const sc = 0.6 + k * 3.2;
        glowRef.current.scale.set(sc, sc, sc);
        glowMat.opacity = (1 - k) * 0.8;
      } else if (glowMat.opacity !== 0) glowMat.opacity = 0;
    }

    // Expanding ground water rings (staggered)
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
        <pointsMaterial map={tex} color="#ffffff" size={1.8} transparent opacity={0} depthWrite={false} sizeAttenuation />
      </points>
      <points ref={sparkRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkInit, 3]} count={SPARK} />
        </bufferGeometry>
        <pointsMaterial map={tex} color="#ffffff" size={0.9} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} sizeAttenuation />
      </points>
      <mesh ref={glowRef} position={[0, 1, 0]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      {Array.from({ length: RINGS }).map((_, i) => (
        <mesh key={i} ref={(el) => { ringRefs.current[i] = el; }} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.82, 1.0, 48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
};
