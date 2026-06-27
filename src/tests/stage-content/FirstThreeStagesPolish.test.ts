import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { runStagePlaytestScenario } from '../../game/playtest/StagePlaytestRunner';
import { getStageDefinition } from '../../stores/useStageEditorStore';
import { getLevelLayout } from '../../stores/useLevelEditorStore';
import { getStageBalanceProfile, getStageContentPack, getStagePlaytestScenario } from '../../stores/useStageContentEditorStore';
import { SEED_ENEMY_SPAWN_GROUPS } from '../../data/combat/enemySpawnGroups';

const stageIds = ['stage_sunny_harbor_emergency', 'stage_downtown_traffic_collapse', 'stage_factory_core_breakdown'] as const;

describe('Batch N first three stage polish', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('uses authored pacing curves for Stage 1 to 3', () => {
    const expected = {
      stage_sunny_harbor_emergency: [1, 1, 2, 1],
      stage_downtown_traffic_collapse: [1, 2, 3, 2],
      stage_factory_core_breakdown: [1, 2, 3, 3],
    };
    for (const stageId of stageIds) {
      const pack = getStageContentPack(stageId)!;
      expect(pack.pacing.intensityCurve.map((item) => item.intensity), stageId).toEqual(expected[stageId]);
      expect(pack.pacing.beats[0].beatType, stageId).toBe('intro');
      expect(pack.pacing.beats[pack.pacing.beats.length - 1]?.beatType, stageId).toBe('final-objective');
      expect(pack.editorMeta?.contentStatus, stageId).toBe('polished');
    }
  });

  it('locks first-three gameplay role coverage and budgets', () => {
    expect(getStageContentPack('stage_sunny_harbor_emergency')?.requiredGameplaySystems).toMatchObject({ repair: true, heavyBreak: true, defense: false, scan: false });
    expect(getStageContentPack('stage_downtown_traffic_collapse')?.requiredGameplaySystems).toMatchObject({ defense: true, support: true, repair: true });
    expect(getStageContentPack('stage_factory_core_breakdown')?.requiredGameplaySystems).toMatchObject({ repair: true, scan: true, support: true });
    expect(getStageBalanceProfile('stage_sunny_harbor_emergency')?.enemyBudget.maxActiveEnemies).toBe(1);
    expect(getStageBalanceProfile('stage_factory_core_breakdown')?.enemyBudget.maxEliteEnemies).toBe(1);
  });

  it('tunes first-three encounter pressure', () => {
    const group = (id: string) => SEED_ENEMY_SPAWN_GROUPS.find((item) => item.id === id)!;
    expect(group('signal_yard_wave_01').enemies).toEqual([{ enemyDefinitionId: 'crusher_drone', count: 1, formation: 'cluster' }]);
    expect(group('downtown_swarm_evac_01').enemies.find((item) => item.enemyDefinitionId === 'drone_swarm')?.count).toBe(3);
    expect(group('factory_repair_support_01').enemies.find((item) => item.enemyDefinitionId === 'repair_wisp')?.count).toBe(1);
    expect(group('factory_hazard_core_01').enemies.find((item) => item.enemyDefinitionId === 'drone_swarm')?.count).toBe(2);
    expect(group('factory_elite_sentinel_01').enemies).toEqual([{ enemyDefinitionId: 'elite_sentinel', count: 1, formation: 'cluster' }]);
  });

  it('adds readable objective markers for first-three stage flow', () => {
    const stage1Layout = getLevelLayout(getStageDefinition('stage_sunny_harbor_emergency')!.levelLayoutId)!;
    expect(stage1Layout.objectiveMarkers.map((marker) => marker.id)).toContain('signal_yard_combat_marker');
    const stage2Layout = getLevelLayout(getStageDefinition('stage_downtown_traffic_collapse')!.levelLayoutId)!;
    expect(stage2Layout.objectiveMarkers.map((marker) => marker.label)).toContain('Traffic Command Core');
    const stage3Layout = getLevelLayout(getStageDefinition('stage_factory_core_breakdown')!.levelLayoutId)!;
    expect(stage3Layout.objectiveMarkers.map((marker) => marker.label)).toContain('Factory Core Terminal');
  });

  it('runs deterministic authored playtest scenarios for Stage 1 to 3', () => {
    for (const stageId of stageIds) {
      const scenario = getStagePlaytestScenario(stageId)!;
      expect(scenario.steps.some((step) => step.type === 'complete-stage'), stageId).toBe(true);
      expect(scenario.steps.some((step) => step.type === 'spawn-encounter'), stageId).toBe(true);
      const report = runStagePlaytestScenario(scenario);
      expect(report.checks.canCompleteStage, stageId).toBe(true);
      expect(report.validationStatus, stageId).not.toBe('fail');
    }
  });
});
