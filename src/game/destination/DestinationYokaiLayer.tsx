import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3, AnimationMixer, LoopRepeat, type Group, type AnimationAction } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useYokaiCombatStore, liveYokai, type Yokai } from '../../stores/yokaiCombatStore';
import { useHuntStore } from '../../stores/game/huntStore';
import { setSuperDamageSink } from '../combat/applySuperDamage';
import { pullVelocity } from '../combat/pullField';
import { triggerPlayerHit } from '../combat/playerHitBus';
import { MODEL_ASSET_LIST, getModelAsset } from '../../data/modelLibrary';
import { getEnabledAeroYokaiTypes } from '../../stores/game/editorAeroYokaiStore';
import { getEffectiveAreaSize } from '../world/areaExtent';
import { autoHuntRoll } from './huntAuto';
import { robotHandle } from './robotHandle';

// Destination yokai-hunt runtime — the aero twin of the POLI YokaiCombatLayer, driven by the robot
// (robotHandle) + huntStore instead of the POLI player / activity system. While a hunt is active it spawns
// yokai (from the aero yokai types) in a ring around the robot, runs the same behaviour AI, lets super moves
// damage them (registers the super-damage sink), ticks the hunt clock, and poofs defeats. Play-only.
const YOKAI_MODELS = MODEL_ASSET_LIST.filter((a) => a.category === 'yokais');
const YOKAI_HEIGHT = 2.4;
const SPAWN_RING_MIN = 16;
const SPAWN_RING_MAX = 30;
const RENDER_DIST = 48;
const DESPAWN_DIST = 64;
const DEST_AREA = 'aero_destination';
let uid = 0;

export const DestinationYokaiLayer = () => {
  const active = useHuntStore((s) => s.active);
  const version = useYokaiCombatStore((s) => s.version);

  // Register the super-damage sink for the hunt's lifetime (supers from Batch 2 now damage yokai).
  useEffect(() => {
    if (!active) return;
    setSuperDamageSink(useYokaiCombatStore.getState().damage);
    return () => setSuperDamageSink(null);
  }, [active]);

  const spawnTimer = useRef(0);
  const autoTimer = useRef(0);
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const hs = useHuntStore.getState();
    if (!hs.active) {
      // Auto director — randomly start a hunt while at the destination (opt-in via the hunt config).
      const roll = autoHuntRoll(hs.config, autoTimer.current, dt);
      autoTimer.current = roll.timer;
      if (roll.start) hs.start();
      return;
    }
    hs.tick(dt);
    if (!useHuntStore.getState().active) return; // clock ran out this frame
    const cfg = useHuntStore.getState().config;
    const store = useYokaiCombatStore.getState();
    store.removeDead();
    store.cullFar(robotHandle.pos.x, robotHandle.pos.z, DESPAWN_DIST);
    spawnTimer.current += dt;
    if (spawnTimer.current >= Math.max(0.12, cfg.spawnIntervalSec)) {
      spawnTimer.current = 0;
      spawnYokai();
      spawnYokai();
      store.trimToCap(Math.max(cfg.maxActive, 12));
    }
  });

  if (!active) return null;
  void version;
  return <>{liveYokai.map((y) => <YokaiEntity key={y.id} y={y} />)}</>;
};

function spawnYokai(): void {
  const types = getEnabledAeroYokaiTypes();
  if (types.length === 0) return;
  const type = types[Math.floor(Math.random() * types.length)];
  const half = getEffectiveAreaSize(DEST_AREA);
  const ang = Math.random() * Math.PI * 2;
  const r = SPAWN_RING_MIN + Math.random() * (SPAWN_RING_MAX - SPAWN_RING_MIN);
  const x = Math.max(-half, Math.min(half, robotHandle.pos.x + Math.cos(ang) * r));
  const z = Math.max(-half, Math.min(half, robotHandle.pos.z + Math.sin(ang) * r));
  let modelPath = '';
  if (type.modelAssetId) { const a = getModelAsset(type.modelAssetId); if (a) modelPath = encodeURI(a.path); }
  if (!modelPath && YOKAI_MODELS.length) modelPath = encodeURI(YOKAI_MODELS[Math.floor(Math.random() * YOKAI_MODELS.length)].path);
  const maxHp = Math.max(10, type.hp);
  useYokaiCombatStore.getState().spawn({
    id: `yk_${uid++}`, modelPath, color: type.color, elite: type.elite, maxHp, hp: maxHp,
    x, y: 0, z, vx: 0, vz: 0, clipSeed: Math.random(), dyingAt: 0,
    behavior: type.behavior, moveSpeed: type.moveSpeed, aggroRange: type.aggroRange,
    attackRange: type.attackRange, attackRate: type.attackRate, attackDamage: type.attackDamage,
    fleeHpPct: type.fleeHpPct, nextAttackAt: 0, flankAng: Math.random() * Math.PI * 2,
  });
}

// A yokai lands a light, recoverable hit: knock the robot back + shave the hunt clock (no death).
function attackRobot(dirX: number, dirZ: number, attackDamage: number): void {
  triggerPlayerHit(dirX, dirZ, 6 + attackDamage * 0.3);
  useHuntStore.getState().nibble(attackDamage * 0.08);
}

