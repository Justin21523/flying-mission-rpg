import type { GameplayCollisionEvent, CollisionReactionRule } from '../../types/collision';
import { subscribeCollision } from './collisionBus';
import { getCollisionRules } from '../../stores/editorCollisionStore';
import { runReactionAction } from './runReactionAction';

// Phase C — the data-driven collision reaction engine. Event-driven ONLY (subscribes to the collision bus on
// boot; no per-frame work). For each GameplayCollisionEvent it finds enabled rules that match the event's
// types/tags/phase/impact thresholds, sorts by priority, honours per-rule cooldown + per-contact once-firing,
// and runs each rule's actions. Per-contact flags clear when the pair separates (an 'exit' event), so a rule
// re-arms for the next approach — no anim/collision spam, recoverable interactions.
let booted = false;
const lastFire = new Map<string, number>();      // ruleId → seconds (cooldown)
const firedOnce = new Set<string>();             // `ruleId|sourceId|targetId` (oncePerContact)

function now(): number { return (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000; }

function hasAll(have: string[], need?: string[]): boolean {
  if (!need || need.length === 0) return true;
  for (const t of need) if (!have.includes(t)) return false;
  return true;
}
function hasNone(have: string[], blocked?: string[]): boolean {
  if (!blocked || blocked.length === 0) return true;
  for (const t of blocked) if (have.includes(t)) return false;
  return true;
}

function matches(r: CollisionReactionRule, e: GameplayCollisionEvent): boolean {
  if (!r.enabled) return false;
  if (!r.sourceTypes.includes(e.sourceType)) return false;
  if (!r.targetTypes.includes(e.targetType)) return false;
  if (!r.phases.includes(e.phase)) return false;
  if (!hasAll(e.sourceTags, r.requiredSourceTags) || !hasAll(e.targetTags, r.requiredTargetTags)) return false;
  if (!hasNone(e.sourceTags, r.blockedSourceTags) || !hasNone(e.targetTags, r.blockedTargetTags)) return false;
  const spd = e.relativeSpeed ?? 0;
  if (r.minImpactSpeed != null && spd < r.minImpactSpeed) return false;
  if (r.maxImpactSpeed != null && spd >= r.maxImpactSpeed) return false;
  const str = e.impactStrength ?? spd;
  if (r.minImpactStrength != null && str < r.minImpactStrength) return false;
  if (r.maxImpactStrength != null && str >= r.maxImpactStrength) return false;
  // requiredSurfaceTypes / requiredPathModes / character-state matchers are not carried on the event in
  // Phase C (no surface/state channel yet) — they are ignored here and wired in later phases.
  return true;
}

function handle(e: GameplayCollisionEvent): void {
  // Separation clears every per-contact flag for this pair, so rules re-arm for the next approach.
  if (e.phase === 'exit') {
    const suffix = `|${e.sourceId}|${e.targetId}`;
    for (const k of [...firedOnce]) if (k.endsWith(suffix)) firedOnce.delete(k);
  }
  const t = now();
  const rules = getCollisionRules().filter((r) => matches(r, e)).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  for (const r of rules) {
    if (r.cooldown > 0) {
      const last = lastFire.get(r.id) ?? -Infinity;
      if (t < last + r.cooldown) continue;
    }
    if (r.oncePerContact) {
      const key = `${r.id}|${e.sourceId}|${e.targetId}`;
      if (firedOnce.has(key)) continue;
      firedOnce.add(key);
    }
    lastFire.set(r.id, t);
    for (const action of r.actions) runReactionAction(action, e);
  }
}

// Idempotent boot — called once from PoliSystemBoot. Safe to call again (no double subscribe).
export function bootReactionEngine(): void {
  if (booted) return;
  booted = true;
  subscribeCollision(handle);
}
