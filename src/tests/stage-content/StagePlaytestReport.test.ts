import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { buildStagePlaytestReport } from '../../game/playtest/StagePlaytestAssertions';
import { getStageDefinitions } from '../../stores/useStageEditorStore';
import { getStagePlaytestScenario } from '../../stores/useStageContentEditorStore';

describe('StagePlaytestReport', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('builds passable reports for all shipped stages', () => {
    for (const stage of getStageDefinitions()) {
      const report = buildStagePlaytestReport(stage, getStagePlaytestScenario(stage.id));
      expect(report.validationStatus, stage.id).not.toBe('fail');
      expect(report.checks.canCompleteStage, stage.id).toBe(true);
    }
  });
});
