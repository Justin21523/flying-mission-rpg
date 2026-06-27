import { describe, expect, it, beforeEach } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { initializeEncounters, onSegmentEnter } from '../../game/encounters/EncounterDirector';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

describe('EncounterDirector', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); useStageProgressionStore.getState().resetRuntime(); });
  it('triggers encounters on segment enter', () => {
    initializeEncounters('stage_sunny_harbor_emergency');
    expect(onSegmentEnter('seg_signal_yard')).toContain('enc_sunny_signal_yard');
    expect(useStageProgressionStore.getState().activeEncounterIds).toContain('enc_sunny_signal_yard');
  });
});
