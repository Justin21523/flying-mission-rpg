import type { CompanionAiState } from '../../../types/game/support';

export function nextAiState(current: CompanionAiState, hasAssistTask: boolean, tooClose: boolean, stuck: boolean): CompanionAiState {
  if (stuck) return 'return-to-safe-zone';
  if (hasAssistTask) return 'assist-objective';
  if (tooClose) return 'avoid-obstacle';
  if (current === 'idle') return 'follow-player';
  return current;
}
