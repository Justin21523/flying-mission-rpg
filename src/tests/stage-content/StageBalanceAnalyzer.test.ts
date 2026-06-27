import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { analyzeStageBalance } from '../../game/balancing/StageBalanceAnalyzer';
import { getStageDefinitions } from '../../stores/useStageEditorStore';

describe('StageBalanceAnalyzer', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('does not report fatal balance findings for shipped stages', () => {
    for (const stage of getStageDefinitions()) {
      const findings = analyzeStageBalance(stage);
      expect(findings.filter((finding) => finding.severity === 'fatal'), stage.id).toEqual([]);
    }
  });
});
