import { describe, it, expect, beforeEach } from 'vitest';
import * as Wave from '../../game/bosses/BossSummonWaveController';
import { SEED_BOSS_SUMMON_WAVES } from '../../data/bosses/bossSummonWaves';

const wave = SEED_BOSS_SUMMON_WAVES[0];

beforeEach(() => Wave.reset());

describe('BossSummonWaveController', () => {
  it('triggers its enemy spawn groups (once)', () => {
    const spawned: string[] = [];
    const ok = Wave.triggerWave(wave, { x: 0, z: 0 }, (gid) => { spawned.push(gid); return true; });
    expect(ok).toBe(true);
    expect(spawned).toContain('harbor_core_wave_01');
    expect(Wave.isWaveTriggered(wave.id)).toBe(true);
    expect(Wave.triggerWave(wave, { x: 0, z: 0 }, () => true)).toBe(false); // no double-trigger
  });

  it('is cleared only when all groups are cleared', () => {
    Wave.triggerWave(wave, { x: 0, z: 0 }, () => true);
    expect(Wave.isWaveCleared(wave, () => false)).toBe(false);
    expect(Wave.isWaveCleared(wave, () => true)).toBe(true);
  });

  it('cleanup despawns + un-triggers', () => {
    const despawned: string[] = [];
    Wave.triggerWave(wave, { x: 0, z: 0 }, () => true);
    Wave.cleanupWave(wave, (gid) => despawned.push(gid));
    expect(despawned).toContain('harbor_core_wave_01');
    expect(Wave.isWaveTriggered(wave.id)).toBe(false);
  });
});
