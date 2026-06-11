import type { SourceConfidence } from '../sourceConfidence';
import type { FlightDifficulty, WeatherKind } from './flight';
import type { AbilityKind } from './character';
import type { DialogueCondition, DialogueEffect } from '../dialogue'; // reuse the POLI condition/effect engine

// Child-friendly, non-combat mission archetypes (PDF Batch 7: carry an item / find a lost thing /
// start-or-repair a device). Re-themed "encounters" are never combat.
export type MissionType = 'delivery' | 'find_lost' | 'repair';
export const MISSION_TYPES: readonly MissionType[] = ['delivery', 'find_lost', 'repair'];

export type MissionObjectiveKind = 'carry' | 'find' | 'activate' | 'reach' | 'talk' | 'hunt';
export const MISSION_OBJECTIVE_KINDS: readonly MissionObjectiveKind[] = [
  'carry',
  'find',
  'activate',
  'reach',
  'talk',
  'hunt',
];

export interface MissionObjective {
  id: string;
  kind: MissionObjectiveKind;
  description: string;
  targetCount: number;
  optional?: boolean;
  // ── destination bindings (Batch 7) — reference destination-part ids; all Edit-Mode editable ──
  targetObjectIds?: string[]; // carry item(s) / lost item(s) / repair device(s) / reach markers / NPC ids
  dropoffZoneId?: string; // carry: where to deliver
  miniGameId?: string; // activate/repair: the Phaser mini-game that completes it
  hintText?: string; // optional HUD hint (e.g. search area description)
  completeEffects?: DialogueEffect[]; // fired once when THIS objective completes (Mission Studio)
}

// Structured mission reward (Mission Studio) — a friendly POLI-style reward row. Coins go through walletStore;
// the rest compile to the POLI DialogueEffect engine (see game/missions/missionRewards.ts).
export type MissionRewardType = 'item' | 'coins' | 'worldFlag' | 'trust' | 'unlockTool';
export const MISSION_REWARD_TYPES: readonly MissionRewardType[] = ['item', 'coins', 'worldFlag', 'trust', 'unlockTool'];
export interface MissionReward {
  id: string;
  type: MissionRewardType;
  amount?: number; // coins / item quantity / trust amount
  targetId?: string; // itemId / flag / toolId
  characterId?: string; // trust target
}

// Authored mission template (data-driven). Failure is always recoverable downstream (no permadeath).
export interface MissionDefinition {
  id: string;
  name: string;
  sourceConfidence: SourceConfidence;
  type: MissionType;
  locationId: string;
  npcId?: string;
  routeId?: string;
  modelAssetId?: string; // optional GLB marker for the mission's objective/site
  difficulty: FlightDifficulty;
  weather: WeatherKind;
  recommendedAbility?: AbilityKind;
  recommendedCharacterIds: string[];
  summary: string;
  objectives: MissionObjective[];
  ordered?: boolean; // objectives must be completed in order (earlier required ones first)
  // ── complexity (Mission Studio) — reuse the POLI dialogue condition/effect unions ──
  prerequisites?: DialogueCondition[]; // ALL must pass for the mission to be offerable / startable
  requiredMissionIds?: string[]; // these missions must be complete first (compiled to done-flag conditions)
  nextMissionIds?: string[]; // missions this one leads into (shown in the flow preview; unlocked via done flag)
  rewards?: MissionReward[]; // structured rewards applied on completion
  completionEffects?: DialogueEffect[]; // advanced: raw effects fired once when the mission completes
}

export type MissionStatus = 'pending' | 'active' | 'complete' | 'failed';
export const MISSION_STATUSES: readonly MissionStatus[] = ['pending', 'active', 'complete', 'failed'];

export interface MissionObjectiveProgress {
  done: boolean;
  count: number;
}

// Runtime state for the active mission (kept in useMissionStore, not in the template).
export interface MissionRuntime {
  missionId: string;
  status: MissionStatus;
  objectiveProgress: Record<string, MissionObjectiveProgress>;
  startedAtMs: number | null;
  usedSupportCount: number;
}
