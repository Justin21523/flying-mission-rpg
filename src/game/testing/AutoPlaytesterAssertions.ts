import type { GamePhase } from '../../types/game/state';
import { CORE_FLOW_ORDER } from './AutoPlaytesterStateMachine';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';

// Batch 13 — per-phase sanity checks for the real game. From HANGAR onward a mission + character must be
// selected; returns a failure reason string or null when OK.
const HANGAR_INDEX = CORE_FLOW_ORDER.indexOf('HANGAR');

export function realAssert(phase: GamePhase): string | null {
  const i = CORE_FLOW_ORDER.indexOf(phase);
  if (i >= HANGAR_INDEX) {
    if (!useMissionStore.getState().currentMissionId) return 'no mission selected';
    if (!useCharacterStore.getState().selectedCharacterId) return 'no character selected';
  }
  return null;
}
