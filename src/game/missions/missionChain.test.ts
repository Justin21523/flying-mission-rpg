import { describe, it, expect } from 'vitest';
import { missionDoneFlag, missionRequirementConditions } from './missionChain';
import { isMissionAvailable } from './missionAvailability';
import type { MissionDefinition } from '../../types/game/mission';
import type { DialogueCondition } from '../../types/dialogue';

const mission = (p: Partial<MissionDefinition>): MissionDefinition => ({
  id: 'm', name: 'M', sourceConfidence: 'GameAdaptation', type: 'delivery', locationId: '', difficulty: 'easy',
  weather: 'clear', recommendedCharacterIds: [], summary: '', objectives: [], ...p,
});

describe('missionChain', () => {
  it('builds a done-flag condition per required mission', () => {
    expect(missionDoneFlag('m_a')).toBe('mission:m_a:done');
    expect(missionRequirementConditions(['m_a', 'm_b'])).toEqual([
      { type: 'worldFlagSet', flag: 'mission:m_a:done' },
      { type: 'worldFlagSet', flag: 'mission:m_b:done' },
    ]);
    expect(missionRequirementConditions(undefined)).toEqual([]);
  });
});

describe('isMissionAvailable with requirements', () => {
  it('requires both prerequisites and required-mission done flags', () => {
    const m = mission({
      prerequisites: [{ type: 'worldFlagSet', flag: 'intro' }],
      requiredMissionIds: ['m_a'],
    });
    const flags = new Set(['intro']);
    const evalFn = (c: DialogueCondition) => c.type === 'worldFlagSet' && flags.has(c.flag);
    expect(isMissionAvailable(m, evalFn)).toBe(false); // m_a not done
    flags.add('mission:m_a:done');
    expect(isMissionAvailable(m, evalFn)).toBe(true);
  });
  it('no prereqs/requirements → available', () => {
    expect(isMissionAvailable(mission({}), () => false)).toBe(true);
  });
});
