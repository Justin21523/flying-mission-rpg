import type { BossArenaDefinition } from '../../types/game/boss';

// Boss arena lock + markers (Batch F). Module-level lock state read by BossArenaRenderer (boundary mesh) and
// the boss flow. No camera-system change — camera hints are data only.
let current: BossArenaDefinition | null = null;
let locked = false;

export function lockArena(arena: BossArenaDefinition): void {
  current = arena;
  locked = arena.arenaLock.lockOnStart;
}

export function unlockArena(): void {
  if (current?.arenaLock.unlockOnBossDefeat) locked = false;
  else locked = false;
}

export function isArenaLocked(): boolean {
  return locked;
}

export function activeArena(): BossArenaDefinition | null {
  return current;
}

export function bossSpawnPosition(): [number, number, number] {
  return current?.bossSpawnPosition ?? [0, 0, 0];
}

export function reset(): void {
  current = null;
  locked = false;
}
