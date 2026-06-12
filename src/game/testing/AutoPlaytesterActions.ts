import type { GamePhase } from '../../types/game/state';
import type { AutoWorld } from './AutoPlaytester';
import { realAssert } from './AutoPlaytesterAssertions';
import { useGameStore } from '../../stores/game/useGameStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorMissions } from '../../stores/game/editorMissionStore';
import { getSaveData } from '../../stores/useSaveStore';
import { devJumpU } from '../../game/flight/world/worldFlightDev';
import { transformationDev } from '../../game/transformation/transformationDev';

// Batch 13 — the real AutoWorld: drives the live game through正式 store actions, synthetic keyboard events
// (真實輸入 for the 3D controllers), and the existing debug fast-forward hooks (worldFlightDev /
// transformationDev). Used by the AutoPlaytester at runtime; debug/test only.

function pressKey(code: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
  setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })), 180);
}

export const realWorld: AutoWorld = {
  phase: () => useGameStore.getState().phase,
  go: (to: GamePhase) => useGameStore.getState().requestTransition(to),

  ensureMissionSelected: () => {
    const ms = useMissionStore.getState();
    if (ms.currentMissionId) return true;
    const m = getEditorMissions()[0];
    if (!m) return false;
    ms.selectMission(m.id);
    ms.beginMission(m);
    return true;
  },

  ensureCharacterSelected: () => {
    const cs = useCharacterStore.getState();
    if (cs.selectedCharacterId) return true;
    const id = getSaveData().progress.unlockedCharacterIds[0];
    if (!id) return false;
    cs.selectCharacter(id);
    return true;
  },

  pressForward: () => pressKey('KeyW'),
  fastForwardWorldFlight: () => devJumpU(0.99), // debug-only fast-forward of the long route
  finishTransformation: () => { transformationDev.forceFinish = true; },

  completeObjective: () => {
    const ms = useMissionStore.getState();
    const rt = ms.runtime;
    if (!rt) return false;
    const firstId = Object.keys(rt.objectiveProgress)[0];
    if (firstId) ms.setObjective(firstId, true);
    return true;
  },

  assert: (phase) => realAssert(phase),
};
