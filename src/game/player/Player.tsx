import { useEffect, useRef } from 'react';
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier';
import { useFrame, useThree } from '@react-three/fiber';
import { Group } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useUiStore } from '../../stores/uiStore';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { useTransformStore } from '../../stores/transformStore';
import { getMergedPoliCharacter } from '../../stores/editorPoliCharacterStore';
import { CORE_TEAM } from '../../data/characters/coreTeam';
import { objKey } from '../edit/sceneEditMerge';
import type { BaseTransform } from '../edit/sceneEditMerge';
import { EditableObject } from '../edit/EditableObject';
import { applyMovement } from './MovementStateMachine';
import { PlayerMesh } from './PlayerMesh';
import { playerMotion } from './playerMotion';

// Whether the currently-active main character can fly (base data ⊕ Edit-Mode override).
function activeCanFly(): boolean {
  const id = useTransformStore.getState().charId;
  const base = CORE_TEAM.find((c) => c.id === id);
  return base ? !!getMergedPoliCharacter(base).canFly : false;
}

// Stable module-level initial spawn — MUST NOT be an inline array on <RigidBody>, or a per-render
// new reference makes react-three-rapier reset the body to it every frame (pins the player at spawn).
const INITIAL_POS: [number, number, number] = [0, 2, 0];

// Seconds the player mesh stays hidden after a transform, while the smoke is dense (then revealed).
const TRANSFORM_COVER = 0.35;

// The player's Edit-Mode handle reuses the kit core like every other object: an EditableObject keyed
// area#npc#poli. Selecting it gives the shared centred gizmo + W/E/R + inspector and writes the
// transform override (auto-saved). The body/mesh mirror that override so edits apply in Play Mode.
const playerKey = (areaId: string) => objKey(areaId, 'npc', 'poli');

export const Player = () => {
  const body = useRef<RapierRigidBody>(null);
  const visualRef = useRef<Group>(null);
  // Subscribe only to rarely-changing values — never to position (per-frame → would reset the body).
  const editMode = useUiStore((s) => s.editMode);
  const currentAreaId = usePlayerStore((s) => s.currentAreaId);
  const spawnRequest = usePlayerStore((s) => s.spawnRequest);
  const keys = useRef<Record<string, boolean>>({});
  const headingRef = useRef(0);
  const lastFlying = useRef(false); // tracks gravityScale transitions
  const { camera } = useThree();

  const pKey = playerKey(currentAreaId);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Handled via getState so Player never re-renders on these (PlayerMesh subscribes and swaps
      // which model is visible; the smoke + cover window conceal the swap).
      if (e.code === 'KeyT' && !e.repeat) { // transform vehicle⇄robot
        if (!useUiStore.getState().editMode) useTransformStore.getState().toggleForm();
        return;
      }
      if (e.code === 'KeyC' && !e.repeat) { // cycle the 4 main characters
        if (!useUiStore.getState().editMode) useTransformStore.getState().cycleCharacter();
        return;
      }
      if (e.code === 'KeyF' && !e.repeat) { // toggle flight (only if the active character can fly)
        if (!useUiStore.getState().editMode && activeCanFly()) useTransformStore.getState().toggleFlight();
        return;
      }
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Teleport on spawn request (area travel).
  useEffect(() => {
    if (spawnRequest && body.current) {
      body.current.setTranslation(spawnRequest, true);
      body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      usePlayerStore.getState().clearSpawnRequest();
    }
  }, [spawnRequest]);

  // On mount / area change, apply the saved Edit-Mode position override for this area (persisted in
  // the kit sceneEditStore) so the player spawns where it was placed and it survives reload.
  useEffect(() => {
    const ov = useSceneEditStore.getState().overrides[playerKey(currentAreaId)];
    if (ov?.position && body.current) {
      body.current.setTranslation({ x: ov.position[0], y: ov.position[1], z: ov.position[2] }, true);
      body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, [currentAreaId]);

  useFrame(() => {
    const b = body.current;
    if (!b) return;
    const p = b.translation();
    usePlayerStore.getState().setPosition({ x: p.x, y: p.y, z: p.z });

    // Apply edited yaw offset + scale to the visible mesh (facing = movement heading + offset).
    const ov = useSceneEditStore.getState().overrides[pKey];
    if (visualRef.current) {
      visualRef.current.rotation.y = headingRef.current + (ov?.rotation?.[1] ?? 0);
      const s = ov?.scale ?? 1;
      visualRef.current.scale.set(s, s, s);
      // Conceal the model while the transform smoke is dense, then reveal as it fades (the smoke
      // covers the instant model/character swap). animStart=0 → no transform in progress.
      const animStart = useTransformStore.getState().animStart;
      const elapsed = animStart ? (performance.now() / 1000) - animStart : 99;
      visualRef.current.visible = elapsed > TRANSFORM_COVER;
    }

    if (editMode) {
      b.setLinvel({ x: 0, y: 0, z: 0 }, true);
      headingRef.current = 0; // idle facing shows the pure edited yaw, matching the gizmo
      if (ov?.position && (ov.position[0] !== p.x || ov.position[1] !== p.y || ov.position[2] !== p.z)) {
        b.setTranslation({ x: ov.position[0], y: ov.position[1], z: ov.position[2] }, true);
      }
      return;
    }

    const tag = (document.activeElement?.tagName ?? '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    // Flight: toggle gravity on transition (0 while flying → true hover; 1 on the ground).
    const flying = useTransformStore.getState().flying;
    if (flying !== lastFlying.current) {
      lastFlying.current = flying;
      b.setGravityScale(flying ? 0 : 1, true);
      if (flying) b.setLinvel({ x: 0, y: 0, z: 0 }, true); // clean hover start
    }

    applyMovement(b, keys.current, camera, headingRef, flying);

    // Publish motion for the rotor + jet (no re-render). moving drives the rotor spin.
    const k = keys.current;
    playerMotion.heading = headingRef.current;
    playerMotion.moving = flying && !!(k['KeyW'] || k['KeyS'] || k['KeyA'] || k['KeyD'] || k['Space'] || k['ShiftLeft']);
  });

  // Base for the Edit-Mode handle = the player's current position (read non-reactively).
  const cur = usePlayerStore.getState().position;
  const base: BaseTransform = {
    position: [cur?.x ?? 0, cur?.y ?? 1, cur?.z ?? 0],
    rotation: [0, 0, 0],
    scale: 1,
  };

  return (
    <>
      <RigidBody ref={body} type="dynamic" colliders={false} lockRotations canSleep={false} position={INITIAL_POS}>
        <CapsuleCollider args={[0.5, 0.5]} />
        <group ref={visualRef} position={[0, 0.5, 0]}>
          <PlayerMesh />
        </group>
      </RigidBody>

      {/* Edit-Mode selectable handle — an INVISIBLE box aligned to the player. The visible mesh
          always stays in the RigidBody. Clicking selects via the kit pipeline → centred gizmo +
          W/E/R + inspector; the gizmo writes the override (auto-saved), mirrored above. */}
      {editMode && (
        <EditableObject objKey={pKey} base={base}>
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[1.1, 2.2, 1.1]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </EditableObject>
      )}
    </>
  );
};
