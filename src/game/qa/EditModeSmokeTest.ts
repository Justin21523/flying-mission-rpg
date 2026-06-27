import type { QACheck } from './ReleaseCandidateChecklist';
import { makeSmokeCheck } from './SmokeTestRunner';
import { useUiStore } from '../../stores/uiStore';
import { buildEditModeValidationSummary } from '../demo/EditModeValidationSummaryModel';

export function runEditModeSmokeTest(): QACheck[] {
  const before = useUiStore.getState().editMode;
  useUiStore.getState().setEditMode(true);
  const opens = useUiStore.getState().editMode;
  const summary = buildEditModeValidationSummary();
  useUiStore.getState().setEditMode(before);
  return [
    makeSmokeCheck('edit_mode_opens', 'Edit Mode opens', 'edit-mode', opens, 'Edit Mode did not open.'),
    makeSmokeCheck('edit_validation_summary', 'Validation summary works', 'edit-mode', summary.length > 0 && !summary.some((entry) => entry.status === 'fail'), 'Edit Mode validation summary failed.'),
    makeSmokeCheck('edit_mode_exits', 'Edit Mode exits without corrupting state', 'edit-mode', useUiStore.getState().editMode === before, 'Edit Mode did not restore previous state.'),
  ];
}
