import { describe, it, expect } from 'vitest';
import { isMissionAvailable } from './missionAvailability';
import type { MissionDefinition } from '../../types/game/mission';
import type { DialogueCondition } from '../../types/dialogue';

const mission = (prerequisites?: DialogueCondition[]): MissionDefinition => ({
  id: 'm', name: 'M', sourceConfidence: 'GameAdaptation', type: 'delivery', locationId: 'l',
  difficulty: 'easy', weather: 'clear', recommendedCharacterIds: [], summary: '', objectives: [], prerequisites,
});

describe('isMissionAvailable', () => {
  it('no prerequisites → available', () => {
    expect(isMissionAvailable(mission(), () => false)).toBe(true);
  });
  it('available only when ALL prereqs pass', () => {
    const prereqs: DialogueCondition[] = [{ type: 'worldFlagSet', flag: 'a' }, { type: 'worldFlagSet', flag: 'b' }];
    expect(isMissionAvailable(mission(prereqs), (c) => c.type === 'worldFlagSet' && c.flag === 'a')).toBe(false);
    expect(isMissionAvailable(mission(prereqs), () => true)).toBe(true);
  });
});
