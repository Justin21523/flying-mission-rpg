import { useEffect } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import { DoubleSide } from 'three';
import { useUiStore } from '../../stores/uiStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useEditorCollisionStore } from '../../stores/editorCollisionStore';
import { DataBackedPlacement } from '../edit/DataBackedPlacement';
import { registerCollision, unregisterCollision } from '../collision/collisionRegistry';
import { emitCollision } from '../collision/collisionBus';
import { playerMotion } from '../player/playerMotion';
import type { CollisionObjectDef } from '../../types/collision';

// POLI (Phase C) — classified test collidables. Play Mode: each is a fixed body carrying its id in userData;
// a solid collider (when `solid`) lets the player bump it, and a slightly larger sensor detects the player
// (identified by userData.isPlayer) → builds a GameplayCollisionEvent (enter / impact-at-speed / exit) and
// emits it on the collision bus, where the reaction engine matches rules. Edit Mode: a DataBackedPlacement
// (drag → store). Sibling layer in AreaRenderer (kit seam #1). Metadata lives in the central resolver, never
// read ad-hoc from userData.
const NO_RAYCAST = () => null;
const DEFAULT_IMPACT = 4;

const ObjVisual = ({ o }: { o: CollisionObjectDef }) => {
  const [sx, sy, sz] = o.size;
  const color = o.color ?? '#94a3b8';
  return (
    <group>
      <mesh position={[0, sy / 2, 0]} raycast={NO_RAYCAST}>
        <boxGeometry args={[sx, sy, sz]} />
        <meshStandardMaterial color={color} transparent opacity={o.solid ? 0.85 : 0.4} side={DoubleSide} />
      </mesh>
      <Text position={[0, sy + 0.4, 0]} fontSize={0.32} color="#e2e8f0" anchorX="center" anchorY="middle" outlineWidth={0.025} outlineColor="#000" raycast={NO_RAYCAST}>
        {`${o.label ?? o.objectType} · ${o.objectType}`}
      </Text>
    </group>
  );
};

const PlayObj = ({ o }: { o: CollisionObjectDef }) => {
  const [sx, sy, sz] = o.size;
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;

  // Register/unregister this object's semantic metadata in the central resolver.
  useEffect(() => {
    registerCollision({ objectId: o.id, objectType: o.objectType, tags: o.tags, surfaceType: o.surfaceType, enabled: o.enabled });
    return () => unregisterCollision(o.id);
  }, [o]);

  const fire = (phase: 'enter' | 'exit', payload: { other: { rigidBody?: { userData?: unknown } } }) => {
    if (!o.enabled) return;
    const ud = payload.other.rigidBody?.userData as { isPlayer?: boolean } | undefined;
    if (!ud?.isPlayer) return; // only the player drives reactions in Phase C
    const pp = usePlayerStore.getState().position;
    if (!pp) return;
    const spd = playerMotion.speed;
    // Contact normal = object → player (the push-away direction for applyForce).
    let nx = pp.x - o.position[0], nz = pp.z - o.position[2];
    const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
    const base = {
      sourceId: 'player' as const, sourceType: 'player' as const, targetId: o.id, targetType: o.objectType,
      sourceTags: ['player'], targetTags: o.tags,
      contactPoint: [pp.x, pp.y, pp.z] as [number, number, number],
      contactNormal: [nx, 0, nz] as [number, number, number],
      relativeSpeed: spd, impactStrength: spd, timestamp: performance.now() / 1000,
    };
    emitCollision({ phase, ...base });
    // A fast entry also raises a distinct 'impact' event (crate-break etc.).
    if (phase === 'enter' && spd >= (o.impactSpeed ?? DEFAULT_IMPACT)) emitCollision({ phase: 'impact', ...base });
  };

  return (
    <group position={o.position}>
      <ObjVisual o={o} />
      <RigidBody type="fixed" colliders={false} userData={{ collisionId: o.id }}>
        {o.solid && <CuboidCollider args={[hx, hy, hz]} position={[0, hy, 0]} />}
        <CuboidCollider
          args={[hx + 0.3, hy + 0.3, hz + 0.3]}
          position={[0, hy, 0]}
          sensor
          onIntersectionEnter={(p) => fire('enter', p)}
          onIntersectionExit={(p) => fire('exit', p)}
        />
      </RigidBody>
    </group>
  );
};

const EditObj = ({ o }: { o: CollisionObjectDef }) => {
  const updateObjectPosition = useEditorCollisionStore((s) => s.updateObjectPosition);
  return (
    <DataBackedPlacement objKey={`${o.id}#collobj`} position={o.position} color={o.color ?? '#94a3b8'} onMove={(p) => updateObjectPosition(o.id, p)}>
      <ObjVisual o={o} />
    </DataBackedPlacement>
  );
};

export const CollisionTestLayer = ({ areaId }: { areaId: string }) => {
  const editMode = useUiStore((s) => s.editMode);
  const objects = useEditorCollisionStore((s) => s.objects).filter((o) => o.areaId === areaId);
  if (objects.length === 0) return null;
  return <>{objects.map((o) => (editMode ? <EditObj key={o.id} o={o} /> : <PlayObj key={o.id} o={o} />))}</>;
};
