import { describe, it, expect } from 'vitest';
import { isMissionComplete, completedMissionIds } from './completedMissions';
import { missionDoneFlag } from './missionChain';

describe('completedMissions', () => {
  const flags = {
    [missionDoneFlag('m_a')]: true,
    [missionDoneFlag('m_b')]: false, // recorded but not done
    [missionDoneFlag('m_c')]: true,
    intro_seen: true, // unrelated flag
  };
  it('isMissionComplete reads the done-flag', () => {
    expect(isMissionComplete(flags, 'm_a')).toBe(true);
    expect(isMissionComplete(flags, 'm_b')).toBe(false);
    expect(isMissionComplete(flags, 'm_missing')).toBe(false);
  });
  it('completedMissionIds extracts only true done-flags, ignoring other flags', () => {
    expect(completedMissionIds(flags).sort()).toEqual(['m_a', 'm_c']);
    expect(completedMissionIds({})).toEqual([]);
  });
});
