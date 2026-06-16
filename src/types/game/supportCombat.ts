// Combat Support Integration (New Batch E) — turns the companion dispatch system into a tactical COMBAT
// option inside Advanced Mission Zones. Support abilities are data-driven (this file's types), cooldown/cost
// gated, and route their effects through the existing combat / obstacle / zone runtimes (no parallel damage
// logic, no direct store writes). Kept separate from the dispatch types in `support.ts` — this layer hangs
// off the existing SupportDispatchProfile / CharacterPresence by `characterId`.

import type { DamageType } from './combat';
import type { ObstacleState } from './obstacle';

// ---- Enumerations ----

export type SupportCombatType =
  | 'strike-support'
  | 'shield-support'
  | 'repair-support'
  | 'scan-support'
  | 'taunt-support'
  | 'break-support'
  | 'platform-support-placeholder'
  | 'fusion-placeholder';

export const SUPPORT_COMBAT_TYPES: readonly SupportCombatType[] = [
  'strike-support', 'shield-support', 'repair-support', 'scan-support',
  'taunt-support', 'break-support', 'platform-support-placeholder', 'fusion-placeholder',
];

export type SupportTriggerMode =
  | 'manual-target'
  | 'auto-nearest-threat'
  | 'auto-current-objective'
  | 'on-zone-condition'
  | 'debug-only';

export const SUPPORT_TRIGGER_MODES: readonly SupportTriggerMode[] = [
  'manual-target', 'auto-nearest-threat', 'auto-current-objective', 'on-zone-condition', 'debug-only',
];

export type SupportTargetType =
  | 'enemy'
  | 'enemy-group'
  | 'obstacle'
  | 'device'
  | 'npc'
  | 'area'
  | 'player'
  | 'current-zone-objective'
  | 'none';

export const SUPPORT_TARGET_TYPES: readonly SupportTargetType[] = [
  'enemy', 'enemy-group', 'obstacle', 'device', 'npc', 'area', 'player', 'current-zone-objective', 'none',
];

export type SupportRangeShape =
  | 'single'
  | 'sphere'
  | 'cylinder'
  | 'box'
  | 'cone'
  | 'line'
  | 'zone-segment'
  | 'global-placeholder';

export const SUPPORT_RANGE_SHAPES: readonly SupportRangeShape[] = [
  'single', 'sphere', 'cylinder', 'box', 'cone', 'line', 'zone-segment', 'global-placeholder',
];

export type SupportTargetPriority =
  | 'nearest'
  | 'lowest-hp'
  | 'highest-threat'
  | 'shielded'
  | 'objective-linked'
  | 'scanned'
  | 'manual';

export interface SupportTargetingDefinition {
  targetType: SupportTargetType;
  rangeShape: SupportRangeShape;
  maxRange?: number;
  radius?: number;
  width?: number;
  length?: number;
  angleDegrees?: number;
  targetPriority?: SupportTargetPriority;
  requireLineOfSight?: boolean;
}

export type SupportEffectType =
  | 'damage'
  | 'shield'
  | 'repair'
  | 'heal'
  | 'scan'
  | 'taunt'
  | 'stun'
  | 'slow'
  | 'shield-break'
  | 'obstacle-clear'
  | 'condition-progress'
  | 'spawn-cover'
  | 'debug-log';

export const SUPPORT_EFFECT_TYPES: readonly SupportEffectType[] = [
  'damage', 'shield', 'repair', 'heal', 'scan', 'taunt', 'stun', 'slow',
  'shield-break', 'obstacle-clear', 'condition-progress', 'spawn-cover', 'debug-log',
];

export type SupportEffectAttachTo =
  | 'support-character'
  | 'player'
  | 'target'
  | 'world-position'
  | 'zone-center';

export interface SupportCombatEffectDefinition {
  id: string;
  effectType: SupportEffectType;
  amount?: number; // damage / repair / heal value; for 'shield' = damage-reduction fraction (0..1); 'taunt' = decoy hp
  damageType?: DamageType;
  attackTags?: string[];
  durationSeconds?: number;
  targetStateTagsToAdd?: string[];
  targetStateTagsToRemove?: string[];
  linkedZoneConditionId?: string;
  linkedObstacleState?: ObstacleState;
  visualEffectId?: string;
  // Model-first geometry/mesh effect (rendered by CombatEffectDirector / GeometryEffectRenderer).
  modelFirstEffect?: {
    effectDefinitionId: string;
    attachTo: SupportEffectAttachTo;
  };
  // Optional GLB spawn for decoys / strike silhouettes / cover (rendered by combatSpawnStore).
  spawnModelAssetId?: string;
  // Shield support: how many incoming enemy projectiles the dome absorbs before fading.
  projectileBlockCount?: number;
  stackingRules?: {
    canStack: boolean;
    maxStacks?: number;
    refreshDuration?: boolean;
  };
}

