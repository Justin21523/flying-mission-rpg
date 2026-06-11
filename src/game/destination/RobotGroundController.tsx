import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import type { Group } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { applyMovement } from '../player/MovementStateMachine';
import { robotHandle } from './robotHandle';

// Ground robot for the destination (NPC_GREETING / MISSION_GAMEPLAY) — the BaseVehicle pattern in 'robot'
// form: camera-relative movement (applyMovement), locked rotations, building colliders block it, publishes
// playerStore so the third-person FollowCamera follows. Spawns where the landing settled (robotHandle.pos).
export const RobotGroundController = () => {
  const bodyRef = useRef<RapierRigidBody>(null);
  const visualRef = useRef<Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const heading = useRef(0);
  const { camera } = useThree();
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const spawnPos = useMemo<[number, number, number]>(() => [robotHandle.pos.x, Math.max(1, robotHandle.pos.y + 0.4), robotHandle.pos.z], []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      keys.current = {};
    };
  }, []);

  useFrame(() => {
    const b = bodyRef.current;
    if (!b) return;
    applyMovement(b, keys.current, camera, heading, false, 'robot');
    if (visualRef.current) visualRef.current.rotation.y = heading.current;
    const p = b.translation();
    robotHandle.pos.set(p.x, p.y, p.z);
    robotHandle.heading = heading.current;
    robotHandle.vSpeed = 0;
    robotHandle.altitude = p.y;
    usePlayerStore.getState().setPosition({ x: p.x, y: p.y, z: p.z });
  });

  const fallback = (
    <mesh castShadow>
      <boxGeometry args={[0.8, 1.2, 0.6]} />
      <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
    </mesh>
  );

  return (
    <RigidBody ref={bodyRef} type="dynamic" colliders={false} position={spawnPos} lockRotations canSleep={false} linearDamping={0.4} ccd>
      <CuboidCollider args={[0.5, 0.8, 0.5]} />
      <group ref={visualRef} position={[0, -0.8, 0]} scale={1.4}>
        {character?.modelAssetId ? <AnimatedGlbModel assetId={character.modelAssetId} fallback={fallback} noCull /> : fallback}
      </group>
    </RigidBody>
  );
};
