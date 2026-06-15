// Combat Runtime (New Batch B) — the data-driven combat substrate for the post-landing Mission Zones.
// Player vitals (HP/Shield/Energy), data-driven skills that cost energy + cooldown, hit volumes, a
// tag-based damage model, dummy targets, and model-first (geometry-mesh) skill effects. This batch ships
// the FOUNDATION only — no real enemies / character skill packs / bosses.
//
// NOTE: kept separate from the turn-based `src/types/combat.ts` model (Combatant/CombatSkill). The skill
// type here is `CombatSkillDefinition` to avoid clashing with the turn-based `CombatSkill`.

export type DamageType =
  | 'impact'
  | 'energy'
  | 'fire'
  | 'electric'
  | 'water'
  | 'repair'
  | 'shield-break'
  | 'stun'
  | 'environment';

export const DAMAGE_TYPES: readonly DamageType[] = [
  'impact', 'energy', 'fire', 'electric', 'water', 'repair', 'shield-break', 'stun', 'environment',
];

export type CombatSourceType = 'player' | 'enemy' | 'support' | 'environment' | 'debug';
export type CombatTargetType = 'player' | 'enemy' | 'npc' | 'obstacle' | 'device' | 'dummy';

// ---- Player / combatant stats ----

export interface CombatStats {
  maxHp: number;
  hp: number;

  maxShield: number;
  shield: number;
  shieldRegenPerSecond: number;
  shieldRegenDelaySeconds: number;

  maxEnergy: number;
  energy: number;
  energyRegenPerSecond: number;

  staggerResistance: number;
  moveSpeedMultiplier: number;

  invulnerable: boolean;
  downed: boolean;
}

// Authored default stats (editor collection). Applied to a character on registerPlayerCombatant.
export interface CombatStatsPreset {
  id: string;
  characterId?: string; // undefined / 'default' = fallback preset
  maxHp: number;
  maxShield: number;
  shieldRegenPerSecond: number;
  shieldRegenDelaySeconds: number;
  maxEnergy: number;
  energyRegenPerSecond: number;
  staggerResistance: number;
  moveSpeedMultiplier: number;
  editorMeta?: { displayName?: string; notes?: string };
}

// ---- Damage ----

export interface DamageEvent {
  id: string;
  sourceId: string;
  sourceType: CombatSourceType;
  targetId: string;
  targetType: CombatTargetType;
  amount: number;
  damageType: DamageType;
  attackTags: string[];
  hitPoint?: [number, number, number];
  hitDirection?: [number, number, number];
  canCrit?: boolean;
  critMultiplier?: number;
  canBeBlocked?: boolean;
  canBeDodged?: boolean;
  canBeReflected?: boolean;
  staggerValue?: number;
  knockbackForce?: number;
  metadata?: Record<string, unknown>;
}

export interface DamageResult {
  targetId: string;
  originalAmount: number;
  finalAmount: number;
  shieldDamage: number;
  hpDamage: number;
  wasWeaknessHit: boolean;
  wasResisted: boolean;
  wasImmune: boolean;
  wasCrit: boolean;
  shieldBroken: boolean;
  targetDefeated: boolean;
  appliedTags: string[];
}

export type ArmorType = 'none' | 'light' | 'medium' | 'heavy' | 'shielded';
export type OnHpZero = 'destroy' | 'disable' | 'down' | 'complete-condition' | 'debug-log';

export interface DamageableDefinition {
  id: string;
  maxHp: number;
  maxShield?: number;
  weaknessTags: string[];
  resistanceTags: string[];
  immuneTags?: string[];
  armorType?: ArmorType;
  shieldRules?: {
    enabled: boolean;
    shieldHp: number;
    shieldWeaknessTags: string[];
    shieldBreakStaggerSeconds: number;
  };
  onHpZero: OnHpZero;
  editorMeta?: { displayName?: string; notes?: string; color?: string };
}

// ---- Hit volume ----

export type HitVolumeShape =
  | 'sphere' | 'box' | 'capsule' | 'cone' | 'cylinder' | 'ring' | 'arc' | 'line' | 'spline-placeholder';

export type HitVolumeOrigin =
  | 'character-root' | 'character-forward' | 'model-socket' | 'world-position' | 'target-position';

export interface HitVolumeDefinition {
  id: string;
  shape: HitVolumeShape;
  origin: HitVolumeOrigin;
  socketName?: string;
  radius?: number;
  length?: number;
  width?: number;
  height?: number;
  angleDegrees?: number;
  offset?: [number, number, number];
  rotationOffset?: [number, number, number];
  activeDelaySeconds?: number;
  activeDurationSeconds: number;
  multiHit?: boolean;
  hitIntervalSeconds?: number;
  debugColor?: string;
}

