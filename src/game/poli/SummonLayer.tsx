import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { AdditiveBlending, Box3, Color, Vector3, MeshStandardMaterial, type Group, type Mesh } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useUiStore } from '../../stores/uiStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useTransformStore } from '../../stores/transformStore';
import { CORE_TEAM } from '../../data/characters/coreTeam';
import { getMergedPoliCharacter } from '../../stores/editorPoliCharacterStore';
import { useSummonStore, liveSummons, type Summon } from '../../stores/summonStore';
import { liveYokai } from '../../stores/yokaiCombatStore';
import { applySuperDamage } from '../combat/applySuperDamage';

// POLI yokai-hunt (Phase H) — renders + drives the temporary summons: a 替身 clone (a tinted copy of the
// player's model that darts to the nearest yokai) and a sentry drone (a glowing orb that orbits the player).
// Each auto-attacks on its own timer (radius AoE via applySuperDamage) — no player input needed. Play mode only.

const CLONE_SPEED = 8;
const HIT_INTERVAL = 0.5;

const nearestYokai = (x: number, z: number): { x: number; z: number; d: number } | null => {
  let best: { x: number; z: number; d: number } | null = null;
  for (const y of liveYokai) {
    if (y.dyingAt) continue;
    const d = Math.hypot(y.x - x, y.z - z);
    if (!best || d < best.d) best = { x: y.x, z: y.z, d };
  }
  return best;
};

export const SummonLayer = () => {
  const editMode = useUiStore((s) => s.editMode);
  const version = useSummonStore((s) => s.version);
  // Current player model (for the clone) — same source as the player/afterimage.
  const charId = useTransformStore((s) => s.charId);
  const form = useTransformStore((s) => s.form);
  const base = CORE_TEAM.find((c) => c.id === charId);
  const merged = base ? getMergedPoliCharacter(base) : undefined;
  const clonePath = (form === 'vehicle' ? merged?.modelVehiclePath : merged?.modelRobotPath) || '';

  useFrame(() => useSummonStore.getState().sweep());

  if (editMode) return null;
  void version;
  return <>{liveSummons.map((s) => <SummonEntity key={s.id} s={s} clonePath={clonePath} />)}</>;
};

const SummonEntity = ({ s, clonePath }: { s: Summon; clonePath: string }) => {
  const groupRef = useRef<Group>(null);
  useFrame((_, dtRaw) => {
    const g = groupRef.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    const e = liveSummons.find((o) => o.id === s.id);
    if (!e) return;
    const tnow = performance.now() / 1000;
    const tgt = nearestYokai(e.x, e.z);

    if (e.kind === 'clone') {
      let gx = e.x, gz = e.z;
      if (tgt) { gx = tgt.x; gz = tgt.z; }
      else { const pp = usePlayerStore.getState().position; if (pp) { gx = pp.x + 1.5; gz = pp.z + 1.5; } }
      const dx = gx - e.x, dz = gz - e.z; const d = Math.hypot(dx, dz) || 1;
      const step = Math.min(CLONE_SPEED * dt, d);
      e.x += (dx / d) * step; e.z += (dz / d) * step;
      g.rotation.y = Math.atan2(dx, dz);
    } else { // sentry — orbit the player, face the nearest yokai
      const pp = usePlayerStore.getState().position;
      e.orbitAng += dt * 2;
      if (pp) { e.x = pp.x + Math.cos(e.orbitAng) * 3; e.z = pp.z + Math.sin(e.orbitAng) * 3; e.y = pp.y + 1.6; }
      if (tgt) g.rotation.y = Math.atan2(tgt.x - e.x, tgt.z - e.z);
      g.rotation.z += dt * 6;
    }
    g.position.set(e.x, e.y, e.z);

    // Auto-attack: radius AoE pulse at the summon's position.
    if (tnow >= e.nextHitAt) {
      e.nextHitAt = tnow + HIT_INTERVAL;
      applySuperDamage({ kind: 'nova', x: e.x, y: e.y, z: e.z, dirX: 0, dirZ: 1, damage: e.damage, radius: e.radius, range: 0, count: 0 });
    }
  });

  return (
    <group ref={groupRef} position={[s.x, s.y, s.z]}>
      {s.kind === 'clone' && clonePath
        ? <Suspense fallback={<SentryVisual color={s.color} />}><CloneVisual path={clonePath} color={s.color} /></Suspense>
        : <SentryVisual color={s.color} />}
    </group>
  );
};

// Tinted, translucent copy of the player's model (the 替身).
const CloneVisual = ({ path, color }: { path: string; color: string }) => {
  const { scene } = useGLTF(path);
  const { clone, scale, offset } = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    const box = new Box3().setFromObject(c);
    const size = new Vector3(); const center = new Vector3();
    box.getSize(size); box.getCenter(center);
    const nativeH = Number.isFinite(size.y) && size.y > 1e-4 ? size.y : 1;
    const sc = 1.8 / nativeH;
    const ox = Number.isFinite(center.x) ? -center.x * sc : 0;
    const oy = Number.isFinite(box.min.y) ? -box.min.y * sc : 0;
    const oz = Number.isFinite(center.z) ? -center.z * sc : 0;
    const mat = new MeshStandardMaterial({ color: new Color(color), emissive: new Color(color), emissiveIntensity: 0.7, transparent: true, opacity: 0.6, depthWrite: false });
    c.traverse((o) => { const m = o as Mesh; if (m.isMesh) m.material = mat; });
    return { clone: c, scale: sc, offset: [ox, oy, oz] as [number, number, number] };
  }, [scene, color]);
  return <primitive object={clone} scale={scale} position={offset} />;
};

// Glowing sentry drone — a core orb, an equatorial ring, and a halo.
const SentryVisual = ({ color }: { color: string }) => (
  <group>
    <mesh><sphereGeometry args={[0.45, 16, 12]} /><meshBasicMaterial color={color} transparent opacity={0.95} depthWrite={false} blending={AdditiveBlending} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.8, 0.08, 8, 24]} /><meshBasicMaterial color={color} transparent opacity={0.8} depthWrite={false} blending={AdditiveBlending} /></mesh>
    <mesh><sphereGeometry args={[0.9, 16, 12]} /><meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} blending={AdditiveBlending} /></mesh>
  </group>
);
