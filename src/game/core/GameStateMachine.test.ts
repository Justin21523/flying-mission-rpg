import { describe, it, expect } from 'vitest';
import {
  INITIAL_GAME_STATE,
  TRANSITIONS,
  canTransition,
  transition,
  pause,
  resume,
  fail,
  devJump,
} from './GameStateMachine';
import { GAME_PHASES } from '../../types/game/state';
import type { GamePhase, GameState } from '../../types/game/state';

const at = (phase: GamePhase, extra: Partial<GameState> = {}): GameState => ({ ...INITIAL_GAME_STATE, phase, ...extra });

describe('GameStateMachine', () => {
  it('allows a legal transition and records previousPhase', () => {
    const r = transition(at('BOOT'), 'MISSION_CONTROL');
    expect(r.ok).toBe(true);
    expect(r.state.phase).toBe('MISSION_CONTROL');
    expect(r.state.previousPhase).toBe('BOOT');
  });

  it('blocks an illegal transition with a clear reason and unchanged state', () => {
    const r = transition(at('BOOT'), 'WORLD_FLIGHT');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/Illegal transition/);
    expect(r.state.phase).toBe('BOOT');
  });

  it('canTransition reflects the table', () => {
    expect(canTransition('MISSION_GAMEPLAY', 'MISSION_COMPLETE')).toBe(true);
    expect(canTransition('MISSION_GAMEPLAY', 'HANGAR')).toBe(true);
    expect(canTransition('SUPPORT_SELECTION', 'HANGAR')).toBe(true);
    expect(canTransition('MISSION_GAMEPLAY', 'BOOT')).toBe(false);
  });

  it('pause then resume restores the previous phase', () => {
    const p = pause(at('WORLD_FLIGHT'));
    expect(p.ok).toBe(true);
    expect(p.state.phase).toBe('PAUSED');
    const r = resume(p.state);
    expect(r.ok).toBe(true);
    expect(r.state.phase).toBe('WORLD_FLIGHT');
    expect(r.state.paused).toBe(false);
  });

  it('cannot transition while paused', () => {
    const p = pause(at('WORLD_FLIGHT'));
    const r = transition(p.state, 'DESTINATION_APPROACH');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/PAUSED/);
  });

  it('fail moves to a recoverable ERROR', () => {
    const e = fail(at('WORLD_FLIGHT'), 'boom');
    expect(e.phase).toBe('ERROR');
    expect(e.error).toBe('boom');
    expect(canTransition('ERROR', 'MISSION_CONTROL')).toBe(true);
  });

  it('devJump bypasses validation', () => {
    const s = devJump(at('BOOT'), 'TRANSFORMATION');
    expect(s.phase).toBe('TRANSFORMATION');
    expect(s.previousPhase).toBe('BOOT');
  });

  it('devJump can record an explicit previous phase for scenario testing', () => {
    const s = devJump(at('BOOT'), 'MISSION_GAMEPLAY', 'NPC_GREETING');
    expect(s.phase).toBe('MISSION_GAMEPLAY');
    expect(s.previousPhase).toBe('NPC_GREETING');
  });

  it('can walk the full canonical loop back to MISSION_CONTROL', () => {
    let state = at('MISSION_CONTROL');
    const path: GamePhase[] = [
      'MISSION_BRIEFING', 'CHARACTER_SELECTION', 'HANGAR', 'PLATFORM_ALIGNMENT', 'LAUNCH_PREPARATION',
      'LAUNCH_TUNNEL', 'BASE_FLY_AROUND', 'CLOUD_ASCENT', 'WORLD_FLIGHT', 'DESTINATION_APPROACH',
      'TRANSFORMATION', 'DESCENT', 'LANDING', 'NPC_GREETING', 'MISSION_GAMEPLAY', 'MISSION_COMPLETE',
      'RETURN_TRANSFORMATION', 'RETURN_FLIGHT', 'BASE_APPROACH', 'HANGAR_RETURN', 'MISSION_RESULTS',
      'MISSION_CONTROL',
    ];
    for (const to of path) {
      const r = transition(state, to);
      expect(r.ok, `expected ${state.phase} → ${to} to be legal`).toBe(true);
      state = r.state;
    }
    expect(state.phase).toBe('MISSION_CONTROL');
  });

  it('every phase has a transitions entry (table is exhaustive)', () => {
    for (const p of GAME_PHASES) expect(Array.isArray(TRANSITIONS[p])).toBe(true);
  });
});
