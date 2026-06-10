import { useEffect, useRef } from 'react';
import { RigidBody, CapsuleCollider, useRapier, type RapierRigidBody } from '@react-three/rapier';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useUiStore } from '../../stores/uiStore';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { useTransformStore } from '../../stores/transformStore';
import { getMergedPoliCharacter } from '../../stores/editorPoliCharacterStore';
import { CORE_TEAM } from '../../data/characters/coreTeam';
import { objKey } from '../edit/sceneEditMerge';
import type { BaseTransform } from '../edit/sceneEditMerge';
import { safeSpawnY, groundHeightAt } from '../world/groundHeight';
import { EditableObject } from '../edit/EditableObject';
import { applyMovement } from './MovementStateMachine';
import { PlayerMesh } from './PlayerMesh';
import { playerMotion } from './playerMotion';
import { playerKeysDown } from './playerInput';
import { useBoostStore } from '../../stores/boostStore';
import { dashImpulse } from '../combat/dashImpulse';
import { pathFollow, exitPathFollow } from '../combat/pathFollow';
import { getCurve, samplePos, sampleTangent, nearestU } from '../path/pathCurve';
import { getPath } from '../../stores/editorPathStore';
import { playerHit } from '../combat/playerHitBus';

// Merged (base ⊕ Edit-Mode override) data for the currently-active main character.
function activeMergedChar() {
  const id = useTransformStore.getState().charId;
  const base = CORE_TEAM.find((c) => c.id === id);
  return base ? getMergedPoliCharacter(base) : undefined;
}

// Stable module-level initial spawn — MUST NOT be an inline array on <RigidBody>, or a per-render
// new reference makes react-three-rapier reset the body to it every frame (pins the player at spawn).
const INITIAL_POS: [number, number, number] = [0, 2, 0];

// Reused scratch for PathFollow sampling — never allocate Vector3s inside useFrame.
const _pos = new Vector3();
const _tan = new Vector3();
const _tmp = new Vector3();

// Seconds the player mesh stays hidden after a transform, while the smoke is dense (then revealed).
const TRANSFORM_COVER = 0.35;

