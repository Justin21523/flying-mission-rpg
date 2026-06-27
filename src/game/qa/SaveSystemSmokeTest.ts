import type { QACheck } from './ReleaseCandidateChecklist';
import { makeSmokeCheck } from './SmokeTestRunner';
import { clearCampaignProgression, loadCampaignProgression, saveCampaignProgression } from '../campaign/CampaignSaveAdapter';
import { resetPortfolioDemo } from '../demo/DemoActions';
import { useSettingsStore } from '../../stores/useSettingsStore';

export function runSaveSystemSmokeTest(): QACheck[] {
  clearCampaignProgression();
  saveCampaignProgression({
    selectedCampaignId: 'campaign_rescue_vanguard',
    lastPlayedStageId: 'stage_sunny_harbor_emergency',
    completedStageIds: ['stage_sunny_harbor_emergency'],
    unlockedStageIds: ['stage_sunny_harbor_emergency', 'stage_downtown_traffic_collapse'],
    unlockedCharacterIds: [],
    unlockedAbilityIds: [],
    unlockedSupportAbilityIds: [],
    bestStageScores: {},
    stageClearTimestamps: {},
  });
  const saved = loadCampaignProgression();
  useSettingsStore.getState().updateSettings({ guidedHints: false });
  const settingsPersisted = (localStorage.getItem('aero-rescue-demo-settings-v1') ?? '').includes('"guidedHints":false');
  resetPortfolioDemo();
  const resetClears = loadCampaignProgression() == null;
  return [
    makeSmokeCheck('save_progress_persists', 'Campaign progression persists', 'save', saved?.completedStageIds.includes('stage_sunny_harbor_emergency') === true, 'Completed stage did not persist.'),
    makeSmokeCheck('settings_persist', 'Settings persist', 'save', settingsPersisted, 'Settings did not persist to localStorage.'),
    makeSmokeCheck('demo_reset_clears_progress', 'Demo reset clears campaign progress', 'save', resetClears, 'Demo reset did not clear campaign progression.'),
  ];
}
