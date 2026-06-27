import { PORTFOLIO_SHOT_LIST, getPortfolioShot } from '../../data/demo/portfolioShotList';
import { usePortfolioRecordingStore } from '../../stores/usePortfolioRecordingStore';
import { useDemoModeStore } from '../../stores/useDemoModeStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useUiStore } from '../../stores/uiStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { skipPortfolioDemoToBoss, skipPortfolioDemoToGameplay, startPortfolioDemo } from './DemoActions';

export function applyRecordingSettings(): void {
  usePortfolioRecordingStore.getState().updateRecordingMode({ enabled: true, hideDebug: true, cinematicVfx: true, showSafeFrame: true, showShotChecklist: true });
  useDemoModeStore.getState().updateDemoMode({
    enabled: true,
    landingDismissed: true,
    hideDebugByDefault: true,
    showControlsOverlay: true,
    showFeatureHighlights: false,
    enableGuidedHints: true,
  });
  useSettingsStore.getState().updateSettings({
    vfxIntensity: 'cinematic',
    screenShake: 'low',
    damageNumbers: 'minimal',
    particleDensity: 'high',
    physicsDebris: 'low',
    cameraEffects: true,
    reduceFlashing: false,
    largerUiText: false,
  });
}

export function resetRecordingMode(): void {
  usePortfolioRecordingStore.getState().resetRecordingMode();
}

export function exportRecordingChecklist(): string {
  return JSON.stringify({ generatedAt: new Date().toISOString(), shots: PORTFOLIO_SHOT_LIST }, null, 2);
}

export function jumpToRecordingShot(shotId: string): boolean {
  const shot = getPortfolioShot(shotId);
  if (!shot) return false;
  applyRecordingSettings();
  usePortfolioRecordingStore.getState().setCurrentShot(shot.id);
  usePortfolioRecordingStore.getState().updateRecordingMode({ selectedStageId: shot.stageId ?? usePortfolioRecordingStore.getState().selectedStageId });

  if (shot.target === 'landing') {
    useDemoModeStore.getState().showLanding();
    useGameStore.getState().jumpTo('MISSION_CONTROL');
    return true;
  }
  if (shot.target === 'campaign-map') {
    useDemoModeStore.getState().dismissLanding();
    useGameStore.getState().jumpTo('MISSION_CONTROL');
    return true;
  }
  if (shot.target === 'stage-briefing') return startPortfolioDemo(shot.stageId);
  if (shot.target === 'stage-gameplay') return skipPortfolioDemoToGameplay(shot.stageId);
  if (shot.target === 'boss-demo') return skipPortfolioDemoToBoss();
  if (shot.target === 'edit-mode') {
    useDemoModeStore.getState().dismissLanding();
    useUiStore.getState().setEditMode(true);
    useUiStore.getState().setEditorHubTab('gedithome');
    return true;
  }
  if (shot.target === 'rc-panel') {
    useDemoModeStore.getState().dismissLanding();
    useUiStore.getState().setEditMode(true);
    return true;
  }
  return false;
}
