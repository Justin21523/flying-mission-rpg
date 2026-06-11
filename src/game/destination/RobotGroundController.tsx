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
import { nextFlying } from './flightToggle';
import { superForKey } from './superForKey';
import { useTransformStore } from '../../stores/transformStore';
import { dashImpulse } from '../combat/dashImpulse';
import type { SuperMove } from '../../types/character';
import type { CharacterDefinition, GroundAbilityConfig } from '../../types/game/character';

const nowSec = () => performance.now() / 1000;
const liveSurgeDirection: [number, number, number] = [0, 0, 1];
const FLY_V = 6; // vertical ascend/descend speed while flying (Space / Ctrl)
const JUMP_V = 7; // jump impulse (ground; up to 2 jumps)
const MAX_JUMPS = 2; // jump + double-jump

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
  // Flight + jump state (destination ground phases).
  const flying = useRef(false);
  const canFlyRef = useRef(!!character?.canFly);
  const supersRef = useRef<SuperMove[] | undefined>(character?.supers);
  const colorRef = useRef(character?.color ?? '#38bdf8');
  const jumpsUsed = useRef(0);
  const grounded = useRef(true);
  const lastPosY = useRef(spawnPos[1]);

  useEffect(() => {
    abilityRef.current = abilityConfig;
  }, [abilityConfig]);
  useEffect(() => { canFlyRef.current = !!character?.canFly; }, [character?.canFly]);
  useEffect(() => { supersRef.current = character?.supers; colorRef.current = character?.color ?? '#38bdf8'; }, [character?.supers, character?.color]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      keys.current[e.code] = true;
      if (e.repeat) return;
      // F — toggle flight (only if this character can fly). Gravity off while flying.
      if (e.code === 'KeyF' && canFlyRef.current) {
        flying.current = nextFlying(true, flying.current);
        bodyRef.current?.setGravityScale(flying.current ? 0 : 1, true);
        robotHandle.flying = flying.current;
        if (!flying.current) jumpsUsed.current = 0;
        return;
      }
      // Space — jump + double-jump on the ground (Space is ascend while flying, handled in useFrame).
      if (e.code === 'Space' && !flying.current) {
        const b = bodyRef.current;
        if (b) {
          if (grounded.current) jumpsUsed.current = 0;
          if (jumpsUsed.current < MAX_JUMPS) {
            const v = b.linvel();
            b.setLinvel({ x: v.x, y: JUMP_V, z: v.z }, true);
            jumpsUsed.current += 1;
            grounded.current = false;
          }
        }
        return;
      }
      // 1–6 — offensive super moves (per-character). Reuses transformStore.triggerSuperMove: per-move cooldown,
      // FX payload (SuperAbilityFx) + the decoupled damage bus (yokai sink wired in Batch 3). dash lunges below.
      if (/^Digit[1-6]$/.test(e.code)) {
        const move = superForKey(supersRef.current, e.code);
        if (move) {
          const p = robotHandle.pos;
          useTransformStore.getState().triggerSuperMove({ ...move, color: colorRef.current }, { x: p.x, y: p.y, z: p.z }, heading.current);
        }
        return;
      }
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
    // Dash-strike lunge (super kind 'dash') — drive the robot forward for its brief window.
    if (dashImpulse.active) {
      if (t < dashImpulse.until) {
        const v = b.linvel();
        b.setLinvel({ x: dashImpulse.dirX * dashImpulse.speed, y: v.y, z: dashImpulse.dirZ * dashImpulse.speed }, true);
        heading.current = Math.atan2(dashImpulse.dirX, dashImpulse.dirZ);
      } else {
        dashImpulse.active = false;
      }
    }
    // Vertical flight (Space = up, Shift = down, else hover) — horizontal speed already includes Shift fast-fly
    // from applyMovement. Grounded detection (resting, not at jump apex) resets the double-jump on the ground.
    if (flying.current) {
      const v = b.linvel();
      // Space = ascend; Shift ALONE = descend; Shift+WASD = fast flight (air sprint priority, no descend —
      // the horizontal sprint is already applied by applyMovement). Idle = hover.
      const movingKey = !!(keys.current['KeyW'] || keys.current['KeyA'] || keys.current['KeyS'] || keys.current['KeyD']);
      const vy = keys.current['Space'] ? FLY_V : (keys.current['ShiftLeft'] && !movingKey) ? -FLY_V : 0;
      b.setLinvel({ x: v.x, y: vy, z: v.z }, true);
      grounded.current = false;
    } else {
      const py = b.translation().y;
      if (Math.abs(py - lastPosY.current) < 0.02 && b.linvel().y <= 0.05) { grounded.current = true; jumpsUsed.current = 0; }
      lastPosY.current = py;
    }
    if (visualRef.current) visualRef.current.rotation.y = heading.current;
    const p = b.translation();
    robotHandle.pos.set(p.x, p.y, p.z);
    robotHandle.heading = heading.current;
    robotHandle.vSpeed = b.linvel().y;
    robotHandle.altitude = p.y;
    robotHandle.flying = flying.current;
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
