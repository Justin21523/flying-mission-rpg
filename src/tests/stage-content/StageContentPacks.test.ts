import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { useStageContentPackStore } from '../../stores/useStageContentEditorStore';
import { getStageDefinitions } from '../../stores/useStageEditorStore';

describe('StageContentPacks', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('covers every stage with environment, encounters, pacing and edit metadata', () => {
    const packs = useStageContentPackStore.getState().items;
    for (const stage of getStageDefinitions()) {
      const pack = packs.find((item) => item.stageId === stage.id);
      expect(pack, stage.id).toBeTruthy();
      expect(pack?.environmentThemeId).toBe(stage.environmentThemeId);
      expect(pack?.encounterPackIds.length, stage.id).toBeGreaterThan(0);
      expect(pack?.pacing.beats.length, stage.id).toBeGreaterThan(0);
      expect(pack?.editorMeta?.contentStatus, stage.id).toBe('polished');
    }
  });
});
