import { useEffect, useRef } from 'react';
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier';
import { useFrame, useThree } from '@react-three/fiber';
import { usePlayerStore } from '../../stores/playerStore';
import { useUiStore } from '../../stores/uiStore';
import { useTransformationStore } from '../../stores/transformationStore';
import { applyMovement } from './MovementStateMachine';
import { TransformationController } from './TransformationController';

// Kit — generic capsule player: camera-relative WASD + Space jump, Rapier dynamic body. Writes its
// position to playerStore each frame (the camera follows it). Movement is suspended in Edit Mode.
// POLI seam: mesh replaced by TransformationController; movement delegated to MovementStateMachine.
export const Player = () => {
  const body = useRef<RapierRigidBody>(null);
  const editMode = useUiStore((s) => s.editMode);
  const setPosition = usePlayerStore((s) => s.setPosition);
  const spawnRequest = usePlayerStore((s) => s.spawnRequest);
  const clearSpawnRequest = usePlayerStore((s) => s.clearSpawnRequest);
  const requestTransform = useTransformationStore((s) => s.requestTransform);
  const keys = useRef<Record<string, boolean>>({});
  const headingRef = useRef(0);
  const { camera } = useThree();

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

  // Teleport on spawn request (area travel).
  useEffect(() => {
    if (spawnRequest && body.current) {
      body.current.setTranslation(spawnRequest, true);
      body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      clearSpawnRequest();
    }
  }, [spawnRequest, clearSpawnRequest]);

  useFrame((_, delta) => {
    const b = body.current;
    if (!b) return;
    const p = b.translation();
    setPosition({ x: p.x, y: p.y, z: p.z });
    if (editMode) { b.setLinvel({ x: 0, y: b.linvel().y, z: 0 }, true); return; }

    const tag = (document.activeElement?.tagName ?? '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    const { mode } = useTransformationStore.getState();
    applyMovement(b, keys.current, camera, mode, headingRef, delta);
  });

  return (
    <RigidBody ref={body} type="dynamic" colliders={false} lockRotations canSleep={false} position={[0, 2, 0]}>
      <CapsuleCollider args={[0.5, 0.5]} />
      <TransformationController headingRef={headingRef} />
    </RigidBody>
  );
};
