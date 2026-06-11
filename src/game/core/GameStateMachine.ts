import type { GamePhase, GameState } from '../../types/game/state';

// The single source of legal flow. Pure + React-free so it is trivially unit-testable and never resets
// on re-render. PAUSED and ERROR are handled specially (pause/resume/fail) rather than via this table.
export const TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  BOOT: ['MISSION_CONTROL'],
  MISSION_CONTROL: ['MISSION_BRIEFING'],
  MISSION_BRIEFING: ['CHARACTER_SELECTION', 'MISSION_CONTROL'],
  CHARACTER_SELECTION: ['HANGAR', 'MISSION_BRIEFING'],
  HANGAR: ['PLATFORM_ALIGNMENT'],
  PLATFORM_ALIGNMENT: ['LAUNCH_PREPARATION', 'HANGAR'],
  LAUNCH_PREPARATION: ['LAUNCH_TUNNEL'],
  LAUNCH_TUNNEL: ['BASE_FLY_AROUND'],
  BASE_FLY_AROUND: ['CLOUD_ASCENT'],
  CLOUD_ASCENT: ['WORLD_FLIGHT'],
  WORLD_FLIGHT: ['DESTINATION_APPROACH'],
  DESTINATION_APPROACH: ['TRANSFORMATION'],
  TRANSFORMATION: ['DESCENT'],
  DESCENT: ['LANDING'],
  LANDING: ['NPC_GREETING'],
  NPC_GREETING: ['MISSION_GAMEPLAY'],
  MISSION_GAMEPLAY: ['SUPPORT_SELECTION', 'MISSION_COMPLETE', 'HANGAR'],
  SUPPORT_SELECTION: ['MISSION_GAMEPLAY', 'HANGAR'],
  MISSION_COMPLETE: ['RETURN_TRANSFORMATION'],
  RETURN_TRANSFORMATION: ['RETURN_FLIGHT'],
  RETURN_FLIGHT: ['BASE_APPROACH'],
  BASE_APPROACH: ['HANGAR_RETURN'],
  HANGAR_RETURN: ['MISSION_RESULTS'],
  MISSION_RESULTS: ['MISSION_CONTROL'],
  PAUSED: [], // leaving PAUSED goes through resume()
  ERROR: ['BOOT', 'MISSION_CONTROL'], // recoverable — never a dead end
};

export const INITIAL_GAME_STATE: GameState = {
  phase: 'BOOT',
  previousPhase: null,
  paused: false,
  error: null,
};

export interface TransitionResult {
  ok: boolean;
  state: GameState;
  reason?: string;
}

export function canTransition(from: GamePhase, to: GamePhase): boolean {
  return TRANSITIONS[from].includes(to);
}

// Validated transition. On an illegal move the state is returned unchanged with a clear reason (the
// caller logs / surfaces it). Records previousPhase so the dev console + resume work.
export function transition(state: GameState, to: GamePhase): TransitionResult {
  if (state.paused) {
    return { ok: false, state, reason: `Cannot transition while PAUSED — resume first (tried ${state.phase} → ${to}).` };
  }
  if (!canTransition(state.phase, to)) {
    const allowed = TRANSITIONS[state.phase].join(', ') || '(none)';
    return { ok: false, state, reason: `Illegal transition ${state.phase} → ${to}. Allowed: ${allowed}.` };
  }
  return { ok: true, state: { ...state, previousPhase: state.phase, phase: to, error: null } };
}

export function pause(state: GameState): TransitionResult {
  if (state.paused || state.phase === 'PAUSED') return { ok: false, state, reason: 'Already paused.' };
  return { ok: true, state: { ...state, paused: true, previousPhase: state.phase, phase: 'PAUSED' } };
}

export function resume(state: GameState): TransitionResult {
  if (!state.paused || state.previousPhase == null) return { ok: false, state, reason: 'Not paused.' };
  return { ok: true, state: { ...state, paused: false, phase: state.previousPhase, previousPhase: 'PAUSED' } };
}

export function fail(state: GameState, reason: string): GameState {
  return { ...state, previousPhase: state.phase, phase: 'ERROR', error: reason, paused: false };
}

// Dev-only: jump to any phase, bypassing validation. The debug scenario console may provide a previous
// phase override so resume/history testing can start from a realistic state.
export function devJump(state: GameState, to: GamePhase, previousPhase?: GamePhase | null): GameState {
  return { ...state, previousPhase: previousPhase ?? state.phase, phase: to, paused: false, error: null };
}
