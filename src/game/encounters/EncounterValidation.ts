import type { EnemyEncounterDefinition } from '../../types/encounterTypes';
import type { ValidationResult } from '../../types/stageProgressionTypes';
import { getSpawnGroup } from '../../stores/game/editorCombatStore';

export function validateEncounter(encounter: EnemyEncounterDefinition): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!encounter.enemySpawnGroupIds.length) errors.push(`${encounter.id}: enemySpawnGroupIds cannot be empty.`);
  for (const groupId of encounter.enemySpawnGroupIds) if (!getSpawnGroup(groupId)) errors.push(`${encounter.id}: missing spawn group ${groupId}.`);
  if (!encounter.clearConditions.length) errors.push(`${encounter.id}: clearConditions cannot be empty.`);
  if (encounter.trigger.type === 'timer' && encounter.trigger.seconds <= 0) errors.push(`${encounter.id}: timer trigger must be > 0.`);
  if (encounter.scaling?.hpMultiplier != null && encounter.scaling.hpMultiplier <= 0) errors.push(`${encounter.id}: hpMultiplier must be > 0.`);
  if (encounter.scaling?.damageMultiplier != null && encounter.scaling.damageMultiplier <= 0) errors.push(`${encounter.id}: damageMultiplier must be > 0.`);
  if (encounter.scaling?.countMultiplier != null && encounter.scaling.countMultiplier <= 0) errors.push(`${encounter.id}: countMultiplier must be > 0.`);
  return { ok: errors.length === 0, errors, warnings };
}
