import { describe, it, expect } from 'vitest';
import { pickObjectiveId } from './supportContribution';
import type { MissionObjectiveKind } from '../../types/game/mission';

const objs: { id: string; kind: MissionObjectiveKind }[] = [
  { id: 'o1', kind: 'carry' },
  { id: 'o2', kind: 'activate' },
  { id: 'o3', kind: 'find' },
];

describe('pickObjectiveId', () => {
  it('prefers an objective matching the character abilities', () => {
    expect(pickObjectiveId(objs, new Set(), ['engineering'])).toBe('o2'); // engineering → activate
    expect(pickObjectiveId(objs, new Set(), ['search'])).toBe('o3');      // search → find
  });
  it('falls back to the first outstanding when no ability matches', () => {
    expect(pickObjectiveId(objs, new Set(), [])).toBe('o1');
  });
  it('skips already-done objectives (carry done → no carry left → first outstanding)', () => {
    expect(pickObjectiveId(objs, new Set(['o1']), ['transport'])).toBe('o2');
  });
  it('returns null when everything is done', () => {
    expect(pickObjectiveId(objs, new Set(['o1', 'o2', 'o3']), ['engineering'])).toBeNull();
  });
});
