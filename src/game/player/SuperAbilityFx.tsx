import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, CanvasTexture, Color, type BufferAttribute, type Group, type Mesh, type Points, type PointsMaterial, type MeshBasicMaterial } from 'three';
import { useTransformStore } from '../../stores/transformStore';

// POLI yokai-hunt — VFX for the six super-move KINDS (keys 1/2/3). Watches transformStore.superFxPulseId and
// reads the superFx payload (kind/color/origin/direction/radius/range/...). One reusable set of meshes + a
// spark Points pool is driven per-kind in useFrame (kit pattern: preallocated buffers, no per-frame allocation,
// no re-renders). The group is placed at the player origin and yaw-aligned to the facing direction, so beam /
// bolt / dash extend along local +Z while nova / meteor are radial.

const SPARK = 90;
const RINGS = 4;
const BOLTS = 5;
const METEORS = 8;
const DASH = 12;
const LIFE = 1.3; // overall effect window (s); each kind finishes within this

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

export const SuperAbilityFx = () => {
  const groupRef = useRef<Group>(null);
  const sparkRef = useRef<Points>(null);
  const glowRef = useRef<Mesh>(null);
  const beamRef = useRef<Mesh>(null);
  const orbRef = useRef<Mesh>(null);
  const boomerangRef = useRef<Mesh>(null);
  const ringRefs = useRef<(Mesh | null)[]>([]);
  const boltRefs = useRef<(Mesh | null)[]>([]);
  const meteorRefs = useRef<(Mesh | null)[]>([]);
  const dashRefs = useRef<(Mesh | null)[]>([]);
  const tex = useMemo(() => makeSoftTexture(), []);
  const sparkInit = useMemo(() => new Float32Array(SPARK * 3), []);
  const tint = useMemo(() => new Color('#ffffff'), []);
  // Per-meteor random offset + stagger (filled on each meteor pulse).
  const meteorData = useRef({ ox: new Float32Array(METEORS), oz: new Float32Array(METEORS), delay: new Float32Array(METEORS) });
  const m = useRef({
    sparkVel: new Float32Array(SPARK * 3), age: Infinity, lastPulse: 0,
    kind: 'nova' as string, radius: 8, range: 14, duration: 0.8, count: 4,
  });

  // Convenience: set a mesh material's opacity (and optionally colour) without allocating.
  const setOpacity = (mesh: Mesh | null, o: number) => { const mt = mesh?.material as MeshBasicMaterial | undefined; if (mt && mt.opacity !== o) mt.opacity = o; };

  useFrame((_, dtRaw) => {
    const st = m.current;
    const dt = Math.min(dtRaw, 0.05);
    const store = useTransformStore.getState();
    const sAttr = sparkRef.current?.geometry.attributes.position as BufferAttribute | undefined;
    const sArr = sAttr?.array as Float32Array | undefined;

    // New super → configure for this kind.
    if (store.superFxPulseId !== st.lastPulse && store.superFx && sArr && sAttr) {
      const fx = store.superFx;
      st.lastPulse = store.superFxPulseId;
      st.kind = fx.kind; st.radius = fx.radius; st.range = fx.range; st.duration = fx.duration; st.count = fx.count;
      st.age = 0;
      tint.set(fx.color || '#ffffff');
      // Place + orient the whole group (local +Z = facing direction).
      const g = groupRef.current;
      if (g) { g.position.set(fx.x, fx.y, fx.z); g.rotation.y = Math.atan2(fx.dirX, fx.dirZ); }
      // Spark burst (every kind) — outward + up.
      for (let i = 0; i < SPARK; i++) {
        const a = rnd(0, Math.PI * 2), sp = rnd(3, 9);
        sArr[i * 3] = 0; sArr[i * 3 + 1] = rnd(0.4, 1.4); sArr[i * 3 + 2] = 0;
        st.sparkVel[i * 3] = Math.cos(a) * sp; st.sparkVel[i * 3 + 1] = rnd(2, 6); st.sparkVel[i * 3 + 2] = Math.sin(a) * sp;
      }
      sAttr.needsUpdate = true;
      // Tint all the materials once.
      const sm = sparkRef.current?.material as PointsMaterial | undefined; if (sm) sm.color.copy(tint);
      [glowRef.current, beamRef.current, orbRef.current, boomerangRef.current].forEach((me) => { const mt = me?.material as MeshBasicMaterial | undefined; if (mt) mt.color.copy(tint); });
      ringRefs.current.forEach((r) => { const mt = r?.material as MeshBasicMaterial | undefined; if (mt) mt.color.copy(tint); });
      boltRefs.current.forEach((r) => { const mt = r?.material as MeshBasicMaterial | undefined; if (mt) mt.color.copy(tint); });
      meteorRefs.current.forEach((r) => { const mt = r?.material as MeshBasicMaterial | undefined; if (mt) mt.color.copy(tint); });
      dashRefs.current.forEach((r) => { const mt = r?.material as MeshBasicMaterial | undefined; if (mt) mt.color.copy(tint); });
      // Meteor layout.
      for (let i = 0; i < METEORS; i++) {
        const a = rnd(0, Math.PI * 2), r = rnd(1, st.radius);
        meteorData.current.ox[i] = Math.cos(a) * r; meteorData.current.oz[i] = Math.sin(a) * r;
        meteorData.current.delay[i] = (i / Math.max(1, st.count)) * st.duration;
      }
    }

    const t = st.age;
    if (t > LIFE) {
      // Fully idle: hide everything.
      const sm = sparkRef.current?.material as PointsMaterial | undefined; if (sm && sm.opacity !== 0) sm.opacity = 0;
      setOpacity(glowRef.current, 0); setOpacity(beamRef.current, 0); setOpacity(orbRef.current, 0);
      ringRefs.current.forEach((r) => setOpacity(r, 0));
      boltRefs.current.forEach((r) => setOpacity(r, 0));
      meteorRefs.current.forEach((r) => setOpacity(r, 0));
      dashRefs.current.forEach((r) => setOpacity(r, 0));
      return;
    }
    st.age += dt;

    // Spark burst (shared) — outward + gravity, ~0.9s.
    if (sArr && sAttr && t <= 0.9) {
      for (let i = 0; i < SPARK; i++) {
        st.sparkVel[i * 3 + 1] -= 9 * dt;
        sArr[i * 3] += st.sparkVel[i * 3] * dt;
        sArr[i * 3 + 1] = Math.max(0.05, sArr[i * 3 + 1] + st.sparkVel[i * 3 + 1] * dt);
        sArr[i * 3 + 2] += st.sparkVel[i * 3 + 2] * dt;
      }
      sAttr.needsUpdate = true;
    }
    const sm = sparkRef.current?.material as PointsMaterial | undefined;
    if (sm) sm.opacity = Math.max(0, 1 - t / 0.9);

    // Central glow flash (every kind) — quick pop at the origin.
    if (glowRef.current) {
      if (t <= 0.45) { const k = t / 0.45; const sc = 0.5 + k * 2.6; glowRef.current.scale.setScalar(sc); setOpacity(glowRef.current, (1 - k) * 0.85); }
      else setOpacity(glowRef.current, 0);
    }

    const kind = st.kind;

    // NOVA — expanding ground rings out to radius.
    ringRefs.current.forEach((r, i) => {
      if (!r) return;
      if (kind !== 'nova') { setOpacity(r, 0); return; }
      const rt = t - i * 0.1;
      if (rt < 0 || rt > 0.8) { setOpacity(r, 0); return; }
      const k = rt / 0.8;
      const radius = 0.4 + k * st.radius;
      r.scale.set(radius, radius, radius);
      setOpacity(r, (1 - k) * 0.8);
    });

    // ORB — homing-style glow that streaks forward then bursts.
    if (orbRef.current) {
      if (kind !== 'orb') setOpacity(orbRef.current, 0);
      else {
        const travel = 0.35;
        if (t <= travel) { const k = t / travel; orbRef.current.position.set(0, 1.0, k * Math.min(st.radius, 14)); orbRef.current.scale.setScalar(0.7); setOpacity(orbRef.current, 0.95); }
        else setOpacity(orbRef.current, 0);
      }
    }

    // BEAM — forward bar that snaps out and fades over duration.
    if (beamRef.current) {
      if (kind !== 'beam') setOpacity(beamRef.current, 0);
      else {
        const dur = Math.max(0.3, st.duration);
        if (t <= dur) { const k = t / dur; beamRef.current.scale.set(1 + Math.sin(t * 40) * 0.15, 1, st.range); beamRef.current.position.set(0, 1.0, st.range / 2); setOpacity(beamRef.current, (1 - k) * 0.85); }
        else setOpacity(beamRef.current, 0);
      }
    }

    // BOLT — a short volley of streaks racing forward. CHAIN reuses the streaks as a jagged forward zig-zag.
    const boltLike = kind === 'bolt' || kind === 'chain';
    boltRefs.current.forEach((r, i) => {
      if (!r) return;
      if (!boltLike || i >= st.count) { setOpacity(r, 0); return; }
      const bt = t - i * 0.05;
      if (bt < 0 || bt > 0.35) { setOpacity(r, 0); return; }
      const k = bt / 0.35;
      const lateral = kind === 'chain' ? (i % 2 === 0 ? 1 : -1) * (0.4 + i * 0.25) : (i - (st.count - 1) / 2) * 0.5;
      r.position.set(lateral, 1.0, k * st.range);
      setOpacity(r, (1 - k) * 0.9);
    });

    // BOOMERANG — a spinning disc that flies out along +Z and curves back.
    if (boomerangRef.current) {
      if (kind !== 'boomerang') setOpacity(boomerangRef.current, 0);
      else {
        const dur = 0.9;
        if (t <= dur) { const k = t / dur; boomerangRef.current.position.set(0, 1.0, Math.sin(k * Math.PI) * st.range); boomerangRef.current.rotation.z += dt * 32; setOpacity(boomerangRef.current, 0.95); }
        else setOpacity(boomerangRef.current, 0);
      }
    }

    // METEOR — strikes raining down on random nearby points (auto-target flavour).
    meteorRefs.current.forEach((r, i) => {
      if (!r) return;
      if (kind !== 'meteor' || i >= st.count) { setOpacity(r, 0); return; }
      const mt = t - meteorData.current.delay[i];
      const fall = 0.4;
      if (mt < 0 || mt > fall + 0.25) { setOpacity(r, 0); return; }
      const ox = meteorData.current.ox[i], oz = meteorData.current.oz[i];
      if (mt <= fall) { const k = mt / fall; r.position.set(ox, 14 * (1 - k) + 0.5, oz); r.scale.setScalar(0.6); setOpacity(r, 0.95); }
      else { const k = (mt - fall) / 0.25; r.position.set(ox, 0.5, oz); r.scale.setScalar(0.6 + k * 1.6); setOpacity(r, (1 - k) * 0.9); } // impact flash
    });

    // DASH — a trail of fading puffs laid forward along the strike path.
    dashRefs.current.forEach((r, i) => {
      if (!r) return;
      if (kind !== 'dash') { setOpacity(r, 0); return; }
      const frac = i / (DASH - 1);
      const dt2 = t - frac * Math.max(0.2, st.duration);
      if (dt2 < 0 || dt2 > 0.5) { setOpacity(r, 0); return; }
      const k = dt2 / 0.5;
      r.position.set(0, 1.0, frac * st.range);
      r.scale.setScalar(0.8 - frac * 0.3);
      setOpacity(r, (1 - k) * 0.8);
    });
  });

  return (
    <group ref={groupRef}>
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
      {/* beam: a unit-length forward bar scaled to range on Z */}
      <mesh ref={beamRef} position={[0, 1, 0]}>
        <boxGeometry args={[0.7, 0.7, 1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      <mesh ref={orbRef} position={[0, 1, 0]}>
        <sphereGeometry args={[0.5, 14, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      <mesh ref={boomerangRef} position={[0, 1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.16, 8, 20]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      {Array.from({ length: RINGS }).map((_, i) => (
        <mesh key={`r${i}`} ref={(el) => { ringRefs.current[i] = el; }} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.82, 1.0, 48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      ))}
      {Array.from({ length: BOLTS }).map((_, i) => (
        <mesh key={`b${i}`} ref={(el) => { boltRefs.current[i] = el; }} position={[0, 1, 0]}>
          <boxGeometry args={[0.18, 0.18, 1.4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      ))}
      {Array.from({ length: METEORS }).map((_, i) => (
        <mesh key={`m${i}`} ref={(el) => { meteorRefs.current[i] = el; }} position={[0, 14, 0]}>
          <sphereGeometry args={[0.5, 12, 10]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      ))}
      {Array.from({ length: DASH }).map((_, i) => (
        <mesh key={`d${i}`} ref={(el) => { dashRefs.current[i] = el; }} position={[0, 1, 0]}>
          <sphereGeometry args={[0.45, 10, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
};
