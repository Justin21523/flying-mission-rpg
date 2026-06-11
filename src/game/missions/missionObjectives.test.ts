import { describe, it, expect } from 'vitest';
import { canCompleteObjective } from './missionObjectives';
import type { MissionObjective, MissionObjectiveProgress } from '../../types/game/mission';

const obj = (id: string, optional = false): MissionObjective => ({ id, kind: 'find', description: id, targetCount: 1, optional });
const prog = (done: string[]): Record<string, MissionObjectiveProgress> => Object.fromEntries(done.map((id) => [id, { done: true, count: 1 }]));

describe('canCompleteObjective', () => {
  const objectives = [obj('a'), obj('b'), obj('c')];
  it('non-ordered → always allowed', () => {
    expect(canCompleteObjective(objectives, {}, 'c', false)).toBe(true);
  });
  it('ordered → blocked until earlier required objectives are done', () => {
    expect(canCompleteObjective(objectives, {}, 'b', true)).toBe(false);
    expect(canCompleteObjective(objectives, prog(['a']), 'b', true)).toBe(true);
    expect(canCompleteObjective(objectives, prog(['a']), 'c', true)).toBe(false);
    expect(canCompleteObjective(objectives, prog(['a', 'b']), 'c', true)).toBe(true);
  });
  it('ordered → earlier OPTIONAL objectives do not block', () => {
    const objs = [obj('a', true), obj('b')];
    expect(canCompleteObjective(objs, {}, 'b', true)).toBe(true);
  });
  it('first objective is always allowed', () => {
    expect(canCompleteObjective(objectives, {}, 'a', true)).toBe(true);
  });
});
