import { describe, expect, it } from 'vitest';
import { isStageClear } from '../../game/levels/LevelCompletionEvaluator';
import { SEED_STAGES } from '../../data/campaigns/stageDefinitions';
import { DEFAULT_STAGE_RUNTIME_STATE } from '../../stores/game/useStageProgressionStore';

describe('LevelCompletionEvaluator', () => {
  it('evaluates completed objectives', () => {
    const stage = SEED_STAGES[0];
    expect(isStageClear(stage, { ...DEFAULT_STAGE_RUNTIME_STATE, activeSegmentId: 'seg_repair_plaza', completedObjectiveIds: [...stage.objectiveIds, 'segment:seg_repair_plaza'], completedEncounterIds: ['enc_sunny_signal_yard'], completedIncidentIds: ['incident_seg_cargo_street'], activeBossId: undefined })).toBe(true);
  });
});
