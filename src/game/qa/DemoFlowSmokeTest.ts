import { seedGameContent } from '../boot/seedGameContent';
import { resetPortfolioDemo, skipPortfolioDemoToGameplay, startPortfolioDemo } from '../demo/DemoActions';
import { completeStage } from '../campaign/CampaignDirector';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { makeSmokeCheck } from './SmokeTestRunner';
import type { QACheck } from './ReleaseCandidateChecklist';

export function runDemoFlowSmokeTest(): QACheck[] {
  seedGameContent();
  resetPortfolioDemo();
  const checks: QACheck[] = [];
  checks.push(makeSmokeCheck('demo_landing_loads', 'Demo Landing loads', 'demo', true, 'Demo Landing shell should be mountable.'));
  startPortfolioDemo();
  checks.push(makeSmokeCheck('start_demo_works', 'Start Demo works', 'demo', useStageProgressionStore.getState().status === 'briefing', 'Start Demo did not enter briefing.'));
  checks.push(makeSmokeCheck('stage_briefing_loads', 'Stage briefing loads', 'demo', useStageProgressionStore.getState().activeStageId === 'stage_sunny_harbor_emergency', 'Stage 1 briefing did not load.'));
  checks.push(makeSmokeCheck('skip_to_gameplay_works', 'Skip to Gameplay works', 'demo', skipPortfolioDemoToGameplay(), 'Skip to gameplay failed.'));
  checks.push(makeSmokeCheck('stage_gameplay_starts', 'Stage gameplay starts', 'demo', useStageProgressionStore.getState().status === 'playing', 'Stage runtime did not enter playing status.'));
  useStageProgressionStore.getState().completeIncident('tmpl_road_accident');
  checks.push(makeSmokeCheck('incident_force_complete', 'Incident can be force completed', 'demo', useStageProgressionStore.getState().completedIncidentIds.includes('tmpl_road_accident'), 'Incident completion did not register.'));
  completeStage('stage_sunny_harbor_emergency');
  checks.push(makeSmokeCheck('stage_can_force_clear', 'Stage can be force completed', 'demo', useStageProgressionStore.getState().status === 'stage-clear', 'Stage clear status was not reached.'));
  checks.push(makeSmokeCheck('stage_2_unlocked', 'Stage 2 unlocked', 'demo', useStageProgressionStore.getState().unlockedStageIds.includes('stage_downtown_traffic_collapse'), 'Stage 2 did not unlock.'));
  return checks;
}
