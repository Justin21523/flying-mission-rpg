import type { ObstacleDefinition } from '../../types/game/obstacle';
import { OBSTACLE_TYPES, OBSTACLE_STATES } from '../../types/game/obstacle';
import type { CombatValidationResult } from '../../types/game/combat';

// Pure validator for obstacle definitions (Batch C).
export function validateObstacle(def: ObstacleDefinition): CombatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!def.id.trim()) errors.push('Obstacle id must not be empty.');
  if (!OBSTACLE_TYPES.includes(def.obstacleType)) errors.push(`unknown obstacleType "${def.obstacleType}".`);
  if (!def.segmentId.trim()) errors.push('Obstacle segmentId must not be empty.');
  if (!OBSTACLE_STATES.includes(def.stateMachine.initialState)) errors.push('initialState is not a valid ObstacleState.');
  if (!def.visualStates[def.stateMachine.initialState]) warnings.push('no visualState for the initial state.');
  for (const tr of def.stateMachine.allowedTransitions) {
    if (!OBSTACLE_STATES.includes(tr.from) || !OBSTACLE_STATES.includes(tr.to)) errors.push(`invalid transition ${tr.from}→${tr.to}.`);
  }
  if (def.interactionRules.length === 0) warnings.push('no interaction rules — only debug-clear can change it.');
  for (const r of def.interactionRules) {
    if (!OBSTACLE_STATES.includes(r.resultState)) errors.push(`rule "${r.id}" resultState invalid.`);
  }
  if ((def.obstacleType === 'energy-barrier' || def.obstacleType === 'cracked-wall') && !def.damageable) {
    warnings.push(`${def.obstacleType} has no damageable — it cannot be attacked.`);
  }
  return { ok: errors.length === 0, errors, warnings };
}
