import type { QACheck } from './ReleaseCandidateChecklist';
import { makeSmokeCheck } from './SmokeTestRunner';
import { PORTFOLIO_SHOT_LIST } from '../../data/demo/portfolioShotList';
import { applyRecordingSettings, jumpToRecordingShot } from '../demo/PortfolioRecordingActions';
import { usePortfolioRecordingStore } from '../../stores/usePortfolioRecordingStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { getStageDefinition } from '../../stores/useStageEditorStore';

export function runRecordingReadinessSmokeTest(): QACheck[] {
  applyRecordingSettings();
  const recording = usePortfolioRecordingStore.getState();
  const settings = useSettingsStore.getState();
  const shotsHaveShape = PORTFOLIO_SHOT_LIST.every((shot) => shot.id && shot.title && shot.purpose && shot.recommendedAction && shot.acceptanceText);
  const shotStagesValid = PORTFOLIO_SHOT_LIST.every((shot) => !shot.stageId || !!getStageDefinition(shot.stageId));
  const stageBriefingJump = jumpToRecordingShot('shot_stage1_briefing');
  const bossJump = jumpToRecordingShot('shot_boss_demo');
  return [
    makeSmokeCheck('recording_shot_list_exists', 'Portfolio shot list exists', 'recording', PORTFOLIO_SHOT_LIST.length >= 10, 'Recording shot list should include at least 10 shots.'),
    makeSmokeCheck('recording_shots_have_shape', 'Portfolio shots have required copy', 'recording', shotsHaveShape, 'A shot is missing required recording copy.'),
    makeSmokeCheck('recording_stage_refs_valid', 'Portfolio shot stage references are valid', 'recording', shotStagesValid, 'A shot references a missing stage.'),
    makeSmokeCheck('recording_settings_apply', 'Recording settings apply', 'recording', recording.enabled && settings.vfxIntensity === 'cinematic' && settings.damageNumbers === 'minimal', 'Recording settings did not apply cinematic/minimal values.'),
    makeSmokeCheck('recording_stage1_jump', 'Recording can jump to Stage 1 briefing', 'recording', stageBriefingJump, 'Stage 1 recording jump failed.'),
    makeSmokeCheck('recording_boss_jump', 'Recording can jump to boss demo', 'recording', bossJump, 'Boss recording jump failed.'),
  ];
}
