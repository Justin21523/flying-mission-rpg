import { useGameStore } from '../../stores/game/useGameStore';
import { isValidGamePhase } from './GamePhaseValidator';
import type { QAFinding } from '../qa/ReleaseCandidateChecklist';

export function auditCurrentGameState(): QAFinding[] {
  const state = useGameStore.getState();
  const findings: QAFinding[] = [];
  if (!isValidGamePhase(state.phase)) findings.push({ id: 'invalid_current_phase', severity: 'error', system: 'game-state', message: `Current phase is invalid: ${String(state.phase)}` });
  if (state.previousPhase && !isValidGamePhase(state.previousPhase)) findings.push({ id: 'invalid_previous_phase', severity: 'error', system: 'game-state', message: `Previous phase is invalid: ${String(state.previousPhase)}` });
  if (state.paused && state.phase !== 'PAUSED') findings.push({ id: 'paused_phase_mismatch', severity: 'error', system: 'game-state', message: 'Game is paused but phase is not PAUSED.' });
  if (state.phase === 'ERROR' && !state.error) findings.push({ id: 'error_phase_without_error', severity: 'warning', system: 'game-state', message: 'Game is in ERROR phase without an error message.' });
  return findings;
}
