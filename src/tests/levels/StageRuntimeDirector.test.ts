import { describe, expect, it, beforeEach } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { enterStageGameplay, startStage } from '../../game/levels/StageRuntimeDirector';
import { useGameStore } from '../../stores/game/useGameStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

describe('StageRuntimeDirector', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); useGameStore.getState().jumpTo('CHARACTER_SELECTION'); useStageProgressionStore.getState().resetRuntime(); });

  it('loads environment, level, mission zone and enters gameplay', () => {
    const stage = startStage('stage_sunny_harbor_emergency');
    expect(stage.environmentThemeId).toBe('env_sunny_harbor_day');
    useGameStore.getState().jumpTo('LANDING');
    expect(enterStageGameplay()).toBe(true);
    expect(useStageProgressionStore.getState().status).toBe('playing');
  });
});
