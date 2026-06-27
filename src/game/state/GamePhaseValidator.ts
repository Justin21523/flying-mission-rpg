import { GAME_PHASES, type GamePhase } from '../../types/game/state';
import { TRANSITIONS } from '../core/GameStateMachine';
import type { QAFinding } from '../qa/ReleaseCandidateChecklist';

export function validateGamePhases(): QAFinding[] {
  const findings: QAFinding[] = [];
  const phases = new Set<GamePhase>(GAME_PHASES);
  for (const phase of GAME_PHASES) {
    if (!TRANSITIONS[phase]) findings.push({ id: `missing_transition_${phase}`, severity: 'error', system: 'game-phase', message: `${phase} is missing transition metadata.` });
    for (const target of TRANSITIONS[phase] ?? []) {
      if (!phases.has(target)) findings.push({ id: `invalid_transition_${phase}_${target}`, severity: 'error', system: 'game-phase', message: `${phase} transitions to unknown phase ${target}.` });
    }
  }
  return findings;
}

export function isValidGamePhase(value: string): value is GamePhase {
  return (GAME_PHASES as readonly string[]).includes(value);
}
