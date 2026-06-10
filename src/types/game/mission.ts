import type { SourceConfidence } from '../sourceConfidence';
import type { FlightDifficulty, WeatherKind } from './flight';
import type { AbilityKind } from './character';

// Child-friendly, non-combat mission archetypes (PDF Batch 7: carry an item / find a lost thing /
// start-or-repair a device). Re-themed "encounters" are never combat.
export type MissionType = 'delivery' | 'find_lost' | 'repair';
export const MISSION_TYPES: readonly MissionType[] = ['delivery', 'find_lost', 'repair'];

export type MissionObjectiveKind = 'carry' | 'find' | 'activate' | 'reach' | 'talk';
export const MISSION_OBJECTIVE_KINDS: readonly MissionObjectiveKind[] = [
  'carry',
  'find',
  'activate',
  'reach',
  'talk',
];

export interface MissionObjective {
  id: string;
  kind: MissionObjectiveKind;
  description: string;
  targetCount: number;
  optional?: boolean;
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
  difficulty: FlightDifficulty;
  weather: WeatherKind;
  recommendedAbility?: AbilityKind;
  recommendedCharacterIds: string[];
  summary: string;
  objectives: MissionObjective[];
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
