import type { QAFinding } from '../qa/ReleaseCandidateChecklist';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { getStageDefinition } from '../../stores/useStageEditorStore';

export function validateStoreIntegrity(): QAFinding[] {
  const stage = useStageProgressionStore.getState();
  const findings: QAFinding[] = [];
  if (stage.activeStageId && !getStageDefinition(stage.activeStageId)) findings.push({ id: 'active_stage_missing', severity: 'error', system: 'store-integrity', message: `Active stage does not exist: ${stage.activeStageId}` });
  if (stage.activeBossId && !stage.activeStageId) findings.push({ id: 'boss_without_stage', severity: 'error', system: 'store-integrity', message: 'Boss is active while no stage is active.' });
  if (stage.activeIncidentIds.length > 0 && !stage.activeStageId) findings.push({ id: 'incident_without_stage', severity: 'error', system: 'store-integrity', message: 'Incident is active while no stage is active.' });
  if (stage.status === 'inactive' && (stage.activeEncounterIds.length || stage.activeIncidentIds.length || stage.activeBossId)) {
    findings.push({ id: 'inactive_stage_has_runtime', severity: 'warning', system: 'store-integrity', message: 'Inactive stage still has active runtime systems.' });
  }
  return findings;
}
