import { describe, it, expect } from 'vitest';
import { groundCharacterScale, groundScaleRatio, GROUND_BASE_SCALE } from './groundCharacterScale';
import type { CharacterDefinition } from '../../types/game/character';

const char = (modelScale?: number): CharacterDefinition => ({
  id: 'c', codename: 'C', name: 'C', role: '', description: '', sourceConfidence: 'GameAdaptation',
  color: '#fff', defaultForm: 'plane', stats: { flightSpeed: 5, agility: 5, controlDifficulty: 5, durability: 5 },
  abilities: [], missionSuitability: [], modelScale,
});

describe('groundCharacterScale', () => {
  it('falls back to the base scale when modelScale is unset', () => {
    expect(groundCharacterScale(char(undefined))).toBe(GROUND_BASE_SCALE);
    expect(groundCharacterScale(undefined)).toBe(GROUND_BASE_SCALE);
  });
  it('uses the authored modelScale when set', () => {
    expect(groundCharacterScale(char(2.5))).toBe(2.5);
  });
  it('ignores a non-positive modelScale', () => {
    expect(groundCharacterScale(char(0))).toBe(GROUND_BASE_SCALE);
  });
  it('ratio is scale / base (so FX frame the current size)', () => {
    expect(groundScaleRatio(char(GROUND_BASE_SCALE))).toBe(1);
    expect(groundScaleRatio(char(GROUND_BASE_SCALE * 2))).toBe(2);
  });
});
