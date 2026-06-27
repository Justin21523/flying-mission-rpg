import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { resetPortfolioDemo, skipPortfolioDemoToBoss, skipPortfolioDemoToGameplay, startPortfolioDemo } from '../../game/demo/DemoActions';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useBossStore } from '../../stores/game/useBossStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { useDemoModeStore } from '../../stores/useDemoModeStore';

describe('PortfolioDemoFlow', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); resetPortfolioDemo(); });

  it('starts at Stage 1 briefing from quick start', () => {
    startPortfolioDemo();
    const runtime = useStageProgressionStore.getState();
    expect(runtime.activeStageId).toBe('stage_sunny_harbor_emergency');
    expect(runtime.status).toBe('briefing');
    expect(useDemoModeStore.getState().landingDismissed).toBe(true);
  });

  it('can skip directly into Stage 1 gameplay runtime', () => {
    expect(skipPortfolioDemoToGameplay()).toBe(true);
    const runtime = useStageProgressionStore.getState();
    expect(runtime.activeStageId).toBe('stage_sunny_harbor_emergency');
    expect(runtime.status).toBe('playing');
  });

  it('can skip directly into the Stage 5 boss demo runtime', () => {
    expect(skipPortfolioDemoToBoss()).toBe(true);
    const stageRuntime = useStageProgressionStore.getState();
    expect(stageRuntime.activeStageId).toBe('stage_skyport_core_finale');
    expect(stageRuntime.activeSegmentId).toBe('seg_skyport_core');
    expect(stageRuntime.status).toBe('playing');
    expect(useAdvancedMissionZoneStore.getState().activeSegmentId).toBe('seg_skyport_core');
    expect(useBossStore.getState().runtime?.bossDefinitionId).toBe('harbor_core_sentinel');
    expect(useCharacterStore.getState().selectedCharacterId).toBe('char_jett');
    expect(useCharacterStore.getState().support.map((support) => support.characterId)).toEqual(['char_chase', 'char_paul', 'char_donnie']);
  });
});
