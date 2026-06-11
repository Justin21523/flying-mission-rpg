import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import type { Group } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter, useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { useGroundAbilityStore } from '../../stores/game/groundAbilityStore';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { applyMovement } from '../player/MovementStateMachine';
import { playerMotion } from '../player/playerMotion';
import { robotHandle } from './robotHandle';
import { groundCharacterScale } from './groundCharacterScale';
import { characterModelForForm } from './characterModel';
import type { AnimState } from '../anim/animRunner';
import { getGroundAbilityConfig } from './groundAbilityConfig';
import type { CharacterDefinition, GroundAbilityConfig } from '../../types/game/character';

const nowSec = () => performance.now() / 1000;
const liveSurgeDirection: [number, number, number] = [0, 0, 1];

const EnergizedRobotModel = ({
  character,
  config,
  fallback,
}: {
  character: CharacterDefinition;
  config: GroundAbilityConfig;
  fallback: ReactNode;
}) => {
  const energizedUntil = useGroundAbilityStore((s) => s.energizedUntil);
  const [clip, setClip] = useState<string | undefined>(character.idleAnimation);
  const clipList = config.cloudRally.energizedAnimationClips;
  const active = energizedUntil > nowSec() && clipList.length > 0;
  // Live anim state for character rules (robot form): moving from position delta, ability from energized.
  const animState = useRef<AnimState>({ moving: false, form: 'robot', speed: 0, ability: false });
  const lastP = useRef({ x: 0, z: 0, t: 0 });
  const getAnimState = useCallback((): AnimState => {
    const now = performance.now();
    const dt = Math.max(0.001, (now - lastP.current.t) / 1000);
    const sp = Math.hypot(robotHandle.pos.x - lastP.current.x, robotHandle.pos.z - lastP.current.z) / dt;
    lastP.current.x = robotHandle.pos.x; lastP.current.z = robotHandle.pos.z; lastP.current.t = now;
    animState.current.speed = sp;
    animState.current.moving = sp > 0.3;
    animState.current.ability = useGroundAbilityStore.getState().energizedUntil > now / 1000;
    return animState.current;
  }, []);

  useEffect(() => {
    const remaining = energizedUntil - nowSec();
    if (remaining <= 0 || clipList.length === 0) return;
    const choose = () => {
      const next = clipList[Math.floor(Math.random() * clipList.length)];
      setClip(next || character.idleAnimation);
    };
    const intervalMs = Math.max(120, config.cloudRally.randomAnimationIntervalSec * 1000);
    const firstId = window.setTimeout(choose, 0);
    const intervalId = window.setInterval(choose, intervalMs);
    const timeoutId = window.setTimeout(() => setClip(undefined), remaining * 1000);
    return () => {
      window.clearTimeout(firstId);
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [character.idleAnimation, clipList, config.cloudRally.randomAnimationIntervalSec, energizedUntil]);

  return <AnimatedGlbModel assetId={characterModelForForm(character, 'robot')!} animation={active ? clip : character.idleAnimation} rules={character.animationRules} getAnimState={getAnimState} fallback={fallback} noCull />;
};

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
  useEditorCharacterStore((s) => s.items);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const abilityConfig = useMemo(() => getGroundAbilityConfig(character), [character]);
  const abilityRef = useRef(abilityConfig);
  const spawnPos = useMemo<[number, number, number]>(() => [robotHandle.pos.x, Math.max(1, robotHandle.pos.y + 0.4), robotHandle.pos.z], []);

  useEffect(() => {
    abilityRef.current = abilityConfig;
  }, [abilityConfig]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      keys.current[e.code] = true;
      if (e.repeat) return;
      const cfg = abilityRef.current;
      const t = nowSec();
      if (e.code === cfg.cloudRally.keyCode) {
        useGroundAbilityStore.getState().triggerCloud(cfg.cloudRally, t);
        return;
      }
      if (e.code === cfg.rescueSurge.keyCode) {
        const dirX = Math.sin(heading.current);
        const dirZ = Math.cos(heading.current);
        useGroundAbilityStore.getState().triggerSurge(cfg.rescueSurge, [dirX, 0, dirZ], t);
        return;
      }
      const extra = cfg.extraSlots.find((slot) => slot.keyCode === e.code);
      if (extra && useGroundAbilityStore.getState().triggerExtra(extra, t) && extra.kind === 'hover_pop') {
        const body = bodyRef.current;
        if (body) {
          const vel = body.linvel();
          body.setLinvel({ x: vel.x, y: 7 * Math.max(0.25, extra.strength), z: vel.z }, true);
        }
      }
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      keys.current = {};
      playerMotion.speedMult = 1;
      useGroundAbilityStore.getState().reset();
    };
  }, []);

  useFrame(() => {
    const b = bodyRef.current;
    if (!b) return;
    const t = nowSec();
    const ability = useGroundAbilityStore.getState();
    playerMotion.speedMult = ability.energizedUntil > t ? abilityRef.current.cloudRally.energizedSpeedMultiplier : 1;
    applyMovement(b, keys.current, camera, heading, false, 'robot');
    if (ability.surgeUntil > t) {
      const vel = b.linvel();
      if (!ability.surgeConfig.lockDirection) {
        liveSurgeDirection[0] = Math.sin(heading.current);
        liveSurgeDirection[2] = Math.cos(heading.current);
      }
      const dir = ability.surgeConfig.lockDirection ? ability.surgeDirection : liveSurgeDirection;
      b.setLinvel({ x: dir[0] * ability.surgeConfig.speed, y: vel.y, z: dir[2] * ability.surgeConfig.speed }, true);
      heading.current = Math.atan2(dir[0], dir[2]);
      playerMotion.speed = ability.surgeConfig.speed;
    }
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
      <group ref={visualRef} position={[0, -0.8, 0]} scale={groundCharacterScale(character)}>
        {character?.modelAssetId ? <EnergizedRobotModel character={character} config={abilityConfig} fallback={fallback} /> : fallback}
      </group>
    </RigidBody>
  );
};
