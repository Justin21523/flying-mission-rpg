import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, CanvasTexture, type BufferAttribute, type Group, type Points, type PointsMaterial } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useTransformStore } from '../../stores/transformStore';

// Transform smoke burst: each time the player transforms (T) or switches character (C) — i.e. the
// transformStore.pulseId changes — a puff of grey-white smoke + cyan sparkle erupts around the
// player, hiding the model swap, then fades to reveal the new form. Idle = invisible.
//
// Follows the kit particle pattern (WeatherParticles): position buffers are mutated via the points
// geometry ref inside one useFrame (needsUpdate); velocities/scalars live in a useRef. No per-frame
// allocations, no mutation of memoized values.

const SMOKE = 140;
const GLOW = 64;
const DURATION = 1.15;  // smoke lifetime (s)
const GLOW_LIFE = 0.8;  // cyan sparkle lifetime (s)

function makeSoftTexture(): CanvasTexture {
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return new CanvasTexture(cv);
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export const TransformSmoke = () => {
  const groupRef = useRef<Group>(null);
  const smokeRef = useRef<Points>(null);
  const glowRef = useRef<Points>(null);
  const tex = useMemo(() => makeSoftTexture(), []);

  // Initial position buffers (also become the geometry's mutable arrays after mount).
  const smokeInit = useMemo(() => new Float32Array(SMOKE * 3), []);
  const glowInit = useMemo(() => new Float32Array(GLOW * 3), []);

  // Mutable, non-rendered state (velocities + timers). Read/written only in useFrame.
  const m = useRef({
    smokeVel: new Float32Array(SMOKE * 3),
    glowVel: new Float32Array(GLOW * 3),
    age: Infinity, // idle until first pulse
    lastPulse: 0,
  });

  useFrame((_, dtRaw) => {
    const st = m.current;
    const dt = Math.min(dtRaw, 0.05);

    const smokeAttr = smokeRef.current?.geometry.attributes.position as BufferAttribute | undefined;
    const glowAttr = glowRef.current?.geometry.attributes.position as BufferAttribute | undefined;
    const smokeArr = smokeAttr?.array as Float32Array | undefined;
    const glowArr = glowAttr?.array as Float32Array | undefined;

    // New transform? respawn the burst at the player.
    const pulse = useTransformStore.getState().pulseId;
    if (pulse !== st.lastPulse && smokeArr && glowArr) {
      st.lastPulse = pulse;
      // Spawn across the whole height + girth of the (large) robot so the cloud fully envelops it.
      for (let i = 0; i < SMOKE; i++) {
        const a = rnd(0, Math.PI * 2), r = rnd(0, 0.9), sp = rnd(1.8, 4.2);
        smokeArr[i * 3] = Math.cos(a) * r;
        smokeArr[i * 3 + 1] = rnd(0.0, 2.6);
        smokeArr[i * 3 + 2] = Math.sin(a) * r;
        st.smokeVel[i * 3] = Math.cos(a) * sp;
        st.smokeVel[i * 3 + 1] = rnd(0.8, 2.8);
        st.smokeVel[i * 3 + 2] = Math.sin(a) * sp;
      }
      for (let i = 0; i < GLOW; i++) {
        const a = rnd(0, Math.PI * 2), r = rnd(0, 0.7), sp = rnd(2.2, 4.6);
        glowArr[i * 3] = Math.cos(a) * r;
        glowArr[i * 3 + 1] = rnd(0.3, 2.4);
        glowArr[i * 3 + 2] = Math.sin(a) * r;
        st.glowVel[i * 3] = Math.cos(a) * sp;
        st.glowVel[i * 3 + 1] = rnd(1.0, 3.0);
        st.glowVel[i * 3 + 2] = Math.sin(a) * sp;
      }
      st.age = 0;
    }

    // Keep the burst centred on the player.
    const g = groupRef.current;
    const pos = usePlayerStore.getState().position;
    if (g && pos) g.position.set(pos.x, 0, pos.z);

    const smokeMat = smokeRef.current?.material as PointsMaterial | undefined;
    const glowMat = glowRef.current?.material as PointsMaterial | undefined;

    if (st.age > DURATION) {
      if (smokeMat && smokeMat.opacity !== 0) smokeMat.opacity = 0;
      if (glowMat && glowMat.opacity !== 0) glowMat.opacity = 0;
      return;
    }

    st.age += dt;
    const t = st.age;

    if (smokeArr && smokeAttr) {
      for (let i = 0; i < SMOKE * 3; i++) { smokeArr[i] += st.smokeVel[i] * dt; st.smokeVel[i] *= 0.90; }
      smokeAttr.needsUpdate = true;
    }
    if (smokeMat) {
      const fade = t < 0.18 ? t / 0.18 : Math.max(0, 1 - (t - 0.18) / (DURATION - 0.18));
      smokeMat.opacity = fade * 0.95;
      smokeMat.size = 2.0 + t * 3.4; // large puffs that cover the whole robot
    }

    if (glowArr && glowAttr) {
      for (let i = 0; i < GLOW * 3; i++) { glowArr[i] += st.glowVel[i] * dt; st.glowVel[i] *= 0.88; }
      glowAttr.needsUpdate = true;
    }
    if (glowMat) {
      const gf = t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.1) / (GLOW_LIFE - 0.1));
      glowMat.opacity = gf;
      glowMat.size = 1.0 + t * 1.6;
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={smokeRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[smokeInit, 3]} count={SMOKE} />
        </bufferGeometry>
        <pointsMaterial map={tex} color="#e8eaed" size={1.0} transparent opacity={0} depthWrite={false} sizeAttenuation />
      </points>
      <points ref={glowRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[glowInit, 3]} count={GLOW} />
        </bufferGeometry>
        <pointsMaterial map={tex} color="#5ad8f5" size={0.6} transparent opacity={0} depthWrite={false} sizeAttenuation blending={AdditiveBlending} />
      </points>
    </group>
  );
};
