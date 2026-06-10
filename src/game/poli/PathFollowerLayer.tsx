import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import { Vector3, type Group } from 'three';
import { useUiStore } from '../../stores/uiStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useEditorPathFollowerStore } from '../../stores/editorPathFollowerStore';
import { useIncidentFollowerStore } from '../../stores/incidentFollowerStore';
import { getPath } from '../../stores/editorPathStore';
import { advanceFollower, followerPose } from '../path/pathFollowerAI';
import { dropFollowerState } from '../path/followerRuntime';
import { registerCollision, unregisterCollision } from '../collision/collisionRegistry';
import { emitCollision } from '../collision/collisionBus';
import { playerMotion } from '../player/playerMotion';
import { NormalizedGlbModel } from '../world/NormalizedGlbModel';
import type { PathFollowerDef } from '../../types/pathFollower';

// POLI (Phase E) — NPCs / vehicles that drive the curve PathDefinition system with obstacle / spacing /
// incident / reroute AI (pathFollowerAI). Play Mode: one kinematic body per copy (so the player meets them),
// advanced by a single per-def useFrame; each copy registers collision metadata + a sensor so Phase C rules
// (player×vehicle / player×npc) fire on contact. Edit Mode: a static preview at the path entry. Sibling layer
// in AreaRenderer (kit seam #1) — TrafficLayer/RoadPath untouched.
const _pos = new Vector3();

const FollowerVisual = ({ def }: { def: PathFollowerDef }) => {
  const color = def.color ?? '#38bdf8';
  if (def.modelAssetId) return <NormalizedGlbModel assetId={def.modelAssetId} target={def.scale ?? 2} />;
  const [rx, ry] = def.size ?? [0.5, 1.4, 0.5];
  if (def.kind === 'vehicle') {
    const s = def.size ?? [0.9, 1.2, 2.2];
    return (
      <mesh position={[0, s[1] / 2, 0]} castShadow>
        <boxGeometry args={s} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
      </mesh>
    );
  }
  return (
    <mesh position={[0, ry / 2 + rx, 0]} castShadow>
      <capsuleGeometry args={[rx, Math.max(0.2, ry - rx * 2), 4, 8]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
};

const FollowerEntity = ({ def }: { def: PathFollowerDef }) => {
  const count = Math.max(1, def.count);
  const bodies = useRef<(RapierRigidBody | null)[]>([]);
  const visuals = useRef<(Group | null)[]>([]);
  const nowRef = useRef(0); // last frame time (s) — read by the sensor handler (no impure call in render)
  const [rx, ry] = def.size ?? [0.5, 1.4, 0.5];

  // Register/unregister each copy's collision metadata (so Phase C player×vehicle/npc rules can match).
  useEffect(() => {
    for (let i = 0; i < count; i++) registerCollision({ objectId: `${def.id}#${i}`, objectType: def.kind, tags: [def.kind], enabled: def.enabled });
    return () => { for (let i = 0; i < count; i++) unregisterCollision(`${def.id}#${i}`); dropFollowerState(def.id); };
  }, [def.id, def.kind, def.enabled, count]);

  useFrame((_, dtRaw) => {
    if (!def.enabled) return;
    const dt = Math.min(dtRaw, 0.05);
    nowRef.current = performance.now() / 1000;
    for (let i = 0; i < count; i++) {
      const ok = advanceFollower(def, i, dt);
      const b = bodies.current[i];
      if (!b) continue;
      if (!ok) continue;
      const yaw = followerPose(def, i, _pos);
      b.setNextKinematicTranslation({ x: _pos.x, y: _pos.y, z: _pos.z });
      const v = visuals.current[i];
      if (v) v.rotation.y = yaw;
    }
  });

  const fire = (i: number, phase: 'enter' | 'exit', payload: { other: { rigidBody?: { userData?: unknown } } }) => {
    const ud = payload.other.rigidBody?.userData as { isPlayer?: boolean } | undefined;
    if (!ud?.isPlayer) return;
    const pp = usePlayerStore.getState().position;
    const b = bodies.current[i];
    if (!pp || !b) return;
    const t = b.translation();
    let nx = pp.x - t.x, nz = pp.z - t.z; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
    const spd = playerMotion.speed;
    emitCollision({
      phase, sourceId: 'player', sourceType: 'player', targetId: `${def.id}#${i}`, targetType: def.kind,
      sourceTags: ['player'], targetTags: [def.kind],
      contactPoint: [pp.x, pp.y, pp.z], contactNormal: [nx, 0, nz],
      relativeSpeed: spd, impactStrength: spd, timestamp: nowRef.current,
    });
  };

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <RigidBody key={i} ref={(el) => { bodies.current[i] = el; }} type="kinematicPosition" colliders={false} userData={{ collisionId: `${def.id}#${i}` }}>
          <CapsuleCollider args={[Math.max(0.2, ry / 2), rx]} position={[0, ry / 2 + rx, 0]} />
          <CuboidCollider args={[rx + 0.4, ry / 2 + 0.4, rx + 0.4]} position={[0, ry / 2, 0]} sensor onIntersectionEnter={(p) => fire(i, 'enter', p)} onIntersectionExit={(p) => fire(i, 'exit', p)} />
          <group ref={(el) => { visuals.current[i] = el; }}>
            <FollowerVisual def={def} />
          </group>
        </RigidBody>
      ))}
    </>
  );
};

// Edit Mode: static preview at the path's first node (no sim, no body) so authors see where it starts.
const FollowerPreview = ({ def }: { def: PathFollowerDef }) => {
  const p = getPath(def.pathId);
  const start = p?.nodes?.[0]?.position;
  if (!start) return null;
  return (
    <group position={start}>
      <FollowerVisual def={def} />
    </group>
  );
};

export const PathFollowerLayer = ({ areaId }: { areaId: string }) => {
  const editMode = useUiStore((s) => s.editMode);
  const followers = useEditorPathFollowerStore((s) => s.followers).filter((f) => f.areaId === areaId);
  // Scenario-spawned ephemeral followers (real moving vehicles) — play mode only.
  const ephemeral = useIncidentFollowerStore((s) => s.followers).filter((f) => f.areaId === areaId);
  if (editMode) return followers.length === 0 ? null : <>{followers.map((f) => <FollowerPreview key={f.id} def={f} />)}</>;
  const all = [...followers, ...ephemeral];
  if (all.length === 0) return null;
  return <>{all.map((f) => <FollowerEntity key={f.id} def={f} />)}</>;
};
