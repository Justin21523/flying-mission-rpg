export type EnemyGroupTactic = {
  id: string;
  name: string;
  enemyDefinitionIds: string[];
  tacticTags: string[];
};

export const SEED_ENEMY_GROUP_TACTICS: EnemyGroupTactic[] = [
  { id: 'tactic_turret_shield', name: 'Turret + Shield Carrier', enemyDefinitionIds: ['pulse_turret', 'shield_carrier'], tacticTags: ['shield-front', 'ranged-backline'] },
  { id: 'tactic_crusher_wisp', name: 'Crusher + Repair Wisp', enemyDefinitionIds: ['crusher_drone', 'repair_wisp'], tacticTags: ['pressure', 'repair-support'] },
  { id: 'tactic_spawner_swarm', name: 'Spawner + Drone Swarm', enemyDefinitionIds: ['glitch_spawner', 'drone_swarm'], tacticTags: ['summon', 'aoe-check'] },
  { id: 'tactic_hazard_sniper', name: 'Hazard Core + Sniper Node', enemyDefinitionIds: ['hazard_core', 'sniper_node'], tacticTags: ['area-denial', 'long-range'] },
  { id: 'tactic_elite_barrier', name: 'Elite Sentinel + Barrier Node', enemyDefinitionIds: ['elite_sentinel', 'barrier_node'], tacticTags: ['elite', 'shield-support'] },
];

export function getTacticForEnemies(enemyDefinitionIds: string[]): EnemyGroupTactic | undefined {
  return SEED_ENEMY_GROUP_TACTICS.find((tactic) => tactic.enemyDefinitionIds.every((id) => enemyDefinitionIds.includes(id)));
}
