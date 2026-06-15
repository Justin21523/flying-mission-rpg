import type { ObstacleDefinition, ObstacleState, ObstacleTrigger, ObstacleInteractionRule } from '../../types/game/obstacle';

// Pure obstacle interaction resolution (Batch C). Given an obstacle's current state + accumulated counters +
// a trigger, find the first matching interaction rule whose threshold is met AND whose resulting transition
// is allowed by the state machine. Returns the matched rule (caller applies the state + effects) or null.

export interface ObstacleProgress {
  state: ObstacleState;
  hp: number;
  maxHp: number;
  shield: number;
  interactCount: number;
  repairAmount: number;
}

function tagsOk(rule: ObstacleInteractionRule, tags: string[]): boolean {
  if (rule.requiredTags && rule.requiredTags.length && !rule.requiredTags.some((t) => tags.includes(t))) return false;
  if (rule.forbiddenTags && rule.forbiddenTags.some((t) => tags.includes(t))) return false;
  return true;
}

function thresholdMet(rule: ObstacleInteractionRule, p: ObstacleProgress): boolean {
  const th = rule.threshold;
  if (!th) return true;
  if (th.damageAmount != null && p.hp > p.maxHp - th.damageAmount) return false; // not enough cumulative damage
  if (th.repairAmount != null && p.repairAmount < th.repairAmount) return false;
  if (th.interactCount != null && p.interactCount < th.interactCount) return false;
  return true;
}

export function canTransition(def: ObstacleDefinition, from: ObstacleState, to: ObstacleState, trigger: string): boolean {
  return def.stateMachine.allowedTransitions.some((t) => t.from === from && t.to === to && (t.trigger === trigger || t.trigger === 'any'));
}

export function resolveInteraction(
  def: ObstacleDefinition,
  p: ObstacleProgress,
  trigger: ObstacleTrigger,
  ctx: { tags?: string[] } = {},
): ObstacleInteractionRule | null {
  const tags = ctx.tags ?? [];
  for (const rule of def.interactionRules) {
    if (rule.trigger !== trigger) continue;
    if (!tagsOk(rule, tags)) continue;
    if (!thresholdMet(rule, p)) continue;
    if (!canTransition(def, p.state, rule.resultState, trigger)) continue;
    return rule;
  }
  return null;
}
