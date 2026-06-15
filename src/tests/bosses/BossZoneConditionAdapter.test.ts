import { describe, it, expect } from 'vitest';
import { recordBossDefeated, recordPhaseComplete, recordWeakpointDestroyed, recordWaveCleared } from '../../game/bosses/BossZoneConditionAdapter';
import { evaluateCondition, type ZoneWorldProbe } from '../../game/advanced-mission-zone/ZoneCompletionEvaluator';
import type { ZoneSegmentDefinition, ZoneConditionDefinition } from '../../types/game/advancedMissionZone';

const seg = { id: 's', markers: [], completionConditions: [] } as unknown as ZoneSegmentDefinition;
const probe = (over: Partial<ZoneWorldProbe> = {}): ZoneWorldProbe => ({
  playerPos: { x: 0, z: 0 }, nowMs: 1000, segmentStartedAtMs: 0,
  completedObjectiveIds: new Set(), interactedObjectIds: new Set(), clearedAreaIds: new Set(), completedSegmentIds: new Set(),
  godMode: false, ...over,
});

describe('BossZoneConditionAdapter', () => {
  it('records boss events through the injected recorder', () => {
    const events: { kind: string; id: string }[] = [];
    const rec = (kind: string, id: string) => events.push({ kind, id });
    recordBossDefeated('harbor_core_sentinel', rec);
    recordPhaseComplete('harbor_core_sentinel', 'phase_harbor_p1', rec);
    recordWeakpointDestroyed('harbor_core_sentinel', 'wp_core', rec);
    recordWaveCleared('harbor_core_sentinel', 'wave_harbor_summon', rec);
    expect(events).toContainEqual({ kind: 'defeat-boss', id: 'harbor_core_sentinel' });
    expect(events).toContainEqual({ kind: 'complete-boss-phase', id: 'harbor_core_sentinel:phase_harbor_p1' });
    expect(events).toContainEqual({ kind: 'destroy-boss-weakpoint', id: 'harbor_core_sentinel:wp_core' });
    expect(events).toContainEqual({ kind: 'clear-boss-summon-wave', id: 'harbor_core_sentinel:wave_harbor_summon' });
  });

  it('the evaluator completes the boss conditions', () => {
    const defeat: ZoneConditionDefinition = { id: 'c1', type: 'defeat-boss', bossId: 'harbor_core_sentinel' };
    const phase: ZoneConditionDefinition = { id: 'c2', type: 'complete-boss-phase', bossId: 'harbor_core_sentinel', phaseId: 'phase_harbor_p1' };
    const wp: ZoneConditionDefinition = { id: 'c3', type: 'destroy-boss-weakpoint', bossId: 'harbor_core_sentinel', weakpointId: 'wp_core' };
    const wave: ZoneConditionDefinition = { id: 'c4', type: 'clear-boss-summon-wave', bossId: 'harbor_core_sentinel', waveId: 'wave_harbor_summon' };
    expect(evaluateCondition(defeat, seg, probe({ defeatedBossIds: new Set(['harbor_core_sentinel']) })).done).toBe(true);
    expect(evaluateCondition(defeat, seg, probe()).done).toBe(false);
    expect(evaluateCondition(phase, seg, probe({ completedBossPhaseIds: new Set(['harbor_core_sentinel:phase_harbor_p1']) })).done).toBe(true);
    expect(evaluateCondition(wp, seg, probe({ destroyedBossWeakpointIds: new Set(['harbor_core_sentinel:wp_core']) })).done).toBe(true);
    expect(evaluateCondition(wave, seg, probe({ clearedBossWaveIds: new Set(['harbor_core_sentinel:wave_harbor_summon']) })).done).toBe(true);
  });
});
