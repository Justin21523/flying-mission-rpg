import type { QAFinding } from './ReleaseCandidateChecklist';
import { validateGamePhases } from '../state/GamePhaseValidator';
import { auditCurrentGameState } from '../state/GameStateTransitionAudit';
import { validateStoreIntegrity } from '../state/StoreIntegrityValidator';

export function validateStateIntegrity(): QAFinding[] {
  return [
    ...validateGamePhases(),
    ...auditCurrentGameState(),
    ...validateStoreIntegrity(),
  ];
}
