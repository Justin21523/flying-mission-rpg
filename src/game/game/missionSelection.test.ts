import { describe, it, expect } from 'vitest';
import { pickTestMissionId, isCharacterRecommended } from './missionSelection';
import type { MissionDefinition } from '../../types/game/mission';
import type { CharacterDefinition } from '../../types/game/character';

const mission = (id: string, type: MissionDefinition['type'], recommended: string[]): MissionDefinition => ({
  id,
  name: id,
  sourceConfidence: 'GameAdaptation',
  type,
  locationId: 'loc_x',
  difficulty: 'easy',
  weather: 'clear',
  recommendedCharacterIds: recommended,
  summary: '',
  objectives: [],
});

const character = (id: string, suitability: string[]): CharacterDefinition => ({
  id,
  codename: id,
  name: id,
  role: '',
  description: '',
  sourceConfidence: 'GameAdaptation',
  color: '#fff',
  defaultForm: 'plane',
  stats: { flightSpeed: 5, agility: 5, controlDifficulty: 5, durability: 5 },
  abilities: [],
  missionSuitability: suitability,
});

describe('pickTestMissionId', () => {
  it('returns null for an empty pool', () => {
    expect(pickTestMissionId([])).toBeNull();
  });
  it('returns a member id', () => {
    const ms = [mission('a', 'delivery', []), mission('b', 'repair', [])];
    expect(['a', 'b']).toContain(pickTestMissionId(ms));
  });
  it('avoids the excluded id when alternatives exist', () => {
    const ms = [mission('a', 'delivery', []), mission('b', 'repair', [])];
    for (let i = 0; i < 20; i++) expect(pickTestMissionId(ms, 'a')).toBe('b');
  });
  it('falls back to the only id even if excluded', () => {
    expect(pickTestMissionId([mission('a', 'delivery', [])], 'a')).toBe('a');
  });
});

describe('isCharacterRecommended', () => {
  const m = mission('m1', 'repair', ['char_donnie']);
  it('true when explicitly recommended', () => {
    expect(isCharacterRecommended(character('char_donnie', []), m)).toBe(true);
  });
  it('true when suitability covers the mission type', () => {
    expect(isCharacterRecommended(character('char_todd', ['repair']), m)).toBe(true);
  });
  it('false otherwise', () => {
    expect(isCharacterRecommended(character('char_jett', ['delivery']), m)).toBe(false);
  });
  it('false for a null mission', () => {
    expect(isCharacterRecommended(character('char_jett', ['delivery']), null)).toBe(false);
  });
});
