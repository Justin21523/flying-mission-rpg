// Advanced Mission Zone (New Batch A) — the data-driven progression skeleton for the post-landing
// overhaul. A location's landing area becomes a Mission Zone made of ordered Zone Segments; each segment
// is gated by entry/completion conditions. This batch only ships the framework (markers, placeholder and
// objective-backed conditions) — enemies, skills, bosses and AI incidents hang off it in later batches.
//
// Conventions: zone + segment definitions are editor collections (createEditorCollection). Conditions and
// markers are nested INSIDE the segment object (edited inline in the 🎯 Mission Zone tab), mirroring how
// DestinationPart embeds its fields. Runtime progress lives in useAdvancedMissionZoneStore.

export type ZoneMode = 'linear' | 'semi-linear' | 'hub-branch';

export type ZoneSegmentType =
  | 'landing'
  | 'exploration'
  | 'combat-placeholder'
  | 'rescue'
  | 'repair'
  | 'supply'
  | 'incident'
  | 'elite-placeholder'
  | 'boss-placeholder'
  | 'boss'
  | 'extraction';

export const ZONE_SEGMENT_TYPES: readonly ZoneSegmentType[] = [
  'landing',
  'exploration',
  'combat-placeholder',
  'rescue',
  'repair',
  'supply',
  'incident',
  'elite-placeholder',
  'boss-placeholder',
  'boss',
  'extraction',
];

export type ZoneMarkerType =
  | 'entry'
  | 'objective'
  | 'next-segment'
  | 'supply'
  | 'incident'
  | 'core';

export const ZONE_MARKER_TYPES: readonly ZoneMarkerType[] = ['entry', 'objective', 'next-segment', 'supply', 'incident', 'core'];

export interface ZoneMarkerDefinition {
  id: string;
  type: ZoneMarkerType;
  label?: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  radius?: number; // reach / interaction radius (default 3)
  color?: string;
}

export interface ZoneBoundsDefinition {
  center: [number, number, number];
  size: [number, number, number];
}

// Discriminated union of completion / entry conditions. Each carries an `id` so runtime progress can be
// keyed per-condition. `future-*` variants are intentional placeholders for later batches (combat etc.) —
// the evaluator treats them as never-satisfied in play, but they validate as known placeholders.
export type ZoneConditionDefinition =
  | { id: string; type: 'always' }
  | { id: string; type: 'reach-marker'; markerId: string; radius: number }
  | { id: string; type: 'interact-with-object'; objectId: string }
  | { id: string; type: 'complete-existing-objective'; objectiveId: string }
  | { id: string; type: 'wait-seconds'; seconds: number }
  | { id: string; type: 'debug-complete' }
  | { id: string; type: 'placeholder-clear-area'; areaId: string }
  | { id: string; type: 'segment-completed'; segmentId: string }
  // Batch C — real enemy/obstacle conditions (the future-* variants below remain as aliases).
  | { id: string; type: 'defeat-enemy-group'; enemyGroupId: string }
  | { id: string; type: 'destroy-obstacle'; obstacleId: string }
  | { id: string; type: 'clear-obstacle'; obstacleId: string }
  | { id: string; type: 'repair-device'; deviceId: string }
  | { id: string; type: 'future-defeat-enemy-group'; enemyGroupId: string }
  | { id: string; type: 'future-destroy-obstacle'; obstacleId: string }
  | { id: string; type: 'future-repair-device'; deviceId: string }
  | { id: string; type: 'future-resolve-incident'; incidentId: string }
  | { id: string; type: 'future-defeat-boss'; bossId: string }
  // Batch E — support-combat conditions (completed by companion support abilities).
  | { id: string; type: 'use-support-ability'; abilityId: string; targetId?: string }
  | { id: string; type: 'support-repair-device'; deviceId: string }
  | { id: string; type: 'support-clear-obstacle'; obstacleId: string }
  | { id: string; type: 'support-scan-target'; targetId: string }
  | { id: string; type: 'support-protect-area'; areaId: string; seconds: number }
  // Batch F — boss-encounter conditions (completed by the BossDirector).
  | { id: string; type: 'defeat-boss'; bossId: string }
  | { id: string; type: 'complete-boss-phase'; bossId: string; phaseId: string }
  | { id: string; type: 'destroy-boss-weakpoint'; bossId: string; weakpointId: string }
  | { id: string; type: 'clear-boss-summon-wave'; bossId: string; waveId: string }
  // Batch G — AI incident conditions (completed by the AIIncidentDirector via IncidentZoneAdapter).
  | { id: string; type: 'resolve-incident'; incidentId: string }
  | { id: string; type: 'complete-incident-objective'; incidentId: string; objectiveStepId: string }
  | { id: string; type: 'incident-success'; incidentId: string }
  | { id: string; type: 'incident-failed'; incidentId: string };

