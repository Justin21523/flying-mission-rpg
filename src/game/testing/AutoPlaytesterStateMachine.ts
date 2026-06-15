import type { GamePhase } from '../../types/game/state';

// Batch 13 — the core-flow order the AutoPlaytester drives through (one legal transition at a time — it
// never jumps straight to the end). Also the auto-status enum + a phase→next map used by the runner.

export type AutoStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

export const CORE_FLOW_ORDER: GamePhase[] = [
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
  'MISSION_COMPLETE',
];

// Advanced Mission Zone branch (New Batch A). Landing at a zone location routes LANDING → these phases
// instead of NPC_GREETING; both branches end at MISSION_COMPLETE. Kept OUT of the linear CORE_FLOW_ORDER
// (whose consecutive pairs must each be a legal FSM transition) — the runner tolerates them separately.
export const BRANCH_PHASES: ReadonlySet<GamePhase> = new Set<GamePhase>([
  'ADVANCED_MISSION_ZONE',
  'ZONE_SEGMENT_GAMEPLAY',
  'ZONE_COMPLETE',
]);

export const FINAL_PHASE: GamePhase = 'MISSION_COMPLETE';

/** The next phase the AutoPlaytester aims for after `phase`, or null if `phase` is the goal / off-path. */
export function nextCorePhase(phase: GamePhase): GamePhase | null {
  const i = CORE_FLOW_ORDER.indexOf(phase);
  if (i < 0 || i >= CORE_FLOW_ORDER.length - 1) return null;
  return CORE_FLOW_ORDER[i + 1];
}

/** Human-friendly auto-state label for the current phase (panel display). */
export function autoStateLabel(phase: GamePhase): string {
  return CORE_FLOW_ORDER.includes(phase) ? phase.toLowerCase().replace(/_/g, '-') : `off-path:${phase}`;
}
