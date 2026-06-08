import { useEffect, useRef } from 'react';
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier';
import { useFrame, useThree } from '@react-three/fiber';
import { usePlayerStore } from '../../stores/playerStore';
import { useUiStore } from '../../stores/uiStore';
import { useTransformationStore } from '../../stores/transformationStore';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { objKey } from '../edit/sceneEditMerge';
import type { BaseTransform } from '../edit/sceneEditMerge';
import { EditableObject } from '../edit/EditableObject';
import { applyMovement } from './MovementStateMachine';
import { TransformationController } from './TransformationController';

// Stable module-level initial spawn — MUST NOT be an inline array on <RigidBody>, or a per-render
// new reference makes react-three-rapier reset the body to it every frame (pins the player at spawn).
const INITIAL_POS: [number, number, number] = [0, 2, 0];

// The player's Edit-Mode handle reuses the kit core exactly like every other object: an
// EditableObject keyed area#npc#poli. Selecting it gives the shared centred SceneEditorGizmo,
// the W/E/R mode shortcuts, and the top-right EditModeInspector — and writes the position into
// sceneEditStore (persisted). We mirror that override onto the physics body so the move applies
// in Play Mode and survives reload. Nothing about the player is hardcoded-only.
const playerKey = (areaId: string) => objKey(areaId, 'npc', 'poli');

export const Player = () => {
  const body = useRef<RapierRigidBody>(null);
  // Subscribe ONLY to values that change rarely — never to position (that would re-render every
  // frame and reset the RigidBody). Position is read via getState() inside useFrame.
  const editMode = useUiStore((s) => s.editMode);
  const currentAreaId = usePlayerStore((s) => s.currentAreaId);
  const spawnRequest = usePlayerStore((s) => s.spawnRequest);
  const requestTransform = useTransformationStore((s) => s.requestTransform);
  const keys = useRef<Record<string, boolean>>({});
  const headingRef = useRef(0);
  const { camera } = useThree();

  const pKey = playerKey(currentAreaId);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'KeyT' && !e.repeat) { requestTransform(); return; }
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [requestTransform]);

  // Teleport on spawn request (area travel). spawnRequest changes rarely → safe to subscribe.
  useEffect(() => {
    if (spawnRequest && body.current) {
      body.current.setTranslation(spawnRequest, true);
      body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      usePlayerStore.getState().clearSpawnRequest();
    }
  }, [spawnRequest]);

  // On mount / area change, honour a saved Edit-Mode position override for this area (persisted
  // in the kit sceneEditStore) so an edited player position applies in Play Mode and after reload.
  useEffect(() => {
    const ov = useSceneEditStore.getState().overrides[playerKey(currentAreaId)]?.position;
    if (ov && body.current) {
      body.current.setTranslation({ x: ov[0], y: ov[1], z: ov[2] }, true);
      body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, [currentAreaId]);

  useFrame(() => {
    const b = body.current;
    if (!b) return;
    const p = b.translation();
    usePlayerStore.getState().setPosition({ x: p.x, y: p.y, z: p.z });

    if (editMode) {
      b.setLinvel({ x: 0, y: 0, z: 0 }, true);
      // Mirror the gizmo/inspector edit onto the physics body so play mode uses it.
      const ov = useSceneEditStore.getState().overrides[pKey]?.position;
      if (ov && (ov[0] !== p.x || ov[1] !== p.y || ov[2] !== p.z)) {
        b.setTranslation({ x: ov[0], y: ov[1], z: ov[2] }, true);
      }
      return;
    }

    const tag = (document.activeElement?.tagName ?? '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    const { mode } = useTransformationStore.getState();
    applyMovement(b, keys.current, camera, mode, headingRef);
  });

  // Base for the Edit-Mode proxy = the player's current position (read non-reactively).
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
        <TransformationController headingRef={headingRef} />
      </RigidBody>

      {/* Edit-Mode selectable handle — full kit pipeline (gizmo + W/E/R + inspector + persist). */}
      {editMode && (
        <EditableObject objKey={pKey} base={base}>
          {/* invisible grab box over the capsule so the player is reliably clickable */}
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1.1, 2.2, 1.1]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </EditableObject>
      )}
    </>
  );
};