// Jump + step-climb tuning.
const JUMP_V = 8;          // upward velocity per jump (higher than before, per request)
const MAX_JUMPS = 2;       // double jump (ground jump + one air jump)
const STEP_MAX_HEIGHT = 1.5;  // obstacles up to this height are climbable; taller ones block
const STEP_PROBE_DIST = 0.8;  // how far ahead to probe for an obstacle
const STEP_CLIMB_V = 4.5;     // upward assist velocity applied while mounting a low obstacle
const GROUND_PROBE = 0.28;    // downward ray length for the grounded check

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
  const { world, rapier } = useRapier();
  // Jump/step state (refs → no re-render). jumpsLeft refills on landing; spacePrev gives a rising-edge press.
  const jumpsLeft = useRef(MAX_JUMPS);
  const spacePrev = useRef(false);
  const rayRef = useRef<InstanceType<typeof rapier.Ray> | null>(null);
  const stun = useRef({ until: 0, kx: 0, kz: 0 }); // yokai-hit knockback window
  // Spawn settle: after a spawn/area-change, hold the player up + raycast down each frame until the REAL ground
  // collider (heightfield / flat / placed platform) is found, then snap the feet onto it — so async/unknown
  // ground never lets the player fall through and sink under the terrain.
  const settle = useRef({ until: 0, x: 0, z: 0, baseY: 0 });
  const didInitSettle = useRef(false);

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
      // Super moves 1–6 — per-character offensive supers for the yokai hunt.
      if (/^Digit[1-6]$/.test(e.code) && !e.repeat) {
        if (!useUiStore.getState().editMode) {
          const idx = parseInt(e.code.slice(5), 10) - 1;
          const c = activeMergedChar();
          const move = c?.supers?.[idx];
          const pos = usePlayerStore.getState().position;
          // Super FX (and the clone/sentry it spawns) always use the CHARACTER's own colour — exactly matching.
          if (c && move && pos) useTransformStore.getState().triggerSuperMove({ ...move, color: c.color }, pos, headingRef.current);
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
      const sy = safeSpawnY(currentAreaId, ov.position[0], ov.position[2], ov.position[1]);
      b.setTranslation({ x: ov.position[0], y: sy, z: ov.position[2] }, true);
      b.setLinvel({ x: 0, y: 0, z: 0 }, true);
      settle.current = { until: performance.now() / 1000 + 0.8, x: ov.position[0], z: ov.position[2], baseY: sy };
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
    // Settle the player onto the real ground over the next moment (colliders may build async).
    settle.current = { until: performance.now() / 1000 + 0.8, x: spawnRequest.x, z: spawnRequest.z, baseY: y };
    // Keep the player's heading UNCHANGED on arrival — they face exactly the way they did before travelling.
    usePlayerStore.getState().clearSpawnRequest();
  }, [spawnRequest]);

  useFrame((_, dt) => {
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

    // First-frame settle for the fresh game start (no spawnRequest / no override fired) — settle onto the
    // ground at the player's current spot so the initial HQ spawn never starts under the terrain.
    if (!didInitSettle.current) {
      didInitSettle.current = true;
      if (settle.current.until <= 0) {
        const areaNow = usePlayerStore.getState().currentAreaId;
        settle.current = { until: performance.now() / 1000 + 0.8, x: p.x, z: p.z, baseY: safeSpawnY(areaNow, p.x, p.z, p.y) };
      }
    }

    // ── Spawn settle: raycast down to the real ground and snap the feet onto it; hold up while the collider
    // is still building. Pre-empts normal movement for the brief window so the player can't fall through. ──
    if (settle.current.until > performance.now() / 1000) {
      let sray = rayRef.current;
      if (!sray) { sray = new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }); rayRef.current = sray; }
      const sx = settle.current.x, sz = settle.current.z;
      const areaNow = usePlayerStore.getState().currentAreaId;
      const estimate = groundHeightAt(areaNow, sx, sz) + 0.05;
      sray.origin.x = sx; sray.origin.y = p.y + 40; sray.origin.z = sz;
      sray.dir.x = 0; sray.dir.y = -1; sray.dir.z = 0;
      const hit = world.castRay(sray, 80, true, undefined, undefined, undefined, b);
      if (hit) {
        const hy = (p.y + 40) - hit.timeOfImpact;
        if (hy + 0.05 >= estimate - 0.2) { // reached the real ground (not the low ZoneFloor under terrain)
          b.setTranslation({ x: sx, y: Math.max(hy + 0.02, estimate), z: sz }, true);
          b.setLinvel({ x: 0, y: 0, z: 0 }, true);
          settle.current.until = 0; // done — release to normal physics
        } else { // collider not ready → hold at the heightfield estimate so we don't drop onto the base floor
          b.setTranslation({ x: sx, y: estimate, z: sz }, true);
          b.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
      } else { // no ground found yet → hold up
        b.setTranslation({ x: sx, y: Math.max(p.y, estimate), z: sz }, true);
        b.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
      playerMotion.heading = headingRef.current;
      playerMotion.moving = false;
      return; // skip movement/jump/etc. during the settle frame
    }

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

    // Dash-strike lunge — a 'dash' super drives the body forward for a brief window (overrides normal speed).
    if (!flying && dashImpulse.active) {
      if (performance.now() / 1000 < dashImpulse.until) {
        const lv = b.linvel();
        b.setLinvel({ x: dashImpulse.dirX * dashImpulse.speed, y: lv.y, z: dashImpulse.dirZ * dashImpulse.speed }, true);
        headingRef.current = Math.atan2(dashImpulse.dirX, dashImpulse.dirZ);
      } else { dashImpulse.active = false; }
    }

    // ── PathFollow — a BoostPad (or rule) put the player on a curve-based track. Drive/guide the body along
    // the cached CatmullRom curve per the control mode; fullyAutomatic/forwardLocked fully drive it (and skip
    // the jump/step/knockback below), the assist modes only nudge and let normal control continue. ──
    if (pathFollow.active && !flying) {
      const def = getPath(pathFollow.pathId);
      const cc = def ? getCurve(def) : null;
      if (!def || !cc) {
        exitPathFollow();
      } else {
        const curve = cc.curve;
        const mode = pathFollow.mode;
        if (mode === 'fullyAutomatic' || mode === 'forwardLocked') {
          let spd = pathFollow.speed;
          if (mode === 'forwardLocked') {
            const f = (keys.current['KeyW'] ? 1 : 0) - (keys.current['KeyS'] ? 1 : 0);
            spd = pathFollow.speed * (f === 0 ? 1 : f); // S reverses, W full speed, idle = drift forward
          }
          pathFollow.u += (pathFollow.dir * spd * dt) / Math.max(0.001, cc.length);
          const done = !def.closed && (pathFollow.u >= 1 || pathFollow.u <= 0);
          const uu = pathFollow.u < 0 ? 0 : pathFollow.u > 1 ? 1 : pathFollow.u;
          samplePos(curve, uu, _pos);
          sampleTangent(curve, uu, _tan);
          b.setTranslation({ x: _pos.x, y: _pos.y, z: _pos.z }, true);
          b.setLinvel({ x: 0, y: 0, z: 0 }, true);
          headingRef.current = Math.atan2(_tan.x * pathFollow.dir, _tan.z * pathFollow.dir);
          if (done) {
            if (pathFollow.exit === 'continueMomentum') {
              b.setLinvel({ x: _tan.x * pathFollow.dir * pathFollow.speed, y: 0, z: _tan.z * pathFollow.dir * pathFollow.speed }, true);
            } else {
              b.setLinvel({ x: 0, y: 0, z: 0 }, true); // releaseControl / stopAtEnd
            }
            exitPathFollow();
          }
          // Fully driven this frame — publish motion and skip jump/step/knockback (control returns next frame).
          playerMotion.heading = headingRef.current;
          playerMotion.moving = false;
          return;
        }
        if (mode === 'steeringAssist') {
          // Gently pull the player toward the curve when they stray past the lane half-width.
          pathFollow.u = nearestU(curve, _tmp.set(p.x, p.y, p.z), _tan);
          samplePos(curve, pathFollow.u, _pos);
          const dx = _pos.x - p.x, dz = _pos.z - p.z;
          const dist = Math.hypot(dx, dz) || 1;
          if (dist > (def.laneWidth || 2)) {
            const lv = b.linvel();
            const pull = 4;
            b.setLinvel({ x: lv.x + (dx / dist) * pull, y: lv.y, z: lv.z + (dz / dist) * pull }, true);
          }
        } else if (mode === 'speedAssist') {
          // Keep steering, add a forward nudge along the tangent so the player keeps progressing.
          pathFollow.u = nearestU(curve, _tmp.set(p.x, p.y, p.z), _pos);
          sampleTangent(curve, pathFollow.u, _tan);
          const lv = b.linvel();
          const push = pathFollow.speed * dt * 4;
          b.setLinvel({ x: lv.x + _tan.x * pathFollow.dir * push, y: lv.y, z: lv.z + _tan.z * pathFollow.dir * push }, true);
        }
      }
    }

    // ── Double jump + auto step-climb (skipped while flying — Space/Shift drive altitude there). ──
    if (!flying) {
      let ray = rayRef.current;
      if (!ray) { ray = new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }); rayRef.current = ray; }
      const lv = b.linvel();

      // Grounded? a short downward probe from just above the feet (excluding our own body). Refill jumps on land.
      ray.origin.x = p.x; ray.origin.y = p.y + 0.1; ray.origin.z = p.z;
      ray.dir.x = 0; ray.dir.y = -1; ray.dir.z = 0;
      const grounded = !!world.castRay(ray, GROUND_PROBE, true, undefined, undefined, undefined, b) && Math.abs(lv.y) < 2;
      if (grounded) jumpsLeft.current = MAX_JUMPS;

      // Jump on Space rising-edge while a jump remains → double jump (one on the ground + one in the air).
      const space = !!keys.current['Space'];
      if (space && !spacePrev.current && jumpsLeft.current > 0) {
        b.setLinvel({ x: lv.x, y: JUMP_V, z: lv.z }, true);
        jumpsLeft.current -= 1;
      }
      spacePrev.current = space;

      // Auto step-climb: when walking into an obstacle, probe low (at the feet) and high (at the max step
      // height) along the movement direction. Low blocked + high clear ⇒ a short ledge → give an upward assist
      // to ride over it. Both blocked ⇒ too tall → stay blocked (no climb), exactly as requested.
      const k2 = keys.current;
      if (k2['KeyW'] || k2['KeyS'] || k2['KeyA'] || k2['KeyD']) {
        const dx = Math.sin(headingRef.current), dz = Math.cos(headingRef.current);
        ray.origin.x = p.x; ray.origin.y = p.y + 0.3; ray.origin.z = p.z;
        ray.dir.x = dx; ray.dir.y = 0; ray.dir.z = dz;
        if (world.castRay(ray, STEP_PROBE_DIST, true, undefined, undefined, undefined, b)) {
          ray.origin.y = p.y + STEP_MAX_HEIGHT;
          if (!world.castRay(ray, STEP_PROBE_DIST, true, undefined, undefined, undefined, b)) {
            const nv = b.linvel();
            if (nv.y < STEP_CLIMB_V) b.setLinvel({ x: nv.x, y: STEP_CLIMB_V, z: nv.z }, true);
          }
        }
      }
    }

    // Yokai hit → brief knockback (light, recoverable). Applied AFTER movement so it overrides input for the
    // short window, then control returns. No damage beyond the shove (+ the timer nibble done by the yokai).
    if (playerHit.pending) {
      playerHit.pending = false;
      stun.current.until = performance.now() / 1000 + 0.35;
      stun.current.kx = playerHit.dirX * playerHit.strength;
      stun.current.kz = playerHit.dirZ * playerHit.strength;
    }
    if (!flying) {
      const tnow = performance.now() / 1000;
      if (tnow < stun.current.until) {
        const k = (stun.current.until - tnow) / 0.35;
        const lv = b.linvel();
        b.setLinvel({ x: stun.current.kx * k, y: lv.y, z: stun.current.kz * k }, true);
      }
    }

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
      <RigidBody ref={body} type="dynamic" colliders={false} lockRotations canSleep={false} position={INITIAL_POS} userData={{ isPlayer: true }}>
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
