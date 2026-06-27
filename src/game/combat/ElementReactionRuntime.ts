import { liveTargets } from '../../stores/game/combatTargetStore';
import { getTargetStatusEffects, removeStatusEffectsOfType, applyStatusEffect } from './StatusEffectRuntime';
import { reactionFor } from '../../stores/game/useElementReactionStore';
import type { StatusEffectId } from '../../data/combat/statusRules';
import type { DamageEventTemplate, DamageType } from '../../types/game/combat';

// Wave 1 — Element Reaction runtime. Pure of any CombatDirector import (CombatDirector imports THIS, so the
// damage/AoE/VFX functions are injected to avoid an import cycle). When a status effect is applied to an enemy
// that already carries a compatible primary status, fire a reaction: bonus burst damage (optionally AoE),
// consume the primary status, play a VFX, and emit feedback. A per-target cooldown prevents spam.

export interface ReactionDeps {
  nowMs: number;
  damageTarget: (targetId: string, template: DamageEventTemplate) => void;
  damageInRadius: (x: number, z: number, radius: number, template: DamageEventTemplate) => void;
  playEffect?: (effectId: string, targetId: string, x: number, y: number, z: number) => void;
  onReaction?: (reactionId: string, targetId: string) => void;
}

// Returns the reaction id that fired, else null.
export function tryTriggerReaction(
  targetId: string,
  incomingStatus: StatusEffectId,
  sourceId: string,
  deps: ReactionDeps,
): string | null {
  const t = liveTargets.find((x) => x.id === targetId);
  if (!t || t.defeatedAt || !t.isEnemy) return null;

  const active = new Set(getTargetStatusEffects(t).map((e) => e.type));
  const rule = reactionFor(active, incomingStatus);
  if (!rule) return null;

  // Per-target reaction cooldown (stored on the ai blackboard, in ms).
  const cdUntil = t.aiData?.reactionCdUntilMs ?? 0;
  if (deps.nowMs < cdUntil) return null;
  (t.aiData ??= {}).reactionCdUntilMs = deps.nowMs + (rule.cooldownMs ?? 600);

  const template: DamageEventTemplate = {
    amount: rule.bonusDamage,
    damageType: (rule.damageType ?? 'energy') as DamageType,
    attackTags: rule.attackTags ?? ['reaction', rule.reaction],
  };

  deps.damageTarget(targetId, template);
  if (rule.aoeRadius && rule.aoeRadius > 0) deps.damageInRadius(t.x, t.z, rule.aoeRadius, template);
  if (rule.consumesPrimary !== false) removeStatusEffectsOfType(targetId, rule.primaryStatus);
  // Wave 4 — chain: leave a resulting status on the primary target (a later compatible hit reacts again; the
  // per-target cooldown above prevents same-frame recursion). Spread: plant a status on nearby enemies (their
  // statuses detonate on the player's next elemental hit — no runtime recursion).
  if (rule.resultsInStatus) applyStatusEffect(targetId, rule.resultsInStatus, sourceId);
  if (rule.propagatesStatus) {
    const { statusType, radius } = rule.propagatesStatus;
    const r2 = radius * radius;
    for (const e of liveTargets) {
      if (e.id === targetId || !e.isEnemy || e.defeatedAt) continue;
      const dx = e.x - t.x, dz = e.z - t.z;
      if (dx * dx + dz * dz <= r2) applyStatusEffect(e.id, statusType, sourceId);
    }
  }
  if (rule.vfxEffectId && deps.playEffect) deps.playEffect(rule.vfxEffectId, targetId, t.x, t.y, t.z);
  deps.onReaction?.(rule.id, targetId);
  return rule.reaction;
}
