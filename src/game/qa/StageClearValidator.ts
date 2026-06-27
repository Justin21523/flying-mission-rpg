import type { QAFinding } from './ReleaseCandidateChecklist';
import { seedGameContent } from '../boot/seedGameContent';
import { completeStage, loadCampaign, startStage } from '../campaign/CampaignDirector';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../data/campaigns/campaignDefinitions';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

export function validateStage1ClearFlow(): QAFinding[] {
  seedGameContent();
  useStageProgressionStore.getState().resetRuntime();
  loadCampaign(RESCUE_VANGUARD_CAMPAIGN_ID);
  const findings: QAFinding[] = [];
  if (!startStage('stage_sunny_harbor_emergency')) findings.push({ id: 'stage1_start_failed', severity: 'error', system: 'stage-clear', message: 'Stage 1 could not start.' });
  completeStage('stage_sunny_harbor_emergency');
  const state = useStageProgressionStore.getState();
  if (!state.completedStageIds.includes('stage_sunny_harbor_emergency')) findings.push({ id: 'stage1_not_completed', severity: 'error', system: 'stage-clear', message: 'Stage 1 did not mark completed.' });
  if (!state.unlockedStageIds.includes('stage_downtown_traffic_collapse')) findings.push({ id: 'stage2_not_unlocked', severity: 'error', system: 'stage-clear', message: 'Stage 1 clear did not unlock Stage 2.' });
  return findings;
}
