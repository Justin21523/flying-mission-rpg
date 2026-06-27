// Elite Encounter + Boss Foundation (New Batch F) — the data-driven boss layer for the Advanced Mission
// Zone's final segment. A rich, BossDirector-driven model (phases / weakpoints / attack patterns / summon
// waves / arena) that supersedes the simple hp-threshold `BossPhaseDefinition` in `combat.ts` for NEW
// bosses (the legacy one stays for `boss_crystal_sentinel`). Boss + weakpoints register as hittable
// CombatTargets and resolve damage through the shared DamageResolver — no parallel damage logic.

import type { DamageableDefinition, DamageEventTemplate, HitVolumeDefinition } from './combat';

// ---- Boss ----

export type BossType =
  | 'core-sentinel'
  | 'elite-machine'
  | 'hazard-core'
  | 'shielded-guardian'
  | 'future-flying-boss'
  | 'future-multi-part-boss';

export const BOSS_TYPES: readonly BossType[] = [
  'core-sentinel', 'elite-machine', 'hazard-core', 'shielded-guardian', 'future-flying-boss', 'future-multi-part-boss',
];

export interface BossDefinition {
  id: string;
  name: string;
  bossType: BossType;

  zoneId: string;
  segmentId: string;
  arenaId: string;

  damageable: DamageableDefinition;

  phaseIds: string[];
  startPhaseId: string;
  finalPhaseIds: string[];

  weakpointIds: string[];
  attackPatternIds: string[];
  summonWaveIds?: string[];
  linkedObstacleIds?: string[];

  roleRecommendations?: {
    recommendedCharacterIds?: string[];
    recommendedSupportAbilityTypes?: string[];
    recommendedSkillTags?: string[];
  };

  completion: {
    zoneConditionId?: string;
    completeZoneOnDefeat: boolean;
    enterMissionCompleteOnDefeat: boolean;
    returnToBaseOnDefeat?: boolean;
  };

  visual: {
    modelPresetId: string;
    scale: [number, number, number];
    themeColor?: string;
    phaseVisualPresets?: Record<string, string>;
    defeatedVisualPresetId?: string;
  };

  // Batch E — dramatic entrance (title card + held beat before the fight) + an enrage timer.
  intro?: { title: string; subtitle?: string; durationSeconds: number; cinematicEffectId?: string };
  enrage?: { afterSeconds: number; damageMultiplier: number; cinematicEffectId?: string };

  // Wave 1 — a per-boss "signature mechanic" that runs on top of the shared phase/attack/weakpoint pipeline so
  // each boss has a memorable hook. Config is type-specific (intervalSeconds, damage, radius, healPerSec, …).
  signatureMechanic?: BossSignatureMechanic;

  editorMeta?: {
    notes?: string;
    difficulty?: 'easy' | 'normal' | 'hard';
    debugColor?: string;
  };
  enabled?: boolean;
}

// ---- Signature mechanic (Wave 1) ----

export type BossSignatureMechanicType =
  | 'moving-hazard-lasers' // periodic dodgeable strikes at the player's position
  | 'arena-flood' // periodic wide arena pulse (reach safety before it resolves)
  | 'blackout-pulse' // toggles arena darkness on/off
  | 'falling-debris' // telegraphed strikes that resolve where the player WAS
  | 'reflect-aegis' // boss regenerates shield while active (break the aegis repeatedly)
  | 'priority-healer' // summons a repair wisp; boss heals while it lives — kill it first
  | 'arena-shrink'; // safe zone shrinks over time; damage outside it

export const BOSS_SIGNATURE_MECHANIC_TYPES: readonly BossSignatureMechanicType[] = [
  'moving-hazard-lasers', 'arena-flood', 'blackout-pulse', 'falling-debris', 'reflect-aegis', 'priority-healer', 'arena-shrink',
];

export interface BossSignatureMechanic {
  id: string;
  type: BossSignatureMechanicType;
  activeInPhaseIds?: string[]; // empty/undefined = active all phases
  config: Record<string, number>; // intervalSeconds, damage, radius, warnSeconds, healPerSec, shieldRegenPerSec, enrageIntervalMult, baseRadius, minRadius, shrinkSeconds, maxHealers …
  enemyRef?: string; // e.g. the healer enemy id for priority-healer
  vfxId?: string; // optional telegraph / strike effect id
  enabled?: boolean;
}

