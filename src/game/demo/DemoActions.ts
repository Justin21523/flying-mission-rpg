import { clearCampaignProgression } from '../campaign/CampaignSaveAdapter';
import { loadCampaign, startStage } from '../campaign/CampaignDirector';
import { enterStageGameplay, startStage as startStageRuntime } from '../levels/StageRuntimeDirector';
import { startBoss } from '../bosses/BossDirector';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { getBossDemoProfileForStage } from '../../data/bosses/bossDemoProfiles';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useDemoModeStore } from '../../stores/useDemoModeStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

export function startPortfolioDemo(stageId?: string): boolean {
  const demo = useDemoModeStore.getState();
  demo.dismissLanding();
  loadCampaign(RESCUE_VANGUARD_CAMPAIGN_ID);
  return startStage(stageId ?? demo.defaultStageId);
}

export function skipPortfolioDemoToGameplay(stageId?: string): boolean {
  const demo = useDemoModeStore.getState();
  demo.dismissLanding();
  const targetStageId = stageId ?? demo.defaultStageId;
  loadCampaign(RESCUE_VANGUARD_CAMPAIGN_ID);
  useCharacterStore.getState().selectCharacter(demo.defaultCharacterIds[0] ?? 'char_jett');
  startStageRuntime(targetStageId);
  return enterStageGameplay();
}

export function skipPortfolioDemoToBoss(): boolean {
  const stageId = 'stage_skyport_core_finale';
  const profile = getBossDemoProfileForStage(stageId);
  if (!skipPortfolioDemoToGameplay(stageId) || !profile) return false;
  const characters = useCharacterStore.getState();
  characters.selectCharacter(profile.recommendedCharacterIds[0] ?? 'char_jett');
  characters.clearSupport();
  for (const characterId of profile.recommendedSupportIds) characters.addSupport({ characterId, status: 'standby' });
  useStageProgressionStore.getState().setActiveSegment('seg_skyport_core');
  useAdvancedMissionZoneStore.getState().enterSegment('seg_skyport_core');
  startBoss(profile.bossId);
  return useStageProgressionStore.getState().status === 'playing';
}

export function resetPortfolioDemo(): void {
  clearCampaignProgression();
  useStageProgressionStore.getState().resetRuntime();
  useCharacterStore.getState().reset();
  useGameStore.getState().jumpTo('MISSION_CONTROL');
  useDemoModeStore.getState().showLanding();
}
