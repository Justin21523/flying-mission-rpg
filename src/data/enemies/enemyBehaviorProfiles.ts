export type EnemyBehaviorState =
  | 'idle'
  | 'patrol'
  | 'detect-player'
  | 'chase'
  | 'attack'
  | 'retreat'
  | 'support-ally'
  | 'shield-ally'
  | 'summon'
  | 'repair'
  | 'protect-objective'
  | 'target-decoy'
  | 'stunned'
  | 'defeated';

export type EnemyBehaviorProfile = {
  id: string;
  enemyDefinitionId: string;
  preferredStates: EnemyBehaviorState[];
  leashRange: number;
  priority: 'frontline' | 'ranged' | 'support' | 'elite' | 'hazard';
  editorMeta?: { notes?: string };
};

export const SEED_ENEMY_BEHAVIOR_PROFILES: EnemyBehaviorProfile[] = [
  { id: 'behavior_crusher_drone', enemyDefinitionId: 'crusher_drone', preferredStates: ['idle', 'patrol', 'detect-player', 'chase', 'attack', 'stunned', 'defeated'], leashRange: 26, priority: 'frontline' },
  { id: 'behavior_pulse_turret', enemyDefinitionId: 'pulse_turret', preferredStates: ['idle', 'detect-player', 'attack', 'protect-objective', 'stunned', 'defeated'], leashRange: 28, priority: 'ranged' },
  { id: 'behavior_shield_carrier', enemyDefinitionId: 'shield_carrier', preferredStates: ['idle', 'patrol', 'detect-player', 'chase', 'shield-ally', 'attack', 'stunned', 'defeated'], leashRange: 24, priority: 'frontline' },
  { id: 'behavior_repair_wisp', enemyDefinitionId: 'repair_wisp', preferredStates: ['idle', 'detect-player', 'support-ally', 'repair', 'retreat', 'stunned', 'defeated'], leashRange: 24, priority: 'support' },
  { id: 'behavior_spawner_bug', enemyDefinitionId: 'glitch_spawner', preferredStates: ['idle', 'detect-player', 'summon', 'retreat', 'target-decoy', 'stunned', 'defeated'], leashRange: 26, priority: 'support' },
  { id: 'behavior_zip_glitch', enemyDefinitionId: 'zip_glitch', preferredStates: ['idle', 'patrol', 'detect-player', 'chase', 'attack', 'retreat', 'stunned', 'defeated'], leashRange: 28, priority: 'frontline' },
  { id: 'behavior_quake_walker', enemyDefinitionId: 'quake_walker', preferredStates: ['idle', 'detect-player', 'chase', 'attack', 'protect-objective', 'stunned', 'defeated'], leashRange: 24, priority: 'elite' },
  { id: 'behavior_hazard_core', enemyDefinitionId: 'hazard_core', preferredStates: ['idle', 'attack', 'protect-objective', 'stunned', 'defeated'], leashRange: 20, priority: 'hazard' },
  { id: 'behavior_drone_swarm', enemyDefinitionId: 'drone_swarm', preferredStates: ['idle', 'patrol', 'detect-player', 'chase', 'attack', 'target-decoy', 'stunned', 'defeated'], leashRange: 26, priority: 'frontline' },
  { id: 'behavior_sniper_node', enemyDefinitionId: 'sniper_node', preferredStates: ['idle', 'detect-player', 'attack', 'retreat', 'stunned', 'defeated'], leashRange: 34, priority: 'ranged' },
  { id: 'behavior_barrier_node', enemyDefinitionId: 'barrier_node', preferredStates: ['idle', 'support-ally', 'shield-ally', 'retreat', 'stunned', 'defeated'], leashRange: 24, priority: 'support' },
  { id: 'behavior_elite_sentinel', enemyDefinitionId: 'elite_sentinel', preferredStates: ['idle', 'patrol', 'detect-player', 'chase', 'attack', 'protect-objective', 'stunned', 'defeated'], leashRange: 30, priority: 'elite' },
];
