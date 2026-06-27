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
export type CombatTargetType = 'player' | 'enemy' | 'npc' | 'obstacle' | 'device' | 'dummy' | 'boss';

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

// Player-facing category (drives the skill bar grouping). Batch D.
export type SkillCategory = 'normal' | 'heavy' | 'ranged' | 'aoe' | 'defense' | 'special' | 'ultimate';
export const SKILL_CATEGORIES: readonly SkillCategory[] = ['normal', 'heavy', 'ranged', 'aoe', 'defense', 'special', 'ultimate'];

export type SkillFaction = 'player' | 'enemy' | 'boss';

// How a skill delivers its hit. Drives the behavior dispatch in skillBehaviors.ts. Hit-volume types use the
// caster's HitVolumeRuntime query; projectile/summon/terrain spawn real GLB models via combatSpawnStore.
export type AttackType =
  | 'melee' | 'heavy' | 'charge' | 'dash'
  | 'projectile' | 'homing' | 'lobbed' | 'air-support'
  | 'shockwave' | 'line-pierce' | 'fan' | 'ring-aoe' | 'dot-zone'
  | 'summon' | 'trap' | 'terrain'
  | 'pull' | 'push' | 'boss-weakpoint' | 'none';
export const ATTACK_TYPES: readonly AttackType[] = [
  'melee', 'heavy', 'charge', 'dash', 'projectile', 'homing', 'lobbed', 'air-support',
  'shockwave', 'line-pierce', 'fan', 'ring-aoe', 'dot-zone', 'summon', 'trap', 'terrain',
  'pull', 'push', 'boss-weakpoint', 'none',
];
// Attack types that spawn a GLB model via combatSpawnStore (vs an instantaneous hit-volume query).
export const SPAWN_ATTACK_TYPES: readonly AttackType[] = ['projectile', 'homing', 'lobbed', 'air-support', 'summon', 'trap', 'terrain'];

export type DefenseType =
  | 'none' | 'front-shield' | 'omni-barrier' | 'perfect-guard' | 'reflect-wall'
  | 'absorb-energy' | 'quick-dash-iframe' | 'cover-spawn' | 'damage-reduction-zone'
  | 'knockback-wave' | 'team-rescue';
export const DEFENSE_TYPES: readonly DefenseType[] = [
  'none', 'front-shield', 'omni-barrier', 'perfect-guard', 'reflect-wall', 'absorb-energy',
  'quick-dash-iframe', 'cover-spawn', 'damage-reduction-zone', 'knockback-wave', 'team-rescue',
];

export type SpawnMovement = 'linear' | 'homing' | 'lobbed' | 'orbit' | 'seek' | 'stationary';

export interface ProjectileConfig {
  modelAssetId?: string; // GLB to render (falls back to a geometry bolt if absent)
  speed: number;
  lifetimeSeconds: number;
  movement: 'linear' | 'homing' | 'lobbed';
  radius: number; // impact radius
  spreadDeg?: number;
  count?: number;
  onImpactEffectDefId?: string;
}

export interface SummonConfig {
  modelAssetId?: string;
  count: number;
  lifetimeSeconds: number;
  behavior: 'orbit' | 'seek' | 'stationary';
  attackIntervalSeconds: number;
  attackDamage: number;
  attackRadius: number;
}

export interface TerrainConfig {
  modelAssetId?: string;
  count: number;
  lifetimeSeconds: number;
  radius: number;
  blocksMovement?: boolean;
  damagePerTick?: number;
  tickIntervalSeconds?: number;
}

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

// An authored, timed VFX/SFX trigger on a skill's cast timeline. Optional & additive: a skill with no
// timelineEvents fires its single effectDefinitionId exactly as before. When present, the timeline drives the
// effects/sounds instead (each fires at timeSeconds during the cast). Editable via the Skill Timeline editor.
export interface SkillTimelineEvent {
  eventId: string;
  name: string;
  timeSeconds: number; // when it fires within the cast
  kind: 'effect' | 'sound';
  effectDefinitionId?: string; // kind 'effect' → a combat/cinematic effect id
  soundId?: string; // kind 'sound' → synth SfxName ('boost') or cue id ('fx.boost')
  enabled: boolean;
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
  timelineEvents?: SkillTimelineEvent[]; // optional authored timeline of timed VFX/SFX triggers (overrides the single effect when present)
  debug?: { ignoreEnergyCost?: boolean; ignoreCooldown?: boolean; showHitVolume?: boolean };
  editorMeta?: { displayName?: string; notes?: string; icon?: string; themeColor?: string };
  enabled?: boolean;

