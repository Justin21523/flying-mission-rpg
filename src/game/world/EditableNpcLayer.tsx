import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useGLTF } from '@react-three/drei';
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier';
import { Vector3, AnimationMixer, LoopRepeat, type Group, type AnimationAction } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useEditorNpcStore } from '../../stores/editorNpcStore';
import type { EditorNpc } from '../../types/editorNPC';
import { useUiStore } from '../../stores/uiStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useWorldClockStore } from '../../stores/worldClockStore';
import { useInteractionStore } from '../../stores/interactionStore';
import { useIncidentStore } from '../../stores/incidentStore';
import { useEditorRandomEventStore } from '../../stores/editorRandomEventStore';
import { useMergedTransform, useIsDeleted } from '../../stores/sceneEditStore';
import { useAnimClipStore } from '../../stores/animClipStore';
import { resolveModelAsset } from '../../stores/modelStudioStore';
import { pickLoopRule } from '../anim/animRunner';
import { useDistanceCull } from '../perf/useDistanceCull';
import { getEffectiveAreaSize } from './areaExtent';
import { objKey } from '../edit/sceneEditMerge';
import type { Vec3 } from '../edit/sceneEditMerge';
import { EditableObject } from '../edit/EditableObject';
import { AnimatedGlbModel } from './AnimatedGlbModel';

// Live motion read by a rule-driven NPC model to pick its animation clip (speed gates / idle vs moving).
interface NpcMotion { moving: boolean; speed: number }
const _idleMotion: NpcMotion = { moving: false, speed: 0 };

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

// Rule-driven animated NPC model — same animation engine as the player (animRunner). Each frame it reads the
// NPC's live motion (speed/moving) and plays the highest-priority looping rule whose trigger matches; with no
// rules (or no clip) it falls back to the model's first clip. Also populates animClipStore so the NPC
// inspector's clip dropdown is filled.
const RuledNpcModel = ({ assetId, rules, motionRef }: { assetId: string; rules: EditorNpc['animations']; motionRef?: MutableRefObject<NpcMotion> }) => {
  const asset = resolveModelAsset(assetId)!;
  const { scene, animations } = useGLTF(encodeURI(asset.path));
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const mixer = useMemo(() => new AnimationMixer(clone), [clone]);
  const actions = useMemo(() => {
    const m = new Map<string, AnimationAction>();
    for (const c of animations ?? []) m.set(c.name, mixer.clipAction(c));
    return m;
  }, [animations, mixer]);
  const firstClip = animations?.[0]?.name;
  useEffect(() => {
    useAnimClipStore.getState().setClips(asset.path, (animations ?? []).map((c) => c.name));
  }, [animations, asset.path]);
  useEffect(() => () => { mixer.stopAllAction(); }, [mixer]);

  const st = useRef({ action: null as AnimationAction | null });
  useFrame((_, dt) => {
    mixer.update(dt);
    const mo = motionRef?.current ?? _idleMotion;
    const best = pickLoopRule(rules ?? [], { speed: mo.speed, moving: mo.moving }, (c) => actions.has(c));
    const clip = best?.clip ?? firstClip;
    if (!clip || !actions.has(clip)) return;
    const next = actions.get(clip)!;
    if (st.current.action !== next) {
      const cf = best?.crossfadeSec ?? 0.2;
      next.reset(); next.setLoop(LoopRepeat, Infinity); next.enabled = true; next.fadeIn(cf).play();
      if (st.current.action) st.current.action.fadeOut(cf);
      st.current.action = next;
    }
  });
  const cullRef = useDistanceCull<Group>(); // hide when far from the player (Play Mode perf)
  return <group ref={cullRef} position={asset.position} rotation={asset.rotation} scale={asset.scale}><primitive object={clone} /></group>;
};

const NpcVisual = ({ npc, motionRef }: { npc: EditorNpc; motionRef?: MutableRefObject<NpcMotion> }) => {
  const useRules = !!npc.modelAssetId && (npc.animations?.length ?? 0) > 0 && !!resolveModelAsset(npc.modelAssetId);
  return (
    <>
      {useRules
        ? <Suspense fallback={<Capsule color={npc.color} />}><RuledNpcModel assetId={npc.modelAssetId!} rules={npc.animations} motionRef={motionRef} /></Suspense>
        : npc.modelAssetId
          ? <AnimatedGlbModel assetId={npc.modelAssetId} animation={npc.animation} fallback={<Capsule color={npc.color} />} />
          : <Capsule color={npc.color} />}
      <Text position={[0, 2, 0]} fontSize={0.35} color="#e0f2fe" anchorX="center" anchorY="middle" outlineWidth={0.025} outlineColor="#000">
        {npc.displayName}
      </Text>
    </>
  );
};

const EditorNpcEntity = ({ npc }: { npc: EditorNpc }) => {
  const editMode = useUiStore((s) => s.editMode);
  const key = objKey(npc.areaId, 'npc', npc.id);
  const base = { position: npc.position, rotation: npc.rotation ?? [0, 0, 0] as [number, number, number], scale: npc.scale ?? 1 };
  const m = useMergedTransform(key, base);
  const deleted = useIsDeleted(key);
  if (deleted) return null; // Edit-Mode Delete (kit soft-delete) hides it

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
  const motionRef = useRef<NpcMotion>({ moving: false, speed: 0 });
  const st = useRef({ wp: 0, near: false, wander: null as Vector3 | null, wanderWait: 0 });
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
      } else if (npc.movement === 'wander') {
        // Roam to random points within the area, pausing briefly on arrival (AI movement, like the cars).
        const s = st.current;
        if (s.wanderWait > 0) {
          s.wanderWait -= dt;
          _target.copy(p);
        } else {
          if (!s.wander || p.distanceTo(s.wander) < ARRIVE) {
            const half = getEffectiveAreaSize(npc.areaId) / 2;
            const radius = Math.min(npc.wanderRadius ?? 12, half);
            const ang = Math.random() * Math.PI * 2;
            const r = radius * (0.3 + Math.random() * 0.7);
            const tx = Math.max(-half, Math.min(half, start[0] + Math.cos(ang) * r));
            const tz = Math.max(-half, Math.min(half, start[2] + Math.sin(ang) * r));
            s.wander = new Vector3(tx, p.y, tz);
            s.wanderWait = 0.4 + Math.random() * 1.6;
          }
          _target.copy(s.wander).setY(p.y);
        }
      } else {
        _target.set(start[0], p.y, start[2]); // static
      }
    }

    // Step toward target + face travel direction (or the incident when reacting & idle).
    _step.copy(_target).sub(p);
    const dist = _step.length();
    const walking = dist > ARRIVE;
    motionRef.current.moving = walking;
    motionRef.current.speed = walking ? speed : 0;
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
        <NpcVisual npc={npc} motionRef={motionRef} />
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
