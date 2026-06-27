import type { StatusEffectType } from '../../game/combat/StatusEffectRuntime';

export type EnemyReactionPreset = {
  id: string;
  enemyDefinitionId: string;
  vulnerableStatusEffects: StatusEffectType[];
  resistantStatusEffects: StatusEffectType[];
  defeatVfxPresetId?: string;
  hitVfxPresetId?: string;
};

export const SEED_ENEMY_REACTION_PRESETS: EnemyReactionPreset[] = [
  { id: 'reaction_crusher_drone', enemyDefinitionId: 'crusher_drone', vulnerableStatusEffects: ['stunned', 'knocked-back'], resistantStatusEffects: ['slowed'], hitVfxPresetId: 'impact_spark' },
  { id: 'reaction_pulse_turret', enemyDefinitionId: 'pulse_turret', vulnerableStatusEffects: ['scanned', 'shield-broken'], resistantStatusEffects: ['restrained'], hitVfxPresetId: 'energy_ping' },
  { id: 'reaction_shield_carrier', enemyDefinitionId: 'shield_carrier', vulnerableStatusEffects: ['shield-broken', 'taunted'], resistantStatusEffects: ['knocked-back'], hitVfxPresetId: 'shield_flash' },
  { id: 'reaction_repair_wisp', enemyDefinitionId: 'repair_wisp', vulnerableStatusEffects: ['scanned', 'restrained'], resistantStatusEffects: ['repairing'], hitVfxPresetId: 'repair_spark' },
  { id: 'reaction_spawner_bug', enemyDefinitionId: 'glitch_spawner', vulnerableStatusEffects: ['slowed', 'scanned'], resistantStatusEffects: ['taunted'], hitVfxPresetId: 'glitch_pop' },
  { id: 'reaction_zip_glitch', enemyDefinitionId: 'zip_glitch', vulnerableStatusEffects: ['slowed', 'stunned'], resistantStatusEffects: ['scanned'], hitVfxPresetId: 'zip_arc' },
  { id: 'reaction_quake_walker', enemyDefinitionId: 'quake_walker', vulnerableStatusEffects: ['weakpoint-exposed', 'stunned'], resistantStatusEffects: ['knocked-back'], hitVfxPresetId: 'quake_chip' },
  { id: 'reaction_hazard_core', enemyDefinitionId: 'hazard_core', vulnerableStatusEffects: ['scanned', 'repairing'], resistantStatusEffects: ['burning-placeholder'], hitVfxPresetId: 'hazard_flash' },
  { id: 'reaction_drone_swarm', enemyDefinitionId: 'drone_swarm', vulnerableStatusEffects: ['restrained', 'slowed'], resistantStatusEffects: [], hitVfxPresetId: 'swarm_pop' },
  { id: 'reaction_sniper_node', enemyDefinitionId: 'sniper_node', vulnerableStatusEffects: ['scanned', 'stunned'], resistantStatusEffects: ['taunted'], hitVfxPresetId: 'sniper_ping' },
  { id: 'reaction_barrier_node', enemyDefinitionId: 'barrier_node', vulnerableStatusEffects: ['shield-broken', 'scanned'], resistantStatusEffects: ['protected'], hitVfxPresetId: 'barrier_flicker' },
  { id: 'reaction_elite_sentinel', enemyDefinitionId: 'elite_sentinel', vulnerableStatusEffects: ['weakpoint-exposed', 'shield-broken'], resistantStatusEffects: ['slowed', 'knocked-back'], hitVfxPresetId: 'elite_spark' },
];
