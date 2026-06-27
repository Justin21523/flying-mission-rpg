import { groupRemaining, isGroupCleared, spawnGroup } from '../combat/enemySpawnDirector';

export function spawnEncounterWave(groupIds: string[], originX: number, originZ: number): string[] {
  const spawned: string[] = [];
  for (const groupId of groupIds) {
    if (spawnGroup(groupId, originX, originZ)) spawned.push(groupId);
  }
  return spawned;
}

export function areEncounterGroupsCleared(groupIds: string[]): boolean {
  return groupIds.every((groupId) => isGroupCleared(groupId));
}

export function getEncounterWaveRemaining(groupIds: string[]) {
  return groupIds.map((groupId) => ({ groupId, ...groupRemaining(groupId) }));
}