export type ZoneConditionType = ZoneConditionDefinition['type'];

export const ZONE_CONDITION_TYPES: readonly ZoneConditionType[] = [
  'always',
  'reach-marker',
  'interact-with-object',
  'complete-existing-objective',
  'wait-seconds',
  'debug-complete',
  'placeholder-clear-area',
  'segment-completed',
  'defeat-enemy-group',
  'destroy-obstacle',
  'clear-obstacle',
  'repair-device',
  'future-defeat-enemy-group',
  'future-destroy-obstacle',
  'future-repair-device',
  'future-resolve-incident',
  'future-defeat-boss',
  'use-support-ability',
  'support-repair-device',
  'support-clear-obstacle',
  'support-scan-target',
  'support-protect-area',
  'defeat-boss',
  'complete-boss-phase',
  'destroy-boss-weakpoint',
  'clear-boss-summon-wave',
  'resolve-incident',
  'complete-incident-objective',
  'incident-success',
  'incident-failed',
];

// Condition types that are deliberately not satisfiable yet (placeholders for future combat/incident
// batches). In play they only complete via god-mode / debug-complete.
export const FUTURE_CONDITION_TYPES: readonly ZoneConditionType[] = [
  'future-defeat-enemy-group',
  'future-destroy-obstacle',
  'future-repair-device',
  'future-resolve-incident',
  'future-defeat-boss',
];

export interface ZoneAiIncidentHooks {
  onZoneStart?: string[];
  onSegmentEnter?: string[];
  onSegmentComplete?: string[];
  onZoneComplete?: string[];
}

export interface ZoneRewardDefinition {
  type: 'coins' | 'exp' | 'flag';
  value?: number;
  flag?: string;
}

export interface ZoneSegmentDefinition {
  id: string;
  zoneId: string;
  name: string;
  description?: string;
  order: number;
  segmentType: ZoneSegmentType;

  bounds?: ZoneBoundsDefinition;

  entryConditions: ZoneConditionDefinition[];
  completionConditions: ZoneConditionDefinition[];

  nextSegmentIds: string[];
  previousSegmentIds?: string[];

  allowBacktracking?: boolean;
  lockPlayerUntilComplete?: boolean;
  final?: boolean;

  // Placeholder hooks into existing systems (kept as ids only — no rewrite of those systems this batch).
  objectiveIds?: string[];
  npcPlacementIds?: string[];
  incidentTemplateIds?: string[];
  placeholderEnemyGroupIds?: string[];
  placeholderObstacleIds?: string[];
  supplyStationIds?: string[];

  markers: ZoneMarkerDefinition[];
  aiIncidentHooks?: ZoneAiIncidentHooks;

  enabled: boolean;

  editorMeta?: {
    authorNotes?: string;
    color?: string;
    icon?: string;
    debugLabel?: string;
  };
}

export interface MissionZoneDefinition {
  id: string;
  missionId?: string;
  locationId: string;

  name: string;
  description?: string;

  // Authored order of segments belonging to this zone. The actual segment records live in the segment
  // store (keyed by zoneId); this list also encodes display order.
  segmentIds: string[];
  startSegmentId: string;
  finalSegmentIds: string[];

  zoneMode: ZoneMode;

  defaultRespawnSegmentId?: string;
  allowBacktracking: boolean;

  recommendedCharacterIds?: string[];
  recommendedRoleTags?: string[];

  incidentTemplateIds?: string[];
  aiIncidentHooks?: ZoneAiIncidentHooks;
  linkedDestinationLayoutId?: string;

  completionRewards?: ZoneRewardDefinition[];

  enabled: boolean;

  editorMeta?: {
    authorNotes?: string;
    difficulty?: 'easy' | 'normal' | 'hard';
    themeColor?: string;
    tags?: string[];
  };
}

// ---- Runtime ----

export type MissionZoneStatus =
  | 'inactive'
  | 'loading'
  | 'active'
  | 'segment-complete'
  | 'complete'
  | 'failed'
  | 'cancelled';

export interface ZoneConditionProgress {
  conditionId: string;
  done: boolean;
  current: number;
  total: number;
  startedAtMs?: number; // for wait-seconds
}

export interface ZoneRuntimeState {
  activeZoneId?: string;
  activeSegmentId?: string;

  completedSegmentIds: string[];
  unlockedSegmentIds: string[];
  failedSegmentIds: string[];

  currentConditionProgress: Record<string, ZoneConditionProgress>;

  zoneStartedAtMs?: number;
  segmentStartedAtMs?: number;

  lastCompletedSegmentId?: string;
  pendingNextSegmentIds: string[];

  missionZoneStatus: MissionZoneStatus;

  debug: {
    godMode: boolean;
    forceUnlockAllSegments: boolean;
    allowManualComplete: boolean;
  };
}

// Validation result shared by the editor tab + tests.
export interface ZoneValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}
