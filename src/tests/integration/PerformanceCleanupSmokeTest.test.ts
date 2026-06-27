import { beforeEach, describe, expect, it } from 'vitest';
import { useCombatSpawnStore } from '../../stores/game/combatSpawnStore';
import { useCombatTargetStore } from '../../stores/game/combatTargetStore';
import { runPerformanceSmokeTest } from '../../game/qa/PerformanceSmokeTest';

describe('PerformanceCleanupSmokeTest', () => {
  beforeEach(() => { useCombatTargetStore.getState().reset(); useCombatSpawnStore.getState().reset(); });

  it('keeps transient object counts under budget', () => {
    expect(runPerformanceSmokeTest().filter((check) => check.status === 'fail')).toEqual([]);
  });
});
