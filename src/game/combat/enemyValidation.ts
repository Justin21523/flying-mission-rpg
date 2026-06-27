import type { EnemyDefinition, EnemySpawnGroupDefinition, CombatValidationResult } from '../../types/game/combat';
import { ENEMY_ARCHETYPES } from '../../types/game/combat';

// Pure validators for enemy definitions + spawn groups (Batch C). Used by the editor + tests.

export function validateEnemy(def: EnemyDefinition): CombatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!def.id.trim()) errors.push('Enemy id must not be empty.');
  if (def.maxHp <= 0) errors.push('maxHp must be > 0.');
  if (def.aggroRange < 0) errors.push('aggroRange must be >= 0.');
  if (def.attackRange < 0) errors.push('attackRange must be >= 0.');
  if (def.moveSpeed < 0) errors.push('moveSpeed must be >= 0.');
  if (def.archetype && !ENEMY_ARCHETYPES.includes(def.archetype)) errors.push(`unknown archetype "${def.archetype}".`);
  if (def.archetype === 'crusher-drone' && !def.charge) errors.push('crusher-drone requires a charge config.');
  if (def.archetype === 'pulse-turret' && !def.turret) errors.push('pulse-turret requires a turret config.');
  if (def.archetype === 'pulse-turret' && def.turret && !def.turret.projectileSkillId.trim()) errors.push('turret needs a projectileSkillId.');
  if (def.archetype === 'shield-carrier' && !def.shield) errors.push('shield-carrier requires a shield config.');
  if (def.archetype === 'shield-carrier' && def.shield && def.shield.shieldHp <= 0) errors.push('shield-carrier shieldHp must be > 0.');
  // Batch I — new archetypes.
  if (def.archetype === 'spawner-bug' && !def.spawner) errors.push('spawner-bug requires a spawner config.');
  if (def.archetype === 'spawner-bug' && def.spawner && !def.spawner.spawnGroupId.trim()) errors.push('spawner-bug needs a spawnGroupId.');
  if (def.archetype === 'zip-glitch' && !def.zip) errors.push('zip-glitch requires a zip config.');
  if (def.archetype === 'quake-walker' && !def.quake) errors.push('quake-walker requires a quake config.');
  if (def.archetype === 'quake-walker' && def.quake && def.quake.slamRadius <= 0) errors.push('quake-walker slamRadius must be > 0.');
  if (def.archetype === 'repair-wisp' && !def.repairWisp) errors.push('repair-wisp requires a repairWisp config.');
  // Wave 2 — tactical archetypes + poise.
  if (def.archetype === 'dodger' && !def.dodger) errors.push('dodger requires a dodger config.');
  if (def.archetype === 'dodger' && def.dodger && def.dodger.projectileDetectRange <= 0) errors.push('dodger projectileDetectRange must be > 0.');
  if (def.archetype === 'flanker' && !def.flanker) errors.push('flanker requires a flanker config.');
  if (def.archetype === 'bomber' && !def.bomber) errors.push('bomber requires a bomber config.');
  if (def.archetype === 'bomber' && def.bomber && def.bomber.blastRadius <= 0) errors.push('bomber blastRadius must be > 0.');
  if (def.archetype === 'suppressor' && !def.suppressor) errors.push('suppressor requires a suppressor config.');
  if (def.archetype === 'suppressor' && def.suppressor && !def.suppressor.projectileSkillId.trim()) errors.push('suppressor needs a projectileSkillId.');
  if (def.archetype === 'buffer' && !def.buffer) errors.push('buffer requires a buffer config.');
  if (def.poise && def.poise.max <= 0) errors.push('poise.max must be > 0.');
  return { ok: errors.length === 0, errors, warnings };
}

export function validateSpawnGroup(group: EnemySpawnGroupDefinition, enemyExists: (id: string) => boolean): CombatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!group.id.trim()) errors.push('Spawn group id must not be empty.');
  if (!group.segmentId.trim()) errors.push('Spawn group segmentId must not be empty.');
  if (group.enemies.length === 0) errors.push('Spawn group has no enemies.');
  for (const e of group.enemies) {
    if (e.count <= 0) errors.push(`enemy "${e.enemyDefinitionId}" count must be > 0.`);
    if (!enemyExists(e.enemyDefinitionId)) errors.push(`enemy definition "${e.enemyDefinitionId}" does not exist.`);
  }
  if (group.respawn?.enabled && (group.respawn.respawnDelaySeconds ?? 0) < 0) errors.push('respawnDelaySeconds must be >= 0.');
  if (group.completeWhenAllDefeated && !group.linkedZoneConditionId) warnings.push('no linkedZoneConditionId — completion will not signal a zone condition.');
  return { ok: errors.length === 0, errors, warnings };
}