const YokaiEntity = ({ y }: { y: Yokai }) => {
  const groupRef = useRef<Group>(null);
  const st = useRef({ wanderT: 0, ang: 0 });
  useFrame((_, dtRaw) => {
    const g = groupRef.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    const e = liveYokai.find((o) => o.id === y.id);
    if (!e) return;
    if (e.dyingAt) {
      const k = Math.max(0, 1 - (performance.now() / 1000 - e.dyingAt) / 0.4);
      g.visible = true; g.scale.setScalar(k);
      return;
    }
    const px = robotHandle.pos.x, pz = robotHandle.pos.z;
    if ((px - e.x) ** 2 + (pz - e.z) ** 2 > RENDER_DIST * RENDER_DIST) {
      if (g.visible) g.visible = false;
      g.position.set(e.x, e.y, e.z);
      return;
    }
    if (!g.visible) g.visible = true;
    st.current.wanderT -= dt;
    if (st.current.wanderT <= 0) { st.current.ang = Math.random() * Math.PI * 2; st.current.wanderT = 0.6 + Math.random() * 1.2; }
    const dx = px - e.x, dz = pz - e.z;
    const dist = Math.hypot(dx, dz) || 1;
    const ux = dx / dist, uz = dz / dist;
    let gx: number, gz: number, mult = 1;
    const fleeing = e.fleeHpPct > 0 && e.hp < e.fleeHpPct * e.maxHp;
    if (fleeing) { gx = -ux; gz = -uz; mult = 1.4; }
    else if (e.behavior === 'chaser') { gx = ux; gz = uz; }
    else if (e.behavior === 'ambusher') {
      if (dist > e.aggroRange) { gx = Math.cos(st.current.ang); gz = Math.sin(st.current.ang); mult = 0.4; }
      else { gx = ux; gz = uz; mult = 1.9; }
    } else if (e.behavior === 'kiter') {
      if (dist < e.attackRange * 0.85) { gx = -ux; gz = -uz; }
      else if (dist > e.attackRange) { gx = ux; gz = uz; }
      else { gx = -uz; gz = ux; }
    } else {
      e.flankAng += dt * 0.6;
      gx = (px + Math.cos(e.flankAng) * 3.5) - e.x;
      gz = (pz + Math.sin(e.flankAng) * 3.5) - e.z;
      const gl = Math.hypot(gx, gz) || 1; gx /= gl; gz /= gl;
    }
    const pv = pullVelocity(e.x, e.z);
    let vx = gx + Math.cos(st.current.ang) * 0.15 + pv.vx;
    let vz = gz + Math.sin(st.current.ang) * 0.15 + pv.vz;
    const len = Math.hypot(vx, vz) || 1; vx /= len; vz /= len;
    const half = getEffectiveAreaSize(DEST_AREA);
    e.x = Math.max(-half, Math.min(half, e.x + vx * e.moveSpeed * mult * dt));
    e.z = Math.max(-half, Math.min(half, e.z + vz * e.moveSpeed * mult * dt));
    g.rotation.y = Math.atan2(vx, vz);
    const tnow = performance.now() / 1000;
    if (!fleeing && dist < e.attackRange + 0.6 && tnow >= e.nextAttackAt) {
      e.nextAttackAt = tnow + Math.max(0.3, e.attackRate);
      attackRobot(ux, uz, e.attackDamage);
    }
    g.position.set(e.x, e.y, e.z);
    g.scale.setScalar(1);
  });
  return (
    <group ref={groupRef} position={[y.x, y.y, y.z]}>
      <Suspense fallback={<YokaiCapsule color={y.color} />}>
        {y.modelPath ? <YokaiModel path={y.modelPath} seed={y.clipSeed} /> : <YokaiCapsule color={y.color} />}
      </Suspense>
    </group>
  );
};

const YokaiModel = ({ path, seed }: { path: string; seed: number }) => {
  const { scene, animations } = useGLTF(path);
  const { clone, scale, offset } = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    const box = new Box3().setFromObject(c);
    const size = new Vector3(); const center = new Vector3();
    box.getSize(size); box.getCenter(center);
    const nativeH = Number.isFinite(size.y) && size.y > 1e-4 ? size.y : 1;
    const s = YOKAI_HEIGHT / nativeH;
    const ox = Number.isFinite(center.x) ? -center.x * s : 0;
    const oy = Number.isFinite(box.min.y) ? -box.min.y * s : 0;
    const oz = Number.isFinite(center.z) ? -center.z * s : 0;
    return { clone: c, scale: s, offset: [ox, oy, oz] as [number, number, number] };
  }, [scene]);
  const mixer = useMemo(() => new AnimationMixer(clone), [clone]);
  useEffect(() => {
    const clips = animations ?? [];
    if (clips.length === 0) return;
    const clip = clips[Math.floor(seed * clips.length) % clips.length];
    const a: AnimationAction = mixer.clipAction(clip);
    a.setLoop(LoopRepeat, Infinity); a.play();
    return () => { mixer.stopAllAction(); };
  }, [mixer, animations, seed]);
  useFrame((_, dt) => mixer.update(Math.min(dt, 0.05)));
  return <primitive object={clone} scale={scale} position={offset} />;
};

const YokaiCapsule = ({ color }: { color: string }) => (
  <mesh castShadow position={[0, 0.85, 0]}>
    <capsuleGeometry args={[0.4, 0.9, 4, 12]} />
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
  </mesh>
);
