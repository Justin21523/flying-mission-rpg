import { describe, it, expect, beforeEach } from 'vitest';
import * as Arena from '../../game/bosses/BossArenaController';
import { SEED_BOSS_ARENAS } from '../../data/bosses/bossArenaDefinitions';

const arena = SEED_BOSS_ARENAS[0];

beforeEach(() => Arena.reset());

describe('BossArenaController', () => {
  it('locks on start + exposes the boss spawn position', () => {
    Arena.lockArena(arena);
    expect(Arena.isArenaLocked()).toBe(true);
    expect(Arena.activeArena()?.id).toBe(arena.id);
    expect(Arena.bossSpawnPosition()).toEqual([16, 0, 14]);
  });

  it('unlocks on boss defeat', () => {
    Arena.lockArena(arena);
    Arena.unlockArena();
    expect(Arena.isArenaLocked()).toBe(false);
  });
});