export type SupportRequiredStatus = 'active-at-scene' | 'standby-at-scene' | 'remote-support' | 'any';

export interface SupportCombatAbilityDefinition {
  id: string;
  supportCharacterId: string;
  name: string;
  description?: string;
  supportType: SupportCombatType;
  triggerMode: SupportTriggerMode;
  targeting: SupportTargetingDefinition;
  resourceCost: {
    supportEnergy?: number;
    playerEnergy?: number;
    charges?: number;
  };
  cooldownSeconds: number;
  castDelaySeconds?: number;
  durationSeconds?: number;
  effects: SupportCombatEffectDefinition[];
  validZoneSegmentTypes?: string[];
  validTargetTags?: string[];
  invalidTargetTags?: string[];
  requiresSupportStatus?: SupportRequiredStatus;
  tierCost?: {
    activeCost?: number;
    standbyCost?: number;
    remoteCost?: number;
  };
  editorMeta?: {
    displayName?: string;
    notes?: string;
    icon?: string;
    themeColor?: string;
    difficulty?: 'easy' | 'normal' | 'hard';
  };
  debug?: {
    ignoreCooldown?: boolean;
    ignoreCost?: boolean;
    showTargeting?: boolean;
    forceAvailable?: boolean;
  };
  enabled?: boolean;
}

// ---- Runtime state ----

export type SupportCombatStatus =
  | 'unavailable'
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
  | 'cooldown';

export interface SupportCombatRuntimeState {
  supportCharacterId: string;
  currentStatus: SupportCombatStatus;
  activeAbilityIds: string[];
  abilityCooldowns: Record<string, number>; // abilityId → cooldown-end ms
  supportEnergy: number;
  maxSupportEnergy: number;
  chargesByAbilityId: Record<string, number>;
  currentTargetId?: string;
  currentZoneId?: string;
  currentSegmentId?: string;
  lastUsedAbilityId?: string;
  lastUsedAt?: number;
  debug?: {
    forceAvailable: boolean;
    ignoreCooldown: boolean;
    ignoreCost: boolean;
  };
}

// A live shield/decoy/heal-over-time effect, ticked + expired by SupportCombatDirector.update.
export interface ActiveSupportEffectState {
  id: string;
  abilityId: string;
  supportCharacterId: string;
  effectType: SupportEffectType;
  targetId?: string;
  x?: number;
  y?: number;
  z?: number;
  radius?: number;
  amount?: number; // shield = damage-reduction fraction; decoy = hp
  projectileBlocksRemaining?: number;
  startedAtMs: number;
  untilMs: number;
}

// ---- Synergy (placeholder — no full cinematic fusion this batch) ----

export type SupportSynergyTrigger =
  | 'support-used-after-skill'
  | 'enemy-scanned'
  | 'shield-broken'
  | 'player-low-hp'
  | 'zone-condition-active'
  | 'debug-only';

export const SUPPORT_SYNERGY_TRIGGERS: readonly SupportSynergyTrigger[] = [
  'support-used-after-skill', 'enemy-scanned', 'shield-broken', 'player-low-hp', 'zone-condition-active', 'debug-only',
];

export interface PartnerSynergyPlaceholderDefinition {
  id: string;
  primaryCharacterId: string;
  supportCharacterId: string;
  name: string;
  triggerCondition: SupportSynergyTrigger;
  requiredSkillTags?: string[];
  requiredSupportAbilityId?: string;
  resultEffectIds: string[];
  cooldownSeconds: number;
  editorMeta?: {
    notes?: string;
    futureFullFusion?: boolean;
  };
}

// ---- Partner Fusion (Batch I) — a real synchronized combo attack (beyond the synergy bonus) ----
// Player + an Active/Standby support partner fire a unified AOE strike, gated by limited per-zone charges +
// a sync gauge that fills from support/skill use. Reuses the cinematic VFX runtime + the shared damage path.
export interface PartnerFusionDefinition {
  id: string;
  primaryCharacterId: string;
  supportCharacterId: string;
  name: string;
  description?: string;
  requiredSupportStatus?: 'active' | 'standby'; // minimum support tier required
  chargesPerZone: number;
  cooldownSeconds: number;
  sync: { requiredGauge: number; gaugeMax: number };
  combo: {
    damage: number;
    radius: number;
    damageType: DamageType;
    attackTags: string[];
    statusTags?: string[];
    cinematicEffectId: string; // an existing CinematicEffectDefinition id to play
  };
  editorMeta?: { notes?: string; themeColor?: string };
  enabled?: boolean;
}

// ---- Validation ----

export interface SupportCombatValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}