// ---- Phase ----

export type BossPhaseStartCondition =
  | { type: 'on-boss-start' }
  | { type: 'boss-hp-below'; hpPercent: number }
  | { type: 'previous-phase-complete'; phaseId: string }
  | { type: 'debug-start' };

export type BossPhaseCompletionCondition =
  | { type: 'boss-hp-below'; hpPercent: number }
  | { type: 'destroy-weakpoint'; weakpointId: string }
  | { type: 'destroy-all-weakpoints'; weakpointIds: string[] }
  | { type: 'clear-summon-wave'; summonWaveId: string }
  | { type: 'clear-obstacle'; obstacleId: string }
  | { type: 'survive-seconds'; seconds: number }
  | { type: 'use-support-ability'; abilityId: string }
  | { type: 'debug-complete-phase' };

export const BOSS_PHASE_COMPLETION_TYPES: readonly BossPhaseCompletionCondition['type'][] = [
  'boss-hp-below', 'destroy-weakpoint', 'destroy-all-weakpoints', 'clear-summon-wave', 'clear-obstacle',
  'survive-seconds', 'use-support-ability', 'debug-complete-phase',
];

export interface BossPhaseDefinition {
  id: string;
  bossId: string;
  name: string;
  phaseIndex: number;

  startCondition: BossPhaseStartCondition;
  completionConditions: BossPhaseCompletionCondition[];

  enabledAttackPatternIds: string[];
  enabledWeakpointIds?: string[];
  enabledObstacleIds?: string[];
  enabledSummonWaveIds?: string[];
  enabledArenaHazardIds?: string[];

  bossModifiers?: {
    damageMultiplier?: number;
    defenseMultiplier?: number;
    moveSpeedMultiplier?: number;
    shieldRegenPerSecond?: number;
    invulnerableUntilWeakpointExposed?: boolean;
  };

  durationLimitSeconds?: number;
  nextPhaseIds: string[];

  editorMeta?: { notes?: string; phaseColor?: string };
}

// ---- Arena ----

export interface BossArenaDefinition {
  id: string;
  zoneId: string;
  segmentId: string;
  name: string;

  bounds: { center: [number, number, number]; size: [number, number, number] };

  entryMarkerId: string;
  bossSpawnPointId: string;
  playerStartPointId: string;
  exitMarkerId?: string;

  bossSpawnPosition: [number, number, number];
  playerStartPosition: [number, number, number];

  arenaLock: {
    lockOnStart: boolean;
    unlockOnBossDefeat: boolean;
    boundaryModelPresetId?: string;
  };

  hazardIds?: string[];
  supplyStationIds?: string[];
  supportBeaconIds?: string[];

  camera?: {
    useArenaCameraHints: boolean;
    focusTargetId?: string;
    minDistance?: number;
    maxDistance?: number;
  };

  editorMeta?: { notes?: string; debugColor?: string };
}

// ---- Weakpoint ----

export type WeakpointMarkerGeometry = 'sphere' | 'ring' | 'diamond' | 'crosshair';

export interface BossWeakpointDefinition {
  id: string;
  bossId: string;
  displayName: string;

  socketName?: string;
  fallbackPosition: [number, number, number];

  activeInPhaseIds: string[];

  damageable: DamageableDefinition;

  exposedRules: {
    initiallyExposed: boolean;
    exposeOnScan?: boolean;
    exposeOnSupportScan?: boolean;
    exposeOnShieldBreak?: boolean;
    exposeDurationSeconds?: number;
  };

  effectOnDestroyed: {
    damageBossAmount?: number;
    removeBossShield?: number;
    completePhaseConditionId?: string;
    disableAttackPatternId?: string;
    triggerNextPhase?: boolean;
  };

  validAttackTags?: string[];
  invalidAttackTags?: string[];

  visual: {
    hiddenPresetId: string;
    exposedPresetId: string;
    destroyedPresetId: string;
    markerGeometry: WeakpointMarkerGeometry;
    color?: string;
  };

