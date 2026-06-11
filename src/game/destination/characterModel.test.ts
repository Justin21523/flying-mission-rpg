import { describe, it, expect } from 'vitest';
import { characterModelForForm } from './characterModel';
import type { CharacterDefinition } from '../../types/game/character';

const char = (over: Partial<CharacterDefinition> = {}): CharacterDefinition => ({
  id: 'c', codename: 'C', name: 'C', role: '', description: '', sourceConfidence: 'GameAdaptation',
  color: '#fff', defaultForm: 'plane', stats: { flightSpeed: 5, agility: 5, controlDifficulty: 5, durability: 5 },
  abilities: [], missionSuitability: [], modelAssetId: 'm_robot', ...over,
});

describe('characterModelForForm', () => {
  it('robot form uses modelAssetId', () => {
    expect(characterModelForForm(char(), 'robot')).toBe('m_robot');
  });
  it('plane form uses planeModelAssetId when set', () => {
    expect(characterModelForForm(char({ planeModelAssetId: 'm_plane' }), 'plane')).toBe('m_plane');
  });
  it('plane form falls back to the robot model when no plane model', () => {
    expect(characterModelForForm(char(), 'plane')).toBe('m_robot');
  });
  it('undefined character → undefined', () => {
    expect(characterModelForForm(undefined, 'plane')).toBeUndefined();
  });
});
