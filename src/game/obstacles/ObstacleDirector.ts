import { liveObstacles, useObstacleStore, getLiveObstacle, type LiveObstacle } from '../../stores/game/obstacleStore';
import { useCombatTargetStore, liveTargets } from '../../stores/game/combatTargetStore';
import { getObstacleDef, getObstaclesForSegment } from '../../stores/game/editorObstacleStore';
import { registerRuntimeDamageable } from '../combat/enemyRuntime';
import { damageTargetsInRadius } from '../combat/CombatDirector';
import { queueSpawnImpact } from '../../stores/game/combatSpawnStore';
import type { ObstacleDefinition, ObstacleState, ObstacleTrigger } from '../../types/game/obstacle';
import { CLEARED_OBSTACLE_STATES } from '../../types/game/obstacle';
import { resolveInteraction, canTransition, type ObstacleProgress } from './ObstacleInteractionController';

// Bridges obstacles to the combat target registry + zone progress (Batch C). Damageable obstacles register a
// proxy CombatTarget so player skills hit them through the shared DamageResolver; update() syncs proxy hp →
// obstacle and drives state transitions. interact/repair/debug go through the pure interaction controller.
// Obstacles never write the zone store directly — the zone probe reads these state accessors.

let uid = 0;

function loadOne(def: ObstacleDefinition): void {
  if (liveObstacles.some((o) => o.id === def.id)) return;
  const maxHp = def.damageable?.maxHp ?? 1;
  const maxShield = def.damageable?.maxShield ?? def.damageable?.shieldRules?.shieldHp ?? 0;
  const obs: LiveObstacle = {
    id: def.id, defId: def.id, state: def.stateMachine.initialState,
    hp: maxHp, maxHp, shield: maxShield, maxShield, interactCount: 0, repairAmount: 0,
    x: def.transform.position[0], y: def.transform.position[1], z: def.transform.position[2],
    segmentId: def.segmentId,
  };
  if (def.damageable) {
    registerRuntimeDamageable(def.damageable);
    const targetId = `obs_${uid++}`;
    obs.targetId = targetId;
    useCombatTargetStore.getState().spawn({
      id: targetId, definitionId: def.damageable.id,
      hp: maxHp, maxHp, shield: maxShield, maxShield,
      x: obs.x, y: obs.y, z: obs.z, defeatedAt: 0,
      isObstacle: true, obstacleId: def.id, color: def.visualStates.active?.color,
    });
  }
  liveObstacles.push(obs);
  useObstacleStore.getState().bump();
}

export function loadForSegment(segmentId: string): void {
  for (const def of getObstaclesForSegment(segmentId)) loadOne(def);
}

function progress(o: LiveObstacle): ObstacleProgress {
  return { state: o.state, hp: o.hp, maxHp: o.maxHp, shield: o.shield, interactCount: o.interactCount, repairAmount: o.repairAmount };
}

function applyTrigger(o: LiveObstacle, def: ObstacleDefinition, trigger: ObstacleTrigger, tags: string[] = []): boolean {
  const rule = resolveInteraction(def, progress(o), trigger, { tags });
  if (!rule) return false;
  o.state = rule.resultState;
  useObstacleStore.getState().bump();
  return true;
}

// Per-frame: sync each damageable obstacle's proxy hp/shield → obstacle + transition when depleted.
export function update(): void {
  let changed = false;
  for (const o of liveObstacles) {
    if (!o.targetId) continue;
    const proxy = liveTargets.find((t) => t.id === o.targetId);
    if (!proxy) continue;
    o.hp = proxy.hp; o.shield = proxy.shield;
    const def = getObstacleDef(o.defId);
    if (!def) continue;
    const depleted = proxy.hp <= 0 && proxy.shield <= 0;
    const terminal = CLEARED_OBSTACLE_STATES.includes(o.state) || o.state === 'destroyed';
    if (depleted && !terminal) {
      if (!applyTrigger(o, def, 'damage', def.damageable?.weaknessTags ?? [])) {
        o.state = def.obstacleType === 'cracked-wall' ? 'destroyed' : 'cleared';
        changed = true;
        // Batch O — explosive obstacle: damage nearby enemies on destruction (+ an impact poof).
        if (def.explodeOnDestroy) {
          damageTargetsInRadius(proxy.x, proxy.z, def.explodeOnDestroy.radius, { amount: def.explodeOnDestroy.damage, damageType: 'impact', attackTags: ['explosion', 'aoe'] });
          queueSpawnImpact(proxy.x, proxy.y, proxy.z);
        }
      }
    } else if (!terminal && o.state === 'active' && (proxy.hp < o.maxHp || proxy.shield < o.maxShield)) {
      applyTrigger(o, def, 'damage', def.damageable?.weaknessTags ?? []);
    }
  }
  if (changed) useObstacleStore.getState().bump();
}

export function interact(obstacleId: string): boolean {
  const o = getLiveObstacle(obstacleId); const def = getObstacleDef(obstacleId);
  if (!o || !def) return false;
  o.interactCount += 1;
  return applyTrigger(o, def, 'interact');
}

export function repair(obstacleId: string, amount: number): boolean {
  const o = getLiveObstacle(obstacleId); const def = getObstacleDef(obstacleId);
  if (!o || !def) return false;
  o.repairAmount += amount;
  return applyTrigger(o, def, 'repair');
}

export function debugClear(obstacleId: string): void {
  const o = getLiveObstacle(obstacleId); const def = getObstacleDef(obstacleId);
  if (!o || !def) return;
  if (!applyTrigger(o, def, 'debug-clear')) {
    o.state = def.obstacleType === 'cracked-wall' ? 'destroyed' : def.obstacleType === 'corrupted-device' ? 'repaired' : 'cleared';
    useObstacleStore.getState().bump();
  }
}

export function transitionState(obstacleId: string, next: ObstacleState, force = false): boolean {
  const o = getLiveObstacle(obstacleId); const def = getObstacleDef(obstacleId);
  if (!o || !def) return false;
  if (!force && !canTransition(def, o.state, next, 'any')) return false;
  o.state = next; useObstacleStore.getState().bump();
  return true;
}

export const isDestroyed = (id: string): boolean => getLiveObstacle(id)?.state === 'destroyed';
export const isRepaired = (id: string): boolean => getLiveObstacle(id)?.state === 'repaired';
export const isCleared = (id: string): boolean => { const s = getLiveObstacle(id)?.state; return !!s && CLEARED_OBSTACLE_STATES.includes(s); };

export function destroyedObstacleIds(): Set<string> { return new Set(liveObstacles.filter((o) => o.state === 'destroyed').map((o) => o.id)); }
export function repairedObstacleIds(): Set<string> { return new Set(liveObstacles.filter((o) => o.state === 'repaired').map((o) => o.id)); }
export function clearedObstacleIds(): Set<string> { return new Set(liveObstacles.filter((o) => CLEARED_OBSTACLE_STATES.includes(o.state)).map((o) => o.id)); }

export function cleanup(): void {
  for (const o of liveObstacles) if (o.targetId) { const i = liveTargets.findIndex((t) => t.id === o.targetId); if (i >= 0) liveTargets.splice(i, 1); }
  useObstacleStore.getState().reset();
}