  editorMeta?: { notes?: string };
}

// ---- Attack pattern ----

export type BossAttackPatternType =
  | 'sweep-beam'
  | 'ground-shockwave'
  | 'summon-wave'
  | 'shield-pulse'
  | 'targeted-projectile'
  | 'arena-hazard'
  | 'charge'
  | 'future-multi-part-attack';

export const BOSS_PATTERN_TYPES: readonly BossAttackPatternType[] = [
  'sweep-beam', 'ground-shockwave', 'summon-wave', 'shield-pulse', 'targeted-projectile', 'arena-hazard', 'charge', 'future-multi-part-attack',
];

export type BossAttackTargetType = 'player' | 'area' | 'support-decoy' | 'random-arena-point';

export interface BossAttackPatternDefinition {
  id: string;
  bossId: string;
  patternType: BossAttackPatternType;

  cooldownSeconds: number;
  castTimeSeconds: number;
  activeDurationSeconds: number;

  damageEventTemplate?: DamageEventTemplate;
  hitVolume: HitVolumeDefinition;

  warningVisualId?: string;
  executionVisualId?: string;
  projectileModelAssetId?: string;
  summonWaveId?: string;

  targetRules: {
    targetType: BossAttackTargetType;
    priority?: 'nearest' | 'highest-threat' | 'current-player' | 'random';
  };

  phaseIds: string[];

  counterplay?: {
    canBeBlocked?: boolean;
    canBeDodged?: boolean;
    canBeInterrupted?: boolean;
    interruptTags?: string[];
    recommendedDefenseTags?: string[];
  };

  editorMeta?: { notes?: string };
}

export type BossRuntimeAttackEvent = {
  id: string;
  bossId: string;
  phaseId?: string;
  patternId: string;
  patternType: BossAttackPatternType;
  kind: 'warning' | 'execute';
  atMs: number;
};

// ---- Summon wave ----

export type BossSummonWaveTrigger =
  | { type: 'on-phase-start' }
  | { type: 'boss-hp-below'; hpPercent: number }
  | { type: 'timer'; seconds: number }
  | { type: 'weakpoint-destroyed'; weakpointId: string };

export interface BossSummonWaveDefinition {
  id: string;
  bossId: string;
  phaseId: string;

  enemySpawnGroupIds: string[];
  trigger: BossSummonWaveTrigger;

  maxActiveEnemies?: number;
  completeWhenGroupsCleared: boolean;

  editorMeta?: { notes?: string };
}

// ---- Elite encounter (mini-boss placeholder) ----

export interface EliteEncounterDefinition {
  id: string;
  name: string;
  baseEnemyDefinitionId: string; // reuses a Batch C archetype enemy
  zoneId: string;
  segmentId: string;
  hpMultiplier: number;
  shieldMultiplier: number;
  weakpointId?: string;
  stunOnShieldBreakSeconds: number;
  linkedZoneConditionId?: string;
  editorMeta?: { notes?: string };
  enabled?: boolean;
}

// ---- Runtime ----

export type BossRuntimeStatus =
  | 'inactive'
  | 'spawning'
  | 'intro'
  | 'active'
  | 'phase-transition'
  | 'stunned'
  | 'defeated'
  | 'failed'
  | 'debug-paused';

export interface BossRuntimeState {
  bossInstanceId: string;
  bossDefinitionId: string;
  targetId?: string; // the boss body CombatTarget id

  status: BossRuntimeStatus;

  activePhaseId?: string;
  completedPhaseIds: string[];

  currentHp: number;
  maxHp: number;
  currentShield: number;
  maxShield: number;

  activeWeakpointIds: string[];
  destroyedWeakpointIds: string[];

  activeAttackPatternIds: string[];
  recentAttackEvents?: BossRuntimeAttackEvent[];
  activeSummonWaveIds: string[];
  clearedSummonWaveIds: string[];

  arenaLocked: boolean;

  timers: Record<string, number>;

  debug?: {
    godMode: boolean;
    forcePhaseId?: string;
    freezeBossAi: boolean;
  };
}

// ---- Validation ----

export interface BossValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}
