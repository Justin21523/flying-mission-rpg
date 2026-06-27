import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { analyzeCharacterCoverage } from '../../game/balancing/CharacterCoverageAnalyzer';
import { getStageDefinitions } from '../../stores/useStageEditorStore';

describe('CharacterCoverageAnalyzer', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('keeps at least two viable role solutions per stage', () => {
    for (const stage of getStageDefinitions()) {
      expect(analyzeCharacterCoverage(stage).filter((finding) => finding.severity === 'fatal'), stage.id).toEqual([]);
      expect(new Set([...stage.recommendedCharacterIds, ...(stage.recommendedSupportIds ?? [])]).size, stage.id).toBeGreaterThanOrEqual(2);
    }
  });
});