  // ---- Batch D: model-driven skill fields (all optional → Batch B skills still valid) ----
  ownerCharacterId?: string;
  faction?: SkillFaction; // default 'player'
  skillCategory?: SkillCategory;
  attackType?: AttackType; // default inferred: hit-volume melee
  defenseType?: DefenseType; // for skillCategory 'defense'
  slot?: number; // 1..6 skill-bar slot (per owner)
  // Model references — the heart of the model-driven design.
  modelPrefabId?: string; // a model swung/attached for melee/heavy (e.g. character pose)
  projectilePrefabId?: string; // convenience alias → projectile.modelAssetId
  impactEffectPrefabId?: string;
  summonPrefabId?: string; // convenience alias → summon.modelAssetId
  projectile?: ProjectileConfig;
  summon?: SummonConfig;
  terrain?: TerrainConfig;
  defenseValue?: number; // damage reduction (0..1) / absorb amount / iframe — meaning per defenseType
  knockbackForce?: number;
  stunDurationSeconds?: number;
  speed?: number; // charge/dash travel speed
  animationName?: string;
  soundEffectId?: string;
  unlockCondition?: string;
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

// ---- Enemy + Boss (Batch D, shared skill engine) ----

export type EnemyAiBehavior = 'chaser' | 'kiter' | 'turret' | 'boss';

// Batch C — named enemy archetypes with their own AI state machines (enemyAi.ts). 'generic' falls back to
// the Batch D approach-and-cast loop. Batch I adds the remaining 4 of the 8-archetype roster.
export type EnemyArchetype =
  | 'generic' | 'crusher-drone' | 'pulse-turret' | 'shield-carrier'
  | 'spawner-bug' | 'zip-glitch' | 'quake-walker' | 'repair-wisp'
  | 'hazard-core' | 'drone-swarm' | 'sniper-node' | 'barrier-node' | 'elite-sentinel'
  // Wave 2 — tactical archetypes.
  | 'dodger' | 'flanker' | 'bomber' | 'suppressor' | 'buffer';
export const ENEMY_ARCHETYPES: readonly EnemyArchetype[] = [
  'generic', 'crusher-drone', 'pulse-turret', 'shield-carrier',
  'spawner-bug', 'zip-glitch', 'quake-walker', 'repair-wisp',
  'hazard-core', 'drone-swarm', 'sniper-node', 'barrier-node', 'elite-sentinel',
  'dodger', 'flanker', 'bomber', 'suppressor', 'buffer',
];

// All runtime AI states across the archetypes (a target uses the subset for its archetype).
export type EnemyAiState =
  | 'idle' | 'chasing' | 'charge-windup' | 'charging' | 'recovering'
  | 'tracking' | 'firing' | 'cooldown'
  | 'guarding' | 'bash' | 'shield-broken' | 'stunned' | 'defeated'
  // Batch I — new archetype states.
  | 'spawning' | 'dashing' | 'quake-windup' | 'slamming' | 'healing' | 'fleeing'
  // Wave 2 — tactical states.
  | 'evading' | 'flanking' | 'arming' | 'suppressing' | 'buffing';

export interface CrusherConfig {
  windupSeconds: number;
  chargeSpeed: number;
  chargeDurationSeconds: number;
  recoverSeconds: number;
  damageAmount: number;
  knockbackForce?: number;
}
export interface TurretConfig {
  rotationSpeed: number; // rad/s
  projectileSkillId: string; // enemy-faction projectile skill
  fireCooldownSeconds: number;
}
export interface ShieldCarrierConfig {
  arcDegrees: number;
  shieldHp: number;
  breakStaggerSeconds: number;
  bashDamage: number;
  bashRange: number;
}
// Batch I — configs for the 4 new archetypes.
export interface SpawnerConfig {
  spawnGroupId: string; // an EnemySpawnGroupDefinition id of minions to summon
  spawnIntervalSeconds: number;
  maxSpawns: number;
  retreatRange: number; // back away when the player is closer than this
}
export interface ZipConfig {
  dashSpeed: number;
  dashIntervalSeconds: number;
  dashDurationSeconds: number;
  jitter: number; // lateral evasion (radians) added to the dash heading
}
export interface QuakeConfig {
  windupSeconds: number; // telegraphed, interruptible
  slamRadius: number;
  slamDamage: number;
  cooldownSeconds: number;
}
export interface RepairWispConfig {
  healAmount: number;
  healIntervalSeconds: number;
  healRange: number;
  fleeRange: number; // keep this far from the player
}
// Wave 2 — tactical archetype configs.
export interface DodgerConfig {
  approachSpeed: number; // chase speed toward the player
  meleeDamage: number; // damage on contact
  projectileDetectRange: number; // radius to notice an incoming player projectile
  evadeSpeed: number; // lateral sidestep speed
  evadeDurationSeconds: number;
  evadeCooldownSeconds: number;
}
export interface FlankerConfig {
  approachSpeed: number;
  flankAngleDegrees: number; // target offset from the player's facing-to-enemy (circles to the side/back)
  meleeDamage: number;
  attackRange: number;
}
export interface BomberConfig {
  rushSpeed: number;
  armRange: number; // start the fuse when this close
  fuseSeconds: number;
  blastRadius: number;
  blastDamage: number;
}
export interface SuppressorConfig {
  projectileSkillId: string; // enemy-faction projectile skill (rapid, low damage)
  fireIntervalSeconds: number;
  preferredRange: number; // hold around this distance
}
export interface BufferConfig {
  buffIntervalSeconds: number;
  shieldAmount: number; // shield granted to nearby allies per pulse
  buffRange: number;
  keepDistance: number; // stay this far from the player
}

export interface EnemyDefinition {
  id: string;
  name: string;
  modelAssetId?: string; // a yokais/* (or any) GLB
  maxHp: number;
  maxShield?: number;
  moveSpeed: number;
  aggroRange: number;
  attackRange: number;
  aiBehavior: EnemyAiBehavior;
  skillIds: string[]; // enemy-faction CombatSkillDefinition ids
  weaknessTags: string[];
  resistanceTags: string[];
  isBoss?: boolean;
  bossId?: string; // groups boss phases
  scale?: number;
  color?: string;
  // Batch L (meta-progression) — reward granted to the active character / wallet on defeat. Optional;
  // KillRewards falls back to a maxHp-derived default when unset.
  expReward?: number;
  coinReward?: number;
  // Batch C — archetype + per-archetype AI config (optional → Batch D enemies stay valid).
  archetype?: EnemyArchetype;
  charge?: CrusherConfig;
  turret?: TurretConfig;
  shield?: ShieldCarrierConfig;
  // Batch I — new archetype configs.
  spawner?: SpawnerConfig;
  zip?: ZipConfig;
  quake?: QuakeConfig;
  repairWisp?: RepairWispConfig;
  // Wave 2 — tactical archetype configs.
  dodger?: DodgerConfig;
  flanker?: FlankerConfig;
  bomber?: BomberConfig;
  suppressor?: SuppressorConfig;
  buffer?: BufferConfig;
  // Wave 2 — poise / break meter (per-enemy max; runtime accumulates from staggerValue hits). Optional.
  poise?: { max: number };
  editorMeta?: { notes?: string };
  enabled: boolean;
}

// ---- Enemy spawn groups (Batch C) — segment-linked encounters ----
export interface EnemySpawnGroupDefinition {
  id: string;
  zoneId: string;
  segmentId: string;
  spawnMode: 'on-segment-enter' | 'on-condition' | 'debug-only';
  enemies: { enemyDefinitionId: string; count: number; formation?: 'line' | 'circle' | 'cluster' }[];
  completeWhenAllDefeated: boolean;
  linkedZoneConditionId?: string;
  respawn?: { enabled: boolean; maxRespawns?: number; respawnDelaySeconds?: number };
  // Wave 1 — optional elite-affix policy: each spawned enemy may roll affixes (allowedAffixIds, by chance).
  affixPolicy?: { allowedAffixIds: string[]; chancePerEnemy: number; maxPerEnemy: number };
  // Wave 2 — optional squad coordination: per-enemy tactical roles drive a coordinator pass (spacing / flanking).
  squadPolicy?: { enabled?: boolean; roles?: { enemyDefinitionId: string; role: 'melee-swarm' | 'ranged-keep-distance' | 'healer-stay-back' | 'flank' }[] };
  editorMeta?: { notes?: string };
  enabled: boolean;
}

export interface BossPhaseDefinition {
  id: string;
  bossId: string;
  name: string;
  order: number;
  hpThresholdPct: number; // enter this phase when hp <= this fraction of max (1 = from start)
  skillIds: string[];
  spawnMinions?: { enemyId: string; count: number }[];
  enrageMoveSpeedMult?: number;
  editorMeta?: { notes?: string };
  enabled: boolean;
}

// Runtime active-defense state for a combatant (set by defense skills; read by applyDamageToPlayer).
export interface ActiveDefenseState {
  type: DefenseType;
  untilMs: number;
  value: number; // damage-reduction fraction / absorb amount / etc.
  // Batch O — a hit within [activatedAtMs, activatedAtMs+parryWindowMs] is a PARRY (full negate + fusion reward).
  activatedAtMs?: number;
  parryWindowMs?: number;
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
