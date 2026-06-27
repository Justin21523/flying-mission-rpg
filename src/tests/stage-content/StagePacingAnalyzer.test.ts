import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { analyzeStagePacing } from '../../game/balancing/StagePacingAnalyzer';
import { getStageDefinitions } from '../../stores/useStageEditorStore';
import { getStageContentPack } from '../../stores/useStageContentEditorStore';

describe('StagePacingAnalyzer', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('gives every stage intro, middle and final beats', () => {
    for (const stage of getStageDefinitions()) {
      const pack = getStageContentPack(stage.id)!;
      expect(pack.pacing.beats.some((beat) => beat.beatType === 'intro'), stage.id).toBe(true);
      expect(pack.pacing.beats.some((beat) => ['incident', 'combat', 'obstacle'].includes(beat.beatType)), stage.id).toBe(true);
      expect(pack.pacing.beats.some((beat) => ['final-objective', 'boss', 'extraction'].includes(beat.beatType)), stage.id).toBe(true);
      expect(analyzeStagePacing(stage).filter((finding) => finding.severity === 'fatal'), stage.id).toEqual([]);
    }
  });
});
