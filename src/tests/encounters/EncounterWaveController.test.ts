import { describe, expect, it, beforeEach } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { spawnEncounterWave, getEncounterWaveRemaining } from '../../game/encounters/EncounterWaveController';

describe('EncounterWaveController', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });
  it('spawns a wave through the enemy spawn director', () => {
    expect(spawnEncounterWave(['signal_yard_wave_01'], 0, 0)).toEqual(['signal_yard_wave_01']);
    expect(getEncounterWaveRemaining(['signal_yard_wave_01'])[0].total).toBeGreaterThan(0);
  });
});
