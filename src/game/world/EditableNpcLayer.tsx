import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Vector3, type Group } from 'three';
import { useEditorNpcStore } from '../../stores/editorNpcStore';
import type { EditorNpc } from '../../types/editorNPC';
import { useUiStore } from '../../stores/uiStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useWorldClockStore } from '../../stores/worldClockStore';
import { useInteractionStore } from '../../stores/interactionStore';
import { useMergedTransform } from '../../stores/sceneEditStore';
import { objKey } from '../edit/sceneEditMerge';
import type { Vec3 } from '../edit/sceneEditMerge';
import { Interactable } from '../interaction/Interactable';
import { EditableObject } from '../edit/EditableObject';
import { AnimatedGlbModel } from './AnimatedGlbModel';

// Kit — renders NPCs created in the 🧑 NPC tab for the current area. Edit Mode: each NPC is a
// selectable EditableObject (gizmo + inspector). Play Mode: static NPCs are talkable Interactables;
// patrol/schedule NPCs walk (driven group) and register interaction by distance so [E]/dialogue still
// work while moving.

const INTERACT_R = 2.4;
const ARRIVE = 0.25;
// Module temp vectors — no per-frame allocation.
const _target = new Vector3();
const _step = new Vector3();

export const EditableNpcLayer = ({ areaId }: { areaId: string }) => {
  const npcs = useEditorNpcStore((s) => s.addedNpcs);
  const here = npcs.filter((n) => n.areaId === areaId);
  if (here.length === 0) return null;
  return <>{here.map((npc) => <EditorNpcEntity key={npc.id} npc={npc} />)}</>;
};

const NpcVisual = ({ npc }: { npc: EditorNpc }) => (
  <>
    {npc.modelAssetId
      ? <AnimatedGlbModel assetId={npc.modelAssetId} animation={npc.animation} fallback={<Capsule color={npc.color} />} />
      : <Capsule color={npc.color} />}
    <Text position={[0, 2, 0]} fontSize={0.35} color="#e0f2fe" anchorX="center" anchorY="middle" outlineWidth={0.025} outlineColor="#000">
      {npc.displayName}
    </Text>
  </>
);

const EditorNpcEntity = ({ npc }: { npc: EditorNpc }) => {
  const editMode = useUiStore((s) => s.editMode);
  const key = objKey(npc.areaId, 'npc', npc.id);
  const base = { position: npc.position, rotation: npc.rotation ?? [0, 0, 0] as [number, number, number], scale: npc.scale ?? 1 };
  const m = useMergedTransform(key, base);

  // Edit Mode: gizmo-selectable at base transform (movement is paused while editing).
  if (editMode) {
    return <EditableObject objKey={key} base={base}>{<NpcVisual npc={npc} />}</EditableObject>;
  }

  const moves = (npc.movement === 'patrol' && (npc.patrolWaypoints?.length ?? 0) > 1)
    || npc.movement === 'schedule';

  if (!moves) {
    return (
      <Interactable id={npc.id} type="npc" label={npc.interactionLabel || `Talk to ${npc.displayName}`} position={m.position} isSolid colliderArgs={[0.5, 1, 0.5]}>
        <group rotation={m.rotation} scale={m.scale}><NpcVisual npc={npc} /></group>
      </Interactable>
    );
  }
  return <MovingNpc npc={npc} start={m.position} />;
};

// Patrol/schedule NPC — driven group + distance-based interaction.
const MovingNpc = ({ npc, start }: { npc: EditorNpc; start: Vec3 }) => {
  const groupRef = useRef<Group>(null);
  const st = useRef({ wp: 0, near: false });
  const speed = npc.moveSpeed ?? 1.6;
  const label = npc.interactionLabel || `Talk to ${npc.displayName}`;

  useFrame((_, dtRaw) => {
    const g = groupRef.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05);

    // Resolve current target.
    if (npc.movement === 'patrol' && npc.patrolWaypoints && npc.patrolWaypoints.length > 1) {
      const wps = npc.patrolWaypoints;
      const i = st.current.wp % wps.length;
      _target.set(wps[i][0], g.position.y, wps[i][2]);
      if (g.position.distanceTo(_target) < ARRIVE) st.current.wp = (st.current.wp + 1) % wps.length;
    } else {
      const phase = useWorldClockStore.getState().timeOfDay;
      const p = npc.schedulePositions?.[phase] ?? start;
      _target.set(p[0], g.position.y, p[2]);
    }

    // Step toward target + face travel direction.
    _step.copy(_target).sub(g.position);
    const dist = _step.length();
    if (dist > 1e-3) {
      const move = Math.min(speed * dt, dist);
      _step.multiplyScalar(move / dist);
      g.position.add(_step);
      g.rotation.y = Math.atan2(_step.x, _step.z);
    }

    // Distance interaction (hysteresis) so [E]/dialogue work while walking.
    const pp = usePlayerStore.getState().position;
    if (pp) {
      const d = Math.hypot(pp.x - g.position.x, pp.z - g.position.z);
      if (!st.current.near && d < INTERACT_R) { st.current.near = true; useInteractionStore.getState().setTarget(npc.id, 'npc', label); }
      else if (st.current.near && d > INTERACT_R + 0.6) { st.current.near = false; useInteractionStore.getState().clearTarget(npc.id); }
    }
  });

  return (
    <group ref={groupRef} position={[start[0], start[1], start[2]]} scale={npc.scale ?? 1}>
      <NpcVisual npc={npc} />
    </group>
  );
};

const Capsule = ({ color = '#38bdf8' }: { color?: string }) => (
  <mesh castShadow position={[0, 0.9, 0]}>
    <capsuleGeometry args={[0.4, 0.9, 4, 12]} />
    <meshStandardMaterial color={color} />
  </mesh>
);
