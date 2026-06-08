import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier';
import { Vector3, type Group } from 'three';
import { useEditorNpcStore } from '../../stores/editorNpcStore';
import type { EditorNpc } from '../../types/editorNPC';
import { useUiStore } from '../../stores/uiStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useWorldClockStore } from '../../stores/worldClockStore';
import { useInteractionStore } from '../../stores/interactionStore';
import { useIncidentStore } from '../../stores/incidentStore';
import { useEditorRandomEventStore } from '../../stores/editorRandomEventStore';
import { useMergedTransform } from '../../stores/sceneEditStore';
import { objKey } from '../edit/sceneEditMerge';
import type { Vec3 } from '../edit/sceneEditMerge';
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
  // Play Mode: all NPCs go through the driven path so they can move (patrol/schedule) AND react to
  // nearby incidents. Static NPCs simply hold their start position until something happens.
  return <MovingNpc npc={npc} start={m.position} />;
};

// Driven NPC — patrol/schedule/static movement + nearby-incident reaction + distance interaction.
// Physics: a kinematic-position Rapier body with a capsule collider follows the NPC each frame, so the
// player collides with NPCs (can't walk through them) while they keep walking. The visual group rotates
// to face travel; the body stays radially symmetric (capsule), so only its translation is driven.
const MovingNpc = ({ npc, start }: { npc: EditorNpc; start: Vec3 }) => {
  const bodyRef = useRef<RapierRigidBody>(null);
  const visualRef = useRef<Group>(null);
  const alertRef = useRef<Group>(null);
  const posRef = useRef(new Vector3(start[0], start[1], start[2]));
  const st = useRef({ wp: 0, near: false });
  const speed = npc.moveSpeed ?? 1.6;
  const scale = npc.scale ?? 1;
  const label = npc.interactionLabel || `Talk to ${npc.displayName}`;

  useFrame((_, dtRaw) => {
    const body = bodyRef.current;
    const g = visualRef.current;
    if (!body || !g) return;
    const dt = Math.min(dtRaw, 0.05);
    const p = posRef.current; // live WORLD position (the body is kinematic; visual is a local child)

    // ── React to the nearest spawned incident in this area (overrides normal movement). ──
    let reacting = false;
    let faceYaw: number | null = null;
    const rcfg = useEditorRandomEventStore.getState().reaction;
    if (rcfg.enabled) {
      const incs = useIncidentStore.getState().getActiveForArea(npc.areaId);
      let best: { x: number; z: number; d: number } | null = null;
      for (const d of incs) {
        const dx = d.markerPosition[0] - p.x;
        const dz = d.markerPosition[2] - p.z;
        const dist = Math.hypot(dx, dz);
        if (dist < rcfg.radius && (!best || dist < best.d)) best = { x: d.markerPosition[0], z: d.markerPosition[2], d: dist };
      }
      if (best) {
        reacting = true;
        faceYaw = Math.atan2(best.x - p.x, best.z - p.z);
        if (rcfg.mode === 'approach') {
          if (best.d > 2.2) _target.set(best.x, p.y, best.z);
          else _target.copy(p);
        } else if (rcfg.mode === 'flee') {
          const len = best.d || 1;
          _target.set(p.x - (best.x - p.x) / len * 3, p.y, p.z - (best.z - p.z) / len * 3);
        } else { // watch
          _target.copy(p);
        }
      }
    }

    // ── Normal movement target when not reacting. ──
    if (!reacting) {
      if (npc.movement === 'patrol' && npc.patrolWaypoints && npc.patrolWaypoints.length > 1) {
        const wps = npc.patrolWaypoints;
        const i = st.current.wp % wps.length;
        _target.set(wps[i][0], p.y, wps[i][2]);
        if (p.distanceTo(_target) < ARRIVE) st.current.wp = (st.current.wp + 1) % wps.length;
      } else if (npc.movement === 'schedule') {
        const phase = useWorldClockStore.getState().timeOfDay;
        const sp = npc.schedulePositions?.[phase] ?? start;
        _target.set(sp[0], p.y, sp[2]);
      } else {
        _target.set(start[0], p.y, start[2]); // static
      }
    }

    // Step toward target + face travel direction (or the incident when reacting & idle).
    _step.copy(_target).sub(p);
    const dist = _step.length();
    if (dist > 1e-3) {
      const move = Math.min(speed * dt, dist);
      _step.multiplyScalar(move / dist);
      p.add(_step);
      g.rotation.y = Math.atan2(_step.x, _step.z);
    } else if (faceYaw !== null) {
      g.rotation.y = faceYaw;
    }

    // Drive the kinematic body to the new world position (player collides with it).
    body.setNextKinematicTranslation({ x: p.x, y: p.y, z: p.z });

    // "!" alert above the NPC while reacting.
    if (alertRef.current) alertRef.current.visible = reacting;

    // Distance interaction (hysteresis) so [E]/dialogue work while walking.
    const pp = usePlayerStore.getState().position;
    if (pp) {
      const d = Math.hypot(pp.x - p.x, pp.z - p.z);
      if (!st.current.near && d < INTERACT_R) { st.current.near = true; useInteractionStore.getState().setTarget(npc.id, 'npc', label); }
      else if (st.current.near && d > INTERACT_R + 0.6) { st.current.near = false; useInteractionStore.getState().clearTarget(npc.id); }
    }
  });

  return (
    <RigidBody ref={bodyRef} type="kinematicPosition" colliders={false} position={[start[0], start[1], start[2]]}>
      {/* Capsule collider so the player can't walk through the NPC (sized to the NPC scale). */}
      <CapsuleCollider args={[0.5 * scale, 0.4 * scale]} position={[0, 0.9 * scale, 0]} />
      {/* Visual child rotates to face travel; the body itself only translates. */}
      <group ref={visualRef} scale={scale}>
        <NpcVisual npc={npc} />
        <group ref={alertRef} visible={false}>
          <Text position={[0, 2.7, 0]} fontSize={0.6} color="#fde047" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="#000" renderOrder={2}>!</Text>
        </group>
      </group>
    </RigidBody>
  );
};

const Capsule = ({ color = '#38bdf8' }: { color?: string }) => (
  <mesh castShadow position={[0, 0.9, 0]}>
    <capsuleGeometry args={[0.4, 0.9, 4, 12]} />
    <meshStandardMaterial color={color} />
  </mesh>
);
