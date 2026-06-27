import type { QACheck } from './ReleaseCandidateChecklist';
import { makeSmokeCheck } from './SmokeTestRunner';
import { shouldHideDeveloperDebug } from '../../stores/useDemoModeStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { shouldReduceVfxFlashing } from '../vfx/VfxReadabilityController';
import { getStageDefinition } from '../../stores/useStageEditorStore';

export function runUiAccessibilityAudit(): QACheck[] {
  const stage = getStageDefinition('stage_sunny_harbor_emergency');
  useSettingsStore.getState().updateSettings({ reduceFlashing: true, screenShake: 'off', largerUiText: true });
  return [
    makeSmokeCheck('ui_stage_card_labels', 'Stage cards have labels', 'ui-accessibility', !!stage?.name && !!stage?.briefing.objectives.length, 'Stage 1 lacks card/briefing labels.'),
    makeSmokeCheck('ui_demo_hides_debug', 'Demo Mode hides debug panels', 'ui-accessibility', shouldHideDeveloperDebug(), 'Demo Mode is not hiding debug by default.'),
    makeSmokeCheck('ui_reduce_flashing', 'Reduce flashing affects VFX readability', 'ui-accessibility', shouldReduceVfxFlashing(), 'Reduce flashing setting is not reflected in VFX readability.'),
    makeSmokeCheck('ui_screen_shake_off', 'Screen shake can be disabled', 'ui-accessibility', useSettingsStore.getState().screenShake === 'off', 'Screen shake setting did not persist off.'),
    makeSmokeCheck('ui_larger_text', 'Larger UI text can be enabled', 'ui-accessibility', useSettingsStore.getState().largerUiText, 'Larger UI text setting did not enable.'),
  ];
}