// ---- Skill ----

export type CombatSkillType =
  | 'basic' | 'special' | 'aoe' | 'defense' | 'dash' | 'utility' | 'ultimate-placeholder';

export interface DamageEventTemplate {
  amount: number;
  damageType: DamageType;
  attackTags: string[];
  canCrit?: boolean;
  critMultiplier?: number;
  staggerValue?: number;
  knockbackForce?: number;
}

export interface TargetRuleDefinition {
  validTargetTypes: CombatTargetType[];
  bonusAgainstTags?: string[];
  reducedAgainstTags?: string[];
}

export interface CombatSkillDefinition {
  id: string;
  characterId?: string;
  name: string;
  description?: string;
  skillType: CombatSkillType;
  inputBinding: string; // e.g. 'KeyJ'
  energyCost: number;
  cooldownSeconds: number;
  castTimeSeconds?: number;
  durationSeconds?: number;
  damageEvents?: DamageEventTemplate[];
  hitVolume: HitVolumeDefinition;
  targetRules: TargetRuleDefinition;
  effectDefinitionId?: string;
  debug?: { ignoreEnergyCost?: boolean; ignoreCooldown?: boolean; showHitVolume?: boolean };
  editorMeta?: { displayName?: string; notes?: string; icon?: string; themeColor?: string };
  enabled?: boolean;
}

// ---- Model-first combat effects ----

export type CombatEffectType =
  | 'model-component-motion'
  | 'geometry-range'
  | 'energy-field'
  | 'shield-wall'
  | 'lock-line'
  | 'ring-burst'
  | 'terrain-marker'
  | 'object-link'
  | 'model-fragment-assembly'
  | 'placeholder-basic-mesh';

export type GeometryType =
  | 'sphere' | 'box' | 'cone' | 'cylinder' | 'torus' | 'arc' | 'ring' | 'line' | 'tube' | 'plane';

export type GeometryRenderMode = 'solid' | 'wireframe' | 'transparent' | 'additive' | 'outline';
export type GeometryAnimate = 'none' | 'expand' | 'pulse' | 'rotate' | 'sweep' | 'contract';

export interface GeometryEffectDefinition {
  geometryType: GeometryType;
  dimensions: { radius?: number; length?: number; width?: number; height?: number; angleDegrees?: number };
  renderMode: GeometryRenderMode;
  animate: GeometryAnimate;
}

export type ModelEffectSource =
  | 'character-model' | 'weapon-model' | 'scene-object' | 'generated-fragment' | 'placeholder-mesh';

export interface ModelComponentTransformKey {
  time: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  opacity?: number;
}

export interface ModelComponentEffectDefinition {
  componentId: string;
  source: ModelEffectSource;
  socketName?: string;
  transformTimeline?: ModelComponentTransformKey[];
  attachTo?: 'character' | 'world' | 'target' | 'effect-root';
  returnToOriginalTransform: boolean;
}

export interface CombatEffectDefinition {
  id: string;
  effectType: CombatEffectType;
  modelComponents?: ModelComponentEffectDefinition[];
  geometry?: GeometryEffectDefinition;
  materialPresetId?: string;
  color?: string;
  timing: { startDelaySeconds: number; durationSeconds: number; fadeInSeconds?: number; fadeOutSeconds?: number };
  pooling?: { poolId?: string; reusable: boolean };
  cleanup: { releaseToPool: boolean; destroyOnComplete: boolean };
  debug?: { showBounds?: boolean; showSockets?: boolean };
}

// ---- Validation ----

export interface CombatValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

// ---- Runtime helpers ----

export function statsFromPreset(preset: CombatStatsPreset): CombatStats {
  return {
    maxHp: preset.maxHp,
    hp: preset.maxHp,
    maxShield: preset.maxShield,
    shield: preset.maxShield,
    shieldRegenPerSecond: preset.shieldRegenPerSecond,
    shieldRegenDelaySeconds: preset.shieldRegenDelaySeconds,
    maxEnergy: preset.maxEnergy,
    energy: preset.maxEnergy,
    energyRegenPerSecond: preset.energyRegenPerSecond,
    staggerResistance: preset.staggerResistance,
    moveSpeedMultiplier: preset.moveSpeedMultiplier,
    invulnerable: false,
    downed: false,
  };
}
