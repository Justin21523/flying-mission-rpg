import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3, AnimationMixer, LoopRepeat, type Group, type AnimationAction } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useUiStore } from '../../stores/uiStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useActivityStore } from '../../stores/activityStore';
import { useYokaiCombatStore, liveYokai, type Yokai } from '../../stores/yokaiCombatStore';
import { setSuperDamageSink } from '../combat/applySuperDamage';
import { pullVelocity } from '../combat/pullField';
import { MODEL_ASSET_LIST } from '../../data/modelLibrary';
import { getEffectiveAreaSize } from '../world/areaExtent';

// POLI yokai-hunt runtime (Phase B) — play-mode only. While an `enemyRush` activity is running in THIS area,
// it spawns yokai up to the cap at the arena spawn points, makes them roam toward the player with random
// animations, lets the super moves damage them (registers the super-damage sink), and defeats poof them.
// Editing/authoring of the hunt happens via the existing ActivityArenaRenderer gizmos, so this renders nothing
// in Edit Mode. Sibling layer in AreaRenderer — no kit-core changes.

const YOKAI_MODELS = MODEL_ASSET_LIST.filter((a) => a.category === 'yokais');
const YOKAI_HEIGHT = 1.7;
const BASE_HP = 100;
let uid = 0;

export const YokaiCombatLayer = ({ areaId }: { areaId: string }) => {
  const editMode = useUiStore((s) => s.editMode);
  const isActive = useActivityStore((s) => s.isActive);
  const phase = useActivityStore((s) => s.phase);
  const activity = useActivityStore((s) => s.activity);
  const version = useYokaiCombatStore((s) => s.version); // re-render the mesh list on spawn/removal

  // AreaRenderer only mounts for the CURRENT area, so a running enemyRush hunt always belongs here — no need to
  // match zoneId (lets a seed/authored hunt run wherever the player is).
  const huntHere = isActive && phase === 'running' && activity?.def.activityType === 'enemyRush';

  // Start/stop the hunt session + register the super-damage sink for its lifetime.
  useEffect(() => {
    if (!huntHere) return;
    const store = useYokaiCombatStore.getState();
    store.start();
    setSuperDamageSink(store.damage);
    return () => { setSuperDamageSink(null); useYokaiCombatStore.getState().stop(); };
  }, [huntHere]);

  const spawnTimer = useRef(0);
  useFrame((_, dtRaw) => {
    if (!huntHere || !activity?.rushConfig) return;
    const dt = Math.min(dtRaw, 0.05);
    const rush = activity.rushConfig;
    useYokaiCombatStore.getState().removeDead();
    const alive = liveYokai.reduce((n, y) => n + (y.dyingAt ? 0 : 1), 0);
    spawnTimer.current += dt;
    if (spawnTimer.current >= Math.max(0.2, rush.spawnIntervalSeconds) && alive < rush.maxActiveEnemies) {
      spawnTimer.current = 0;
      spawnYokai(activity);
    }
  });

  if (editMode || !huntHere) return null;
  // version read above keeps this list in sync with spawns/removals.
  void version;
  return <>{liveYokai.map((y) => <YokaiEntity key={y.id} y={y} areaId={areaId} moveSpeed={activity?.rushConfig?.moveSpeed ?? 3} />)}</>;
};

function spawnYokai(activity: NonNullable<ReturnType<typeof useActivityStore.getState>['activity']>): void {
  const rush = activity.rushConfig!;
  const pts = activity.arena.points;
  const eliteOk = !!pts.eliteSpawn?.length;
  const elite = eliteOk && Math.random() < (rush.eliteChance ?? 0.1);
  const list = (elite ? pts.eliteSpawn : pts.rushSpawn) ?? pts.rushSpawn ?? pts.eliteSpawn ?? [[0, 0, 8]];
  const p = list[Math.floor(Math.random() * list.length)];
  const model = YOKAI_MODELS.length ? YOKAI_MODELS[Math.floor(Math.random() * YOKAI_MODELS.length)] : null;
  const maxHp = Math.max(10, BASE_HP * (rush.enemyHpScale ?? 0.4) * (elite ? 2.5 : 1));
  useYokaiCombatStore.getState().spawn({
    id: `yk_${uid++}`, modelPath: model ? encodeURI(model.path) : '',
    color: elite ? '#ef4444' : '#a855f7', elite, maxHp, hp: maxHp,
    x: p[0], y: p[1] ?? 0, z: p[2], vx: 0, vz: 0, clipSeed: Math.random(), dyingAt: 0,
  });
}

// One live yokai: roams toward the player with wander, plays a random clip, poofs (shrinks) on defeat.
const YokaiEntity = ({ y, areaId, moveSpeed }: { y: Yokai; areaId: string; moveSpeed: number }) => {
  const groupRef = useRef<Group>(null);
  const st = useRef({ wanderT: 0, ang: 0 }); // wanderT 0 → first frame picks a random angle

  useFrame((_, dtRaw) => {
    const g = groupRef.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    // Resolve the live (mutable) entry from the module array — never mutate the prop object directly.
    const e = liveYokai.find((o) => o.id === y.id);
    if (!e) return;

    if (e.dyingAt) { // defeat poof — shrink out
      const k = Math.max(0, 1 - (performance.now() / 1000 - e.dyingAt) / 0.4);
      g.scale.setScalar(k);
      return;
    }

    const pp = usePlayerStore.getState().position;
    if (pp) {
      // Chase the player with a wandering jitter so the swarm "causes trouble" rather than beelines.
      st.current.wanderT -= dt;
      if (st.current.wanderT <= 0) { st.current.ang = Math.random() * Math.PI * 2; st.current.wanderT = 0.6 + Math.random() * 1.2; }
      const dx = pp.x - e.x, dz = pp.z - e.z;
      const dist = Math.hypot(dx, dz) || 1;
      const chase = dist > 2 ? 1 : -0.3; // back off a touch when very close
      const pv = pullVelocity(e.x, e.z); // black-hole suck (dominates direction when active)
      const vx = (dx / dist) * chase + Math.cos(st.current.ang) * 0.4 + pv.vx;
      const vz = (dz / dist) * chase + Math.sin(st.current.ang) * 0.4 + pv.vz;
      const len = Math.hypot(vx, vz) || 1;
      const half = getEffectiveAreaSize(areaId);
      e.x = Math.max(-half, Math.min(half, e.x + (vx / len) * moveSpeed * dt));
      e.z = Math.max(-half, Math.min(half, e.z + (vz / len) * moveSpeed * dt));
      g.rotation.y = Math.atan2(vx, vz);
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

// Normalized, animated yokai model (random clip). Mirrors the kit model-clone + Box3 normalization pattern.
const YokaiModel = ({ path, seed }: { path: string; seed: number }) => {
  const { scene, animations } = useGLTF(path);
  const { clone, scale, offset } = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    const box = new Box3().setFromObject(c);
    const size = new Vector3();
    const center = new Vector3();
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
