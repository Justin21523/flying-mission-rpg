import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import type { Group } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useBaseRuntimeStore } from '../../stores/game/baseRuntimeStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { getBaseParts } from '../../stores/game/editorBaseLayoutStore';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { applyMovement } from '../player/MovementStateMachine';
import { BASE_SPAWN } from '../../data/game/baseLayout';
import { vehicleHandle } from './vehicleHandle';
import { basePartKey } from './basePartKey';

// Ground vehicle for the base. Reuses the kit's camera-relative movement (applyMovement, same as the
// player): W goes into the screen, A/D strafe, turning the camera turns the controls — momentum/coast in
// 'vehicle' form. Body rotations are locked (it can't tip); the visual rotates to the travel heading.
// Publishes its position to playerStore so the reused FollowCamera follows it. When locked (lift), the
// body becomes kinematic and LiftPlatform drives it. Play mode only (Edit Mode suspends it).
export const BaseVehicle = () => {
  const bodyRef = useRef<RapierRigidBody>(null);
  const visualRef = useRef<Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const heading = useRef(0);
  const { camera } = useThree();
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const locked = useBaseRuntimeStore((s) => s.locked);
  // Spawn at the editable 'spawn' part's (gizmo-draggable) position — not a hardcoded point.
  const spawnPos = useMemo<[number, number, number]>(() => {
    const sp = getBaseParts().find((p) => p.kind === 'spawn');
    if (!sp) return BASE_SPAWN;
    const ov = useSceneEditStore.getState().overrides[basePartKey(sp.id)]?.position as [number, number, number] | undefined;
    return ov ?? sp.position;
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      keys.current = {};
    };
  }, []);

  // Register the body so LiftPlatform can ride it during the lift sequence.
  useEffect(() => {
    vehicleHandle.body = bodyRef.current;
    return () => {
      vehicleHandle.body = null;
    };
  }, []);

  useFrame(() => {
    const b = bodyRef.current;
    if (!b) return;
    if (!locked) {
      // Camera-relative drive (reused from the player movement state machine).
      applyMovement(b, keys.current, camera, heading, false, 'vehicle');
    }
    if (visualRef.current) visualRef.current.rotation.y = heading.current;
    const p = b.translation();
    usePlayerStore.getState().setPosition({ x: p.x, y: p.y, z: p.z });
  });

  const fallback = (
    <mesh castShadow>
      <boxGeometry args={[1, 0.6, 1.6]} />
      <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
    </mesh>
  );

  return (
    <RigidBody
      ref={bodyRef}
      type={locked ? 'kinematicPosition' : 'dynamic'}
      colliders={false}
      position={spawnPos}
      lockRotations
      canSleep={false}
      linearDamping={0.4}
      ccd
    >
      <CuboidCollider args={[0.6, 0.5, 0.9]} />
      {/* Visual rotates to the travel heading; sits on the collider. */}
      <group ref={visualRef} position={[0, -0.5, 0]}>
        {character?.modelAssetId ? <AnimatedGlbModel assetId={character.modelAssetId} fallback={fallback} /> : fallback}
      </group>
    </RigidBody>
  );
};
