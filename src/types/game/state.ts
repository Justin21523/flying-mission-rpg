// The strongly-typed game phases — the spine of the whole dispatch loop (launch → flight → transform →
// land → mission → return). All ~30 phases live here; the GameStateMachine owns the legal transitions.
// No scattered booleans drive flow — only `GameState.phase`.
export type GamePhase =
  | 'BOOT'
  | 'MISSION_CONTROL'
  | 'MISSION_BRIEFING'
  | 'CHARACTER_SELECTION'
  | 'HANGAR'
  | 'PLATFORM_ALIGNMENT'
  | 'LAUNCH_PREPARATION'
  | 'LAUNCH_TUNNEL'
  | 'BASE_FLY_AROUND'
  | 'CLOUD_ASCENT'
  | 'WORLD_FLIGHT'
  | 'DESTINATION_APPROACH'
  | 'TRANSFORMATION'
  | 'DESCENT'
  | 'LANDING'
  | 'NPC_GREETING'
  | 'MISSION_GAMEPLAY'
  | 'ADVANCED_MISSION_ZONE'
  | 'ZONE_SEGMENT_GAMEPLAY'
  | 'ZONE_COMPLETE'
  | 'SUPPORT_SELECTION'
  | 'MISSION_COMPLETE'
  | 'RETURN_TRANSFORMATION'
  | 'RETURN_FLIGHT'
  | 'BASE_APPROACH'
  | 'HANGAR_RETURN'
  | 'MISSION_RESULTS'
  | 'ARENA_RUN' // Batch N — Endless / Roguelite arena run (outside the campaign zone system)
  | 'PAUSED'
  | 'ERROR';

export const GAME_PHASES: readonly GamePhase[] = [
  'BOOT',
  'MISSION_CONTROL',
  'MISSION_BRIEFING',
  'CHARACTER_SELECTION',
  'HANGAR',
  'PLATFORM_ALIGNMENT',
  'LAUNCH_PREPARATION',
  'LAUNCH_TUNNEL',
  'BASE_FLY_AROUND',
  'CLOUD_ASCENT',
  'WORLD_FLIGHT',
  'DESTINATION_APPROACH',
  'TRANSFORMATION',
  'DESCENT',
  'LANDING',
  'NPC_GREETING',
  'MISSION_GAMEPLAY',
  'ADVANCED_MISSION_ZONE',
  'ZONE_SEGMENT_GAMEPLAY',
  'ZONE_COMPLETE',
  'SUPPORT_SELECTION',
  'MISSION_COMPLETE',
  'RETURN_TRANSFORMATION',
  'RETURN_FLIGHT',
  'BASE_APPROACH',
  'HANGAR_RETURN',
  'MISSION_RESULTS',
  'ARENA_RUN',
  'PAUSED',
  'ERROR',
];

export interface GameState {
  phase: GamePhase;
  previousPhase: GamePhase | null; // restored on resume from PAUSED; also shown in the dev console
  paused: boolean;
  error: string | null; // populated when phase === 'ERROR'
}
