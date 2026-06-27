import type { QAFinding } from './ReleaseCandidateChecklist';
import { loadCampaignProgression } from '../campaign/CampaignSaveAdapter';
import { getStageDefinition } from '../../stores/useStageEditorStore';

export function validateSaveData(): QAFinding[] {
  const findings: QAFinding[] = [];
  const saved = loadCampaignProgression();
  if (!saved) return findings;
  for (const stageId of saved.completedStageIds) {
    if (!getStageDefinition(stageId)) findings.push({ id: `save_completed_missing_${stageId}`, severity: 'error', system: 'save-data', message: `Save references missing completed stage ${stageId}.` });
  }
  for (const stageId of saved.unlockedStageIds) {
    if (!getStageDefinition(stageId)) findings.push({ id: `save_unlocked_missing_${stageId}`, severity: 'error', system: 'save-data', message: `Save references missing unlocked stage ${stageId}.` });
  }
  return findings;
}
