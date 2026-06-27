import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { PORTFOLIO_SHOT_LIST } from '../../data/demo/portfolioShotList';
import { applyRecordingSettings, exportRecordingChecklist, jumpToRecordingShot, resetRecordingMode } from '../../game/demo/PortfolioRecordingActions';
import { usePortfolioRecordingStore } from '../../stores/usePortfolioRecordingStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { getStageDefinition } from '../../stores/useStageEditorStore';

describe('PortfolioRecordingMode', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); resetRecordingMode(); useSettingsStore.getState().resetSettings(); });

  it('ships a complete portfolio shot list with valid stage references', () => {
    expect(PORTFOLIO_SHOT_LIST).toHaveLength(10);
    expect(PORTFOLIO_SHOT_LIST.every((shot) => shot.title && shot.purpose && shot.acceptanceText)).toBe(true);
    expect(PORTFOLIO_SHOT_LIST.every((shot) => !shot.stageId || !!getStageDefinition(shot.stageId))).toBe(true);
  });

  it('applies recording settings and persists mode', () => {
    applyRecordingSettings();
    expect(usePortfolioRecordingStore.getState().enabled).toBe(true);
    expect(usePortfolioRecordingStore.getState().hideDebug).toBe(true);
    expect(useSettingsStore.getState().vfxIntensity).toBe('cinematic');
    expect(localStorage.getItem('aero-rescue-portfolio-recording-mode-v1')).toContain('"enabled":true');
  });

  it('jumps to representative recording targets', () => {
    expect(jumpToRecordingShot('shot_stage1_briefing')).toBe(true);
    expect(usePortfolioRecordingStore.getState().currentShotId).toBe('shot_stage1_briefing');
    expect(jumpToRecordingShot('shot_boss_demo')).toBe(true);
    expect(usePortfolioRecordingStore.getState().currentShotId).toBe('shot_boss_demo');
  });

  it('exports recording checklist JSON', () => {
    const exported = JSON.parse(exportRecordingChecklist()) as { shots: unknown[] };
    expect(exported.shots).toHaveLength(PORTFOLIO_SHOT_LIST.length);
  });
});
