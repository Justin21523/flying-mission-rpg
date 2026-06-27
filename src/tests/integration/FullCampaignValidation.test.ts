import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { completeStage, loadCampaign, startStage } from '../../game/campaign/CampaignDirector';
import { validateCampaign, validateStage } from '../../game/campaign/CampaignValidation';
import { validateLevelLayout } from '../../game/levels/LevelValidation';
import { validateEncounter } from '../../game/encounters/EncounterValidation';
import { validateEnvironmentTheme } from '../../game/environments/EnvironmentValidation';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { getCampaignDefinition, getStageDefinitions, getStagesForCampaign } from '../../stores/useStageEditorStore';
import { useLevelLayoutStore } from '../../stores/useLevelEditorStore';
import { useEnemyEncounterStore } from '../../stores/useEncounterEditorStore';
import { useEnvironmentThemeStore } from '../../stores/useEnvironmentEditorStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

describe('FullCampaignValidation', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); useStageProgressionStore.getState().resetRuntime(); });

  it('validates all campaign, stage, level, encounter and environment content', () => {
    const campaign = getCampaignDefinition(RESCUE_VANGUARD_CAMPAIGN_ID)!;
    const stages = getStagesForCampaign(campaign.id);
    expect(validateCampaign(campaign, stages).ok).toBe(true);
    expect(stages.every((stage) => validateStage(stage, [campaign.id]).ok)).toBe(true);
    expect(useLevelLayoutStore.getState().items.every((layout) => validateLevelLayout(layout).ok)).toBe(true);
    expect(useEnemyEncounterStore.getState().items.every((encounter) => validateEncounter(encounter).ok)).toBe(true);
    expect(useEnvironmentThemeStore.getState().items.every((theme) => validateEnvironmentTheme(theme).ok)).toBe(true);
  });

  it('unlocks linearly through Stage 10 and marks the finale completed', () => {
    loadCampaign(RESCUE_VANGUARD_CAMPAIGN_ID);
    for (const stage of getStageDefinitions()) {
      expect(startStage(stage.id), stage.id).toBe(true);
      completeStage(stage.id);
    }
    expect(useStageProgressionStore.getState().completedStageIds).toContain('stage_rescue_vanguard_finale');
  });
});
