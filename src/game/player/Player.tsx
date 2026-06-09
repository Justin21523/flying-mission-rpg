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
import { safeSpawnY } from '../world/groundHeight';
import { EditableObject } from '../edit/EditableObject';
import { applyMovement } from './MovementStateMachine';
import { PlayerMesh } from './PlayerMesh';
import { playerMotion } from './playerMotion';
import { playerKeysDown } from './playerInput';
import { useBoostStore } from '../../stores/boostStore';

// Merged (base ⊕ Edit-Mode override) data for the currently-active main character.
function activeMergedChar() {
  const id = useTransformStore.getState().charId;
  const base = CORE_TEAM.find((c) => c.id === id);
  return base ? getMergedPoliCharacter(base) : undefined;
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
  const wasEdit = useRef(false);    // detects the play→edit transition (to adopt the live position)
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
        if (!useUiStore.getState().editMode && activeMergedChar()?.canFly) useTransformStore.getState().toggleFlight();
        return;
      }
      if (e.code === 'KeyQ' && !e.repeat) { // special ability — per-character built-in ability + FX
        if (!useUiStore.getState().editMode) {
          const c = activeMergedChar();
          if (c) useTransformStore.getState().triggerAbility({
            color: c.abilityColor || c.color,
            type: c.abilityType,
            radius: c.abilityRadius,
            duration: c.abilityDuration,
            strength: c.abilityStrength,
            cooldownSec: c.abilityCooldownSec,
          });
        }
        return;
      }
      if (e.code === 'KeyR' && !e.repeat) { // super-boost (when the meter is full)
        if (!useUiStore.getState().editMode) useBoostStore.getState().activateSuper();
        return;
      }
      keys.current[e.code] = true;
      playerKeysDown.add(e.code); // shared for animation 'key' rules
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; playerKeysDown.delete(e.code); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Restore the saved Edit-Mode override (authored start / reload position) on area change — but ONLY when no
  // travel spawn is pending. (Defined BEFORE the spawn effect so on travel it runs first, sees the pending
  // spawn, and skips — the explicit spawn must win, never get overwritten by the override → no bounce-back.)
  useEffect(() => {
    const b = body.current;
    if (!b || usePlayerStore.getState().spawnRequest) return;
    const ov = useSceneEditStore.getState().overrides[playerKey(currentAreaId)];
    if (ov?.position) {
      b.setTranslation({ x: ov.position[0], y: ov.position[1], z: ov.position[2] }, true);
      b.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, [currentAreaId]);

  // Apply an explicit spawn (area travel / teleport / portal). Authoritative; clearing only re-fires THIS
  // effect (then a no-op), never the override restore above.
  useEffect(() => {
    const b = body.current;
    if (!spawnRequest || !b) return;
    // Lift the spawn above the (possibly sculpted) terrain at this x,z so the player never appears UNDER the
    // ground after travel — they drop onto the surface. Uniform across edge travel / portals / teleports.
    const y = safeSpawnY(usePlayerStore.getState().currentAreaId, spawnRequest.x, spawnRequest.z, spawnRequest.y);
    b.setTranslation({ x: spawnRequest.x, y, z: spawnRequest.z }, true);
    b.setLinvel({ x: 0, y: 0, z: 0 }, true);
    // Keep the player's heading UNCHANGED on arrival — they face exactly the way they did before travelling.
    usePlayerStore.getState().clearSpawnRequest();
  }, [spawnRequest]);

  useFrame(() => {
    const b = body.current;
    if (!b) return;
    const p = b.translation();
    usePlayerStore.getState().setPosition({ x: p.x, y: p.y, z: p.z });

    // Facing: in PLAY mode it's purely the camera-relative movement heading, so it carries over CONTINUOUSLY
    // across area travel. The per-area authored yaw override is applied ONLY in Edit Mode (where the gizmo sets
    // it and heading is held at 0) — applying it in play mode would jump the facing when switching areas.
    const ov = useSceneEditStore.getState().overrides[pKey];
    if (visualRef.current) {
      visualRef.current.rotation.y = headingRef.current + (editMode ? (ov?.rotation?.[1] ?? 0) : 0);
      const sc = ov?.scale ?? 1;
      if (Array.isArray(sc)) visualRef.current.scale.set(sc[0], sc[1], sc[2]);
      else visualRef.current.scale.set(sc, sc, sc);
      // Conceal the model while the transform smoke is dense, then reveal as it fades (the smoke
      // covers the instant model/character swap). animStart=0 → no transform in progress.
      const animStart = useTransformStore.getState().animStart;
      const elapsed = animStart ? (performance.now() / 1000) - animStart : 99;
      visualRef.current.visible = elapsed > TRANSFORM_COVER;
    }

    if (editMode) {
      // On the play→edit transition, adopt the CURRENT play position as the override so the gizmo/handle
      // appear where the player actually is — not at the last edited spot. (Done before the snap below,
      // and before reading the override, so there's no one-frame revert race.)
      if (!wasEdit.current) {
        wasEdit.current = true;
        useSceneEditStore.getState().setOverride(pKey, { position: [p.x, p.y, p.z] });
      }
      b.setLinvel({ x: 0, y: 0, z: 0 }, true);
      headingRef.current = 0; // idle facing shows the pure edited yaw, matching the gizmo
      const ovNow = useSceneEditStore.getState().overrides[pKey];
      if (ovNow?.position && (ovNow.position[0] !== p.x || ovNow.position[1] !== p.y || ovNow.position[2] !== p.z)) {
        b.setTranslation({ x: ovNow.position[0], y: ovNow.position[1], z: ovNow.position[2] }, true);
      }
      return;
    }
    wasEdit.current = false;

    // Advance super-boost mode (speed/flight drain + end).
    useBoostStore.getState().tick(0);

    const tag = (document.activeElement?.tagName ?? '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    // Flight: toggle gravity on transition (0 while flying → true hover; 1 on the ground).
    const flying = useTransformStore.getState().flying;
    if (flying !== lastFlying.current) {
      lastFlying.current = flying;
      b.setGravityScale(flying ? 0 : 1, true);
      if (flying) b.setLinvel({ x: 0, y: 0, z: 0 }, true); // clean hover start
    }

    applyMovement(b, keys.current, camera, headingRef, flying, useTransformStore.getState().form);

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
        {/* Pivot at the FEET: the capsule (half-height 0.5 + radius 0.5, total ±1.0) is raised by 1.0 so
            it spans 0..2 ABOVE the body origin. The body origin therefore sits at the capsule bottom =
            the feet, so when the player object is at y=0 the feet rest exactly on the ground (y=0).
            PlayerMesh normalises each model with feet at local y=0, so the visual group is at the origin. */}
        <CapsuleCollider args={[0.5, 0.5]} position={[0, 1.0, 0]} />
        <group ref={visualRef} position={[0, 0, 0]}>
          <PlayerMesh />
        </group>
      </RigidBody>

      {/* Edit-Mode selectable handle — an INVISIBLE box aligned to the player. The visible mesh
          always stays in the RigidBody. Clicking selects via the kit pipeline → centred gizmo +
          W/E/R + inspector; the gizmo writes the override (auto-saved), mirrored above. */}
      {editMode && (
        <EditableObject objKey={pKey} base={base}>
          <mesh position={[0, 1.0, 0]}>
            <boxGeometry args={[1.1, 2.2, 1.1]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </EditableObject>
      )}
    </>
  );
};
