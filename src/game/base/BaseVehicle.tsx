import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import { Quaternion, Euler } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useBaseRuntimeStore } from '../../stores/game/baseRuntimeStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { BASE_SPAWN } from '../../data/game/baseLayout';
import { vehicleHandle } from './vehicleHandle';

// Ground vehicle for the base: a Rapier dynamic body with car-style control (forward/back + steer,
// smooth accel/brake). Rotations locked to yaw only; an explicit cuboid collider gives stable, robust
// collision (walls/gate) and CCD prevents wall clip-through. Each frame it publishes its position to
// playerStore so the reused FollowCamera follows it. Mounted only in play mode (Edit Mode suspends it).
const pressed = new Set<string>();
const _q = new Quaternion();
const _euler = new Euler();
const _lin = { x: 0, y: 0, z: 0 };
const _rot = { x: 0, y: 0, z: 0, w: 1 };
const _zero = { x: 0, y: 0, z: 0 };

const MAX_SPEED = 9; // units/sec
const ACCEL = 16;
const TURN = 2.3; // rad/sec at full responsiveness

export const BaseVehicle = () => {
  const bodyRef = useRef<RapierRigidBody>(null);
  const speedRef = useRef(0);
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const character = charId ? getEditorCharacter(charId) : undefined;
  // When locked (lift sequence), the body becomes kinematic so LiftPlatform can sink it cleanly through
  // the open shaft (typed prop — no imperative setBodyType enum juggling).
  const locked = useBaseRuntimeStore((s) => s.locked);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      pressed.add(e.code);
    };
    const up = (e: KeyboardEvent) => pressed.delete(e.code);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      pressed.clear();
    };
  }, []);

  // Register the body so LiftPlatform can ride it during the lift sequence.
  useEffect(() => {
    vehicleHandle.body = bodyRef.current;
    return () => {
      vehicleHandle.body = null;
    };
  }, []);

  useFrame((_, dtRaw) => {
    const body = bodyRef.current;
    if (!body) return;
    const dt = Math.min(dtRaw, 0.05); // clamp big frame gaps
    const locked = useBaseRuntimeStore.getState().locked;

    const rot = body.rotation();
    _q.set(rot.x, rot.y, rot.z, rot.w);
    _euler.setFromQuaternion(_q, 'YXZ');
    let yaw = _euler.y;
    const vy = body.linvel().y;

    if (locked) {
      // LiftPlatform owns the body (kinematic) during the lift — don't write velocities here.
      speedRef.current = 0;
    } else {
      const throttle = (pressed.has('KeyW') || pressed.has('ArrowUp') ? 1 : 0) - (pressed.has('KeyS') || pressed.has('ArrowDown') ? 1 : 0);
      const steer = (pressed.has('KeyA') || pressed.has('ArrowLeft') ? 1 : 0) - (pressed.has('KeyD') || pressed.has('ArrowRight') ? 1 : 0);

      // Smooth turn — more responsive the faster you go (but always a little so you can point in place).
      const responsiveness = 0.4 + Math.min(1, Math.abs(speedRef.current) / MAX_SPEED) * 0.6;
      yaw += steer * TURN * dt * responsiveness;
      _rot.x = 0; _rot.y = Math.sin(yaw / 2); _rot.z = 0; _rot.w = Math.cos(yaw / 2);
      body.setRotation(_rot, true);
      body.setAngvel(_zero, true);

      // Smooth accelerate / brake toward target speed.
      const target = throttle * MAX_SPEED;
      speedRef.current += (target - speedRef.current) * Math.min(1, (ACCEL * dt) / MAX_SPEED);
      if (Math.abs(speedRef.current) < 0.02) speedRef.current = 0;
      _lin.x = Math.sin(yaw) * speedRef.current;
      _lin.y = vy;
      _lin.z = Math.cos(yaw) * speedRef.current;
      body.setLinvel(_lin, true);
    }

    const p = body.translation();
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
      position={BASE_SPAWN}
      enabledRotations={[false, true, false]}
      linearDamping={0.6}
      angularDamping={4}
      ccd
    >
      <CuboidCollider args={[0.6, 0.5, 0.9]} />
      {/* Visual: the selected character's posed model (sits on the collider); fallback box. */}
      <group position={[0, -0.5, 0]}>
        {character?.modelAssetId ? <AnimatedGlbModel assetId={character.modelAssetId} fallback={fallback} /> : fallback}
      </group>
    </RigidBody>
  );
};
