import type { BossWeakpointDefinition } from '../../types/game/boss';
import { liveTargets, useCombatTargetStore, type CombatTarget } from '../../stores/game/combatTargetStore';
import { useCombatStore } from '../../stores/game/useCombatStore';
import { registerRuntimeDamageable } from '../combat/enemyRuntime';
import { makeUtilityFeedback } from '../combat/CombatFeedbackClassifier';
import { triggerGameFeelFromFeedback } from '../feel/GameFeelDirector';

// Boss weakpoints (Batch F). Each weakpoint is a hittable CombatTarget (registered damageable + spawn, the
// ObstacleDirector pattern) so player/support skills resolve damage through the shared DamageResolver. While
// HIDDEN its hp is pinned (invulnerable); exposed by scan / support-scan / shield-break for a window; when
// destroyed it returns an effect the director applies to the boss.

export type WeakpointVisualState = 'hidden' | 'exposed' | 'destroyed';

interface WeakpointRuntime {
  def: BossWeakpointDefinition;
  targetId: string;
  exposedUntil: number; // seconds; Infinity = permanent
  destroyed: boolean;
}

const live = new Map<string, WeakpointRuntime>();
let uid = 0;
const nowS = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

export interface WeakpointDestroyedEvent {
  weakpointId: string;
  effect: BossWeakpointDefinition['effectOnDestroyed'];
}

export function spawnWeakpoint(def: BossWeakpointDefinition, bossPos: { x: number; y: number; z: number }): void {
  if (live.has(def.id)) return;
  registerRuntimeDamageable(def.damageable);
  const targetId = `bwp_${uid++}`;
  const maxHp = def.damageable.maxHp;
  const maxShield = def.damageable.maxShield ?? 0;
  useCombatTargetStore.getState().spawn({
    id: targetId,
    definitionId: def.damageable.id,
    hp: maxHp, maxHp, shield: maxShield, maxShield,
    x: bossPos.x + def.fallbackPosition[0], y: bossPos.y + def.fallbackPosition[1], z: bossPos.z + def.fallbackPosition[2],
    defeatedAt: 0,
    isBossWeakpoint: true, bossWeakpointId: def.id,
    color: def.visual.color,
  });
  live.set(def.id, { def, targetId, exposedUntil: def.exposedRules.initiallyExposed ? Number.POSITIVE_INFINITY : 0, destroyed: false });
}

function target(id: string): CombatTarget | undefined {
  const rt = live.get(id);
  return rt ? liveTargets.find((t) => t.id === rt.targetId) : undefined;
}

export function isExposed(weakpointId: string, now = nowS()): boolean {
  const rt = live.get(weakpointId);
  return !!rt && !rt.destroyed && rt.exposedUntil > now;
}

export function visualState(weakpointId: string): WeakpointVisualState {
  const rt = live.get(weakpointId);
  if (!rt || rt.destroyed) return rt?.destroyed ? 'destroyed' : 'hidden';
  return rt.exposedUntil > nowS() ? 'exposed' : 'hidden';
}

export function exposeWeakpoint(weakpointId: string, durationSeconds?: number, now = nowS()): void {
  const rt = live.get(weakpointId);
  if (!rt || rt.destroyed) return;
  rt.exposedUntil = now + (durationSeconds ?? rt.def.exposedRules.exposeDurationSeconds ?? 8);
  const event = makeUtilityFeedback('boss-weakpoint-exposed', rt.targetId, weakpointId);
  useCombatStore.getState().pushFeedbackEvent(event);
  triggerGameFeelFromFeedback(event);
}

export function destroyWeakpoint(weakpointId: string): void {
  const t = target(weakpointId);
  if (t) { t.hp = 0; t.defeatedAt = nowS(); }
}

// Per-frame: handle expose triggers, pin hidden weakpoints, detect destroyed ones. Returns newly-destroyed.
export function update(bossShieldBroken: boolean, now = nowS()): WeakpointDestroyedEvent[] {
  const events: WeakpointDestroyedEvent[] = [];
  for (const rt of live.values()) {
    if (rt.destroyed) continue;
    const t = target(rt.def.id);
    if (!t) { rt.destroyed = true; continue; }
    const exposed = rt.exposedUntil > now;
    if (!exposed) {
      // expose triggers
      const r = rt.def.exposedRules;
      if (((r.exposeOnScan || r.exposeOnSupportScan) && t.scanned) || (r.exposeOnShieldBreak && bossShieldBroken)) {
        rt.exposedUntil = now + (r.exposeDurationSeconds ?? 8);
        t.scanned = false; t.weakpointExposed = true;
        const event = makeUtilityFeedback('boss-weakpoint-exposed', rt.targetId, rt.def.id);
        useCombatStore.getState().pushFeedbackEvent(event);
        triggerGameFeelFromFeedback(event);
      } else {
        // pin hp while hidden (invulnerable)
        t.hp = t.maxHp; t.defeatedAt = 0;
        t.weakpointExposed = false;
        continue;
      }
    }
    // exposed → damage sticks; detect destroyed
    if (t.hp <= 0 || t.defeatedAt > 0) {
      rt.destroyed = true;
      t.defeatedAt = now;
      events.push({ weakpointId: rt.def.id, effect: rt.def.effectOnDestroyed });
      const i = liveTargets.findIndex((x) => x.id === rt.targetId);
      if (i >= 0) liveTargets.splice(i, 1);
      useCombatTargetStore.getState().bump();
    }
  }
  return events;
}

export function liveWeakpointEntries(): { id: string; targetId: string; state: WeakpointVisualState }[] {
  return [...live.values()].map((rt) => ({ id: rt.def.id, targetId: rt.targetId, state: visualState(rt.def.id) }));
}

export function despawnAll(): void {
  for (const rt of live.values()) {
    const i = liveTargets.findIndex((t) => t.id === rt.targetId);
    if (i >= 0) liveTargets.splice(i, 1);
  }
  useCombatTargetStore.getState().bump();
  live.clear();
}

export function reset(): void {
  live.clear();
  uid = 0;
}
