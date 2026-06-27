import { describe, it, expect } from 'vitest';
import { isBranchFork, unlockedRoutesForStage, newlyUnlockedStages } from './branchRoutes';
import type { StageDefinition } from '../../types/stageTypes';

const stage = (ids: string[]): StageDefinition => ({ unlocksOnClear: { stageIds: ids } } as StageDefinition);

describe('branch routes', () => {
  it('a clear unlocking >1 stage is a fork', () => {
    expect(isBranchFork(stage(['a', 'b']))).toBe(true);
    expect(isBranchFork(stage(['a']))).toBe(false);
    expect(isBranchFork(stage([]))).toBe(false);
  });
  it('unlockedRoutesForStage returns the unlock list', () => {
    expect(unlockedRoutesForStage(stage(['a', 'b']))).toEqual(['a', 'b']);
  });
  it('newlyUnlockedStages excludes already-unlocked', () => {
    expect(newlyUnlockedStages(stage(['a', 'b', 'c']), ['a'])).toEqual(['b', 'c']);
  });
});
