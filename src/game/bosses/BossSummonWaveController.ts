import type { BossSummonWaveDefinition } from '../../types/game/boss';
import * as EnemySpawnDirector from '../combat/enemySpawnDirector';

// Boss summon waves (Batch F) — route through the existing EnemySpawnDirector (no new spawn logic). Tracks
// which waves were triggered + cleared so the phase controller can complete `clear-summon-wave`.
const triggered = new Set<string>();
const groupsByWave: Record<string, string[]> = {};

// Spawn a wave's enemy groups at the boss position. Injectable spawn fn for tests.
export function triggerWave(
  wave: BossSummonWaveDefinition,
  origin: { x: number; z: number },
  spawn: (groupId: string, x: number, z: number) => boolean = EnemySpawnDirector.spawnGroup,
): boolean {
  if (triggered.has(wave.id)) return false;
  let any = false;
  for (const gid of wave.enemySpawnGroupIds) if (spawn(gid, origin.x, origin.z)) any = true;
  triggered.add(wave.id);
  groupsByWave[wave.id] = [...wave.enemySpawnGroupIds];
  return any;
}

export function isWaveTriggered(waveId: string): boolean {
  return triggered.has(waveId);
}

export function isWaveCleared(
  wave: BossSummonWaveDefinition,
  isGroupCleared: (groupId: string) => boolean = EnemySpawnDirector.isGroupCleared,
): boolean {
  if (!triggered.has(wave.id)) return false;
  return wave.enemySpawnGroupIds.every((gid) => isGroupCleared(gid));
}

export function cleanupWave(wave: BossSummonWaveDefinition, despawn: (groupId: string) => void = EnemySpawnDirector.despawnGroup): void {
  for (const gid of groupsByWave[wave.id] ?? []) despawn(gid);
  delete groupsByWave[wave.id];
  triggered.delete(wave.id);
}

export function reset(): void {
  triggered.clear();
  for (const k of Object.keys(groupsByWave)) delete groupsByWave[k];
}
