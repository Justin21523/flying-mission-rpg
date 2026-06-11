import { create } from 'zustand';
import type { GamePhase, GameState } from '../../types/game/state';
import {
  INITIAL_GAME_STATE,
  transition,
  pause as fsmPause,
  resume as fsmResume,
  fail as fsmFail,
  devJump,
} from '../../game/core/GameStateMachine';
import { gameEventBus } from '../../game/core/EventBus';

// Holds the GameState; all flow delegates to the pure GameStateMachine. As a module singleton it never
// resets on React re-render. Actions return nothing-but-the-FSM-decided next state.
interface GameStore extends GameState {
  requestTransition: (to: GamePhase) => boolean; // validated; false (+ console warn) on illegal move
  pause: () => void;
  resume: () => void;
  jumpTo: (to: GamePhase, previousPhase?: GamePhase | null) => void; // dev console only — bypasses validation
  failTo: (reason: string) => void;
  reset: () => void;
}

function snapshot(s: GameState): GameState {
  return { phase: s.phase, previousPhase: s.previousPhase, paused: s.paused, error: s.error };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_GAME_STATE,

  requestTransition: (to) => {
    const from = get().phase;
    const res = transition(snapshot(get()), to);
    if (!res.ok) {
      console.warn(`[GameStateMachine] ${res.reason}`);
      gameEventBus.emit('phase:blocked', { from, to, reason: res.reason ?? '' });
      return false;
    }
    set(res.state);
    gameEventBus.emit('phase:changed', { from, to: res.state.phase });
    return true;
  },

  pause: () => {
    const res = fsmPause(snapshot(get()));
    if (res.ok) set(res.state);
  },

  resume: () => {
    const from = get().phase;
    const res = fsmResume(snapshot(get()));
    if (res.ok) {
      set(res.state);
      gameEventBus.emit('phase:changed', { from, to: res.state.phase });
    }
  },

  jumpTo: (to, previousPhase) => {
    const from = get().phase;
    set(devJump(snapshot(get()), to, previousPhase));
    gameEventBus.emit('phase:changed', { from, to });
  },

  failTo: (reason) => set(fsmFail(snapshot(get()), reason)),

  reset: () => set({ ...INITIAL_GAME_STATE }),
}));
