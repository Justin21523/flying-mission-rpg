import { useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Vector3, type Group } from 'three';
import { useUiStore } from '../../stores/uiStore';
import { useEditorGameNpcStore } from '../../stores/game/editorGameNpcStore';
import { useWorldClockStore } from '../../stores/worldClockStore';
import { getModelAsset } from '../../data/modelLibrary';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { EditableObject } from '../edit/EditableObject';
import { useMergedTransform, useIsDeleted } from '../../stores/sceneEditStore';
import { objKey } from '../edit/sceneEditMerge';
import { npcDefaults } from '../npc/npcDialogueSelect';
import type { AnimState } from '../anim/animRunner';
import type { NPCDefinition } from '../../types/game/npc';

// Destination NPCs — every game NPC with a placement renders here (gizmo-draggable in edit; name marker +
// idle/wave bob in play). In Play, NPCs with a movement mode (patrol/wander/schedule) walk; NPCs with
// animation rules drive their GLB clip by the same engine the player uses. Interaction ([E]) is handled by
// the objective director.
const npcPlacementKey = (id: string) => objKey('destination', 'npc', id);
const _tgt = new Vector3();
const _dir = new Vector3();

const NpcVisual = ({ npc, getAnimState }: { npc: NPCDefinition; getAnimState: () => AnimState }) => {
  const g = useRef<Group>(null);
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime;
    if (npc.initialState === 'waving') g.current.rotation.z = Math.sin(t * 4) * 0.12;
    else if (npc.initialState === 'worried') g.current.position.x = Math.sin(t * 6) * 0.04;
    else g.current.position.y = Math.sin(t * 2) * 0.04; // idle/waiting gentle bob
  });
  const color = npc.color || npcDefaults(npc.npcType).color;
  const rules = npc.animations && npc.animations.length ? npc.animations : undefined;
  const placeholder = (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.35, 0.7, 4, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
  return (
    <group ref={g}>
      {npc.modelAssetId && getModelAsset(npc.modelAssetId) ? (
        <AnimatedGlbModel assetId={npc.modelAssetId} rules={rules} getAnimState={rules ? getAnimState : undefined} fallback={placeholder} noCull />
      ) : placeholder}
      <Html center distanceFactor={26} position={[0, 2.3, 0]}>
        <div className="pointer-events-none whitespace-nowrap rounded-full bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
          ⭑ {npc.name}
        </div>
      </Html>
    </group>
  );
};

// Play-mode NPC: walks per its movement mode (no per-frame allocation), driving an AnimState for its rules.
const PlayNpc = ({ npc, base }: { npc: NPCDefinition; base: { position: [number, number, number]; rotation: [number, number, number]; scale: number | [number, number, number] } }) => {
  const outer = useRef<Group>(null);
  const idx = useRef(0);
  const wanderTarget = useRef(new Vector3(base.position[0], base.position[1], base.position[2]));
  const anim = useRef<AnimState>({ speed: 0, moving: false });
  const getAnimState = useCallback(() => anim.current, []);

  useFrame((_, dtRaw) => {
    const o = outer.current;
    if (!o) return;
    const dt = Math.min(dtRaw, 0.05);
    const mode = npc.movement ?? 'static';
    const home = npc.position ?? base.position;
    // resolve the current target
    if (mode === 'patrol' && npc.patrolWaypoints && npc.patrolWaypoints.length) {
      const wp = npc.patrolWaypoints[idx.current % npc.patrolWaypoints.length];
      _tgt.set(wp[0], wp[1], wp[2]);
    } else if (mode === 'wander') {
      _tgt.copy(wanderTarget.current);
    } else if (mode === 'schedule') {
      const p = npc.schedulePositions?.[useWorldClockStore.getState().timeOfDay] ?? home;
      _tgt.set(p[0], p[1], p[2]);
    } else {
      _tgt.set(home[0], home[1], home[2]);
    }
    _dir.set(_tgt.x - o.position.x, 0, _tgt.z - o.position.z);
    const dist = _dir.length();
    let moving = false;
    if (mode !== 'static' && dist > 0.1) {
      const speed = npc.moveSpeed ?? 1.6;
      const step = Math.min(dist, speed * dt);
      o.position.x += (_dir.x / dist) * step;
      o.position.z += (_dir.z / dist) * step;
      o.rotation.y = Math.atan2(_dir.x, _dir.z);
      moving = true;
    } else if (dist <= 0.1) {
      if (mode === 'patrol' && npc.patrolWaypoints && npc.patrolWaypoints.length) idx.current = (idx.current + 1) % npc.patrolWaypoints.length;
      else if (mode === 'wander') {
        const r = npc.wanderRadius ?? 8;
        wanderTarget.current.set(home[0] + (Math.random() * 2 - 1) * r, home[1], home[2] + (Math.random() * 2 - 1) * r);
      }
    }
    anim.current.moving = moving;
    anim.current.speed = moving ? Math.min(1, (npc.moveSpeed ?? 1.6) / 3) : 0;
  });

  return (
    <group ref={outer} position={base.position} rotation={base.rotation} scale={base.scale}>
      <NpcVisual npc={npc} getAnimState={getAnimState} />
    </group>
  );
};

const NpcEntity = ({ npc, editMode }: { npc: NPCDefinition; editMode: boolean }) => {
  const key = npcPlacementKey(npc.id);
  const base = {
    position: (npc.position ?? [0, 0, 0]) as [number, number, number],
    rotation: [0, ((npc.rotationY ?? 0) * Math.PI) / 180, 0] as [number, number, number],
    scale: 1,
  };
  const m = useMergedTransform(key, base);
  const deleted = useIsDeleted(key);
  const idleState = useCallback((): AnimState => ({ speed: 0, moving: false }), []);
  if (deleted || !npc.position) return null;

  if (editMode) {
    return (
      <EditableObject objKey={key} base={base} assetId={npc.modelAssetId ?? undefined}>
        <NpcVisual npc={npc} getAnimState={idleState} />
      </EditableObject>
    );
  }
  return <PlayNpc npc={npc} base={m} />;
};

export const DestinationNpcLayer = () => {
  const editMode = useUiStore((s) => s.editMode);
  const npcs = useEditorGameNpcStore((s) => s.items);
  return (
    <>
      {npcs.map((n) => (
        <NpcEntity key={n.id} npc={n} editMode={editMode} />
      ))}
    </>
  );
};
