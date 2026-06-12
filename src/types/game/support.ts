import type { MissionObjectiveKind, MissionRuntime } from './mission';
import type { GamePhase } from './state';

export type CharacterPresenceTier = 'active' | 'standby' | 'remote';
export const CHARACTER_PRESENCE_TIERS: readonly CharacterPresenceTier[] = ['active', 'standby', 'remote'];

export type SupportDispatchStatus =
  | 'available'
  | 'queued'
  | 'launching'
  | 'flying'
  | 'transforming'
  | 'arriving'
  | 'active-at-scene'
  | 'standby-at-scene'
  | 'remote-support'
  | 'returning'
  | 'unavailable';

export const SUPPORT_DISPATCH_STATUSES: readonly SupportDispatchStatus[] = [
  'available',
  'queued',
  'launching',
  'flying',
  'transforming',
  'arriving',
  'active-at-scene',
  'standby-at-scene',
  'remote-support',
  'returning',
  'unavailable',
];

export type SupportDispatchMode = 'full-control' | 'quick-simulated';
export const SUPPORT_DISPATCH_MODES: readonly SupportDispatchMode[] = ['full-control', 'quick-simulated'];

export type SupportAbilityTag =
  | 'engineering'
  | 'rescue'
  | 'scouting'
  | 'speed'
  | 'transport'
  | 'medical'
  | 'water'
  | 'air-control'
  | 'repair'
  | 'search'
  | 'heavy-lift';

export const SUPPORT_ABILITY_TAGS: readonly SupportAbilityTag[] = [
  'engineering',
  'rescue',
  'scouting',
  'speed',
  'transport',
  'medical',
  'water',
  'air-control',
  'repair',
  'search',
  'heavy-lift',
];

export type CompanionAiState =
  | 'idle'
  | 'follow-player'
  | 'standby'
  | 'move-to-point'
  | 'face-player'
  | 'face-npc'
  | 'assist-objective'
  | 'use-ability'
  | 'avoid-obstacle'
  | 'return-to-safe-zone'
  | 'returning-base';

export const COMPANION_AI_STATES: readonly CompanionAiState[] = [
  'idle',
  'follow-player',
  'standby',
  'move-to-point',
  'face-player',
  'face-npc',
  'assist-objective',
  'use-ability',
  'avoid-obstacle',
  'return-to-safe-zone',
  'returning-base',
];

export interface SupportDispatchProfile {
  id: string;
  characterId: string;
  canBeDispatched: boolean;
  defaultDispatchMode: SupportDispatchMode;
  abilities: SupportAbilityTag[];
  recommendedObjectiveTypes: string[];
  unsuitableObjectiveTypes?: string[];
  baseDispatchDelaySeconds: number;
  launchDurationSeconds: number;
  flightDurationSeconds: number;
  transformDurationSeconds: number;
  arrivalDurationSeconds: number;
  quickModeTotalSeconds: number;
  aiProfileId: string;
  activeTierCost: number;
  standbyTierCost: number;
  maxSimultaneousInstances?: number;
  editorMeta?: {
    notes?: string;
    displayColor?: string;
    cardBadge?: string;
  };
}

export interface SupportAiProfile {
  id: string;
  name: string;
  followDistance: number;
  standbyDistance: number;
  avoidanceRadius: number;
  moveSpeed: number;
  assistBehaviorEnabled: boolean;
  stuckTimeoutSeconds: number;
  repositionFallbackEnabled: boolean;
}

export interface MultiCharacterLimitConfig {
  maxActiveCharacters: number;
  maxStandbyCharacters: number;
  aiTickRateActive: number;
  aiTickRateStandby: number;
  remoteUpdateIntervalSeconds: number;
  autoDemoteWhenOverLimit: boolean;
}

export interface ControlOwnershipState {
  controlledCharacterId: string | null;
  previousControlledCharacterId?: string;
  inputOwnerId: string | null;
  cameraOwnerId: string | null;
  hudFocusCharacterId: string | null;
  switching: boolean;
}

export interface CharacterPresence {
  characterId: string;
  tier: CharacterPresenceTier;
  aiState: CompanionAiState;
  position: [number, number, number];
  heading: number;
  controllerActive: boolean;
  colliderActive: boolean;
  missionContribution?: string;
  // ── autonomous-AI task state (runtime) ──
  taskObjectiveId?: string;       // the mission objective this companion is currently working
  taskTarget?: [number, number];  // its world [x, z] (resolved from the objective's destination part / NPC)
  workElapsed?: number;           // seconds spent "working" at the objective (→ complete past WORK_TIME)
}

export interface SupportDispatchEntry {
  characterId: string;
  mode: SupportDispatchMode;
  status: SupportDispatchStatus;
  requestedAtMs: number;
  stageStartedAtMs: number;
  elapsedSeconds: number;
  etaSeconds: number;
  paused: boolean;
  cancelled: boolean;
  arrivedAtMs?: number;
}

export interface SupportDestinationSnapshot {
  evaluation: {
    safe: boolean;
    quality: 'perfect' | 'good' | 'rough' | 'unsafe';
    reasons: string[];
    verticalSpeed: number;
    horizontalSpeed: number;
    zoneId?: string;
  } | null;
  prompt: string | null;
  carryingId: string | null;
  collectedIds: string[];
}

export interface FullControlDispatchContext {
  dispatchCharacterId: string;
  originControlledCharacterId: string;
  originPhase: GamePhase;
  originMissionId: string | null;
  originMissionRuntime: MissionRuntime | null;
  originDestination: SupportDestinationSnapshot;
  originPresences: CharacterPresence[];
  originRobotPosition: [number, number, number];
  originRobotHeading: number;
  returnPhase: GamePhase;
  startedAtMs: number;
  returning: boolean;
}

export interface SupportAssistEvent {
  characterId: string;
  objectiveKind: MissionObjectiveKind;
  objectiveId?: string;
  ability: SupportAbilityTag;
  progress: number;
  canComplete: boolean;
}

export type SupportRuntimeEvent =
  | { type: 'support-requested'; characterId: string; mode: SupportDispatchMode }
  | { type: 'support-dispatch-stage-changed'; characterId: string; status: SupportDispatchStatus }
  | { type: 'support-arrival-estimate-updated'; characterId: string; etaSeconds: number }
  | { type: 'support-arrived'; characterId: string }
  | { type: 'support-cancelled'; characterId: string; reason?: string }
  | { type: 'support-promoted-to-active'; characterId: string }
  | { type: 'support-demoted-to-standby'; characterId: string }
  | { type: 'support-demoted-to-remote'; characterId: string }
  | { type: 'control-switched'; fromCharacterId: string; toCharacterId: string };

export interface SupportMember {
  characterId: string;
  status: CharacterPresenceTier;
  etaSec?: number;
}
