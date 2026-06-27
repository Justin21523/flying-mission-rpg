import type {
  BossDefinition, BossPhaseDefinition, BossWeakpointDefinition, BossAttackPatternDefinition,
  BossArenaDefinition, BossSummonWaveDefinition, BossSignatureMechanicType,
} from '../../types/game/boss';
import type { EnemySpawnGroupDefinition } from '../../types/game/combat';
import { HARBOR_CORE_MODEL, GLITCH_HIVE_MODEL } from './bossVisualPresets';

type SpawnEntry = EnemySpawnGroupDefinition['enemies'][number];

// Batch K — signature bosses for zones 2,3,4,6,7,8,9 (zones 5 & 10 keep harbor/vanguard). Each is generated
// by makeBossFamily() mirroring the Harbor Core 3-phase template (P1 shielded weakpoint → P2 summon wave →
// P3 overload weakpoint), so all 7 reuse the exact data-driven boss pipeline (BossDirector / weakpoints /
// attacks / arena / summon waves). These bosses are referenced ONLY by the per-zone RandomBossPools — their
// segmentId is a sentinel ('random_only_*') so getBossForSegment never auto-triggers them. Fully editable in
// the 👹 Boss tab like any seeded boss.

export interface BossFamilyCfg {
  id: string;
  name: string;
  zoneId: string;
  bossType: BossDefinition['bossType'];
  model: string;
  color: string;
  hp: number;
  shield: number;
  arenaPos: [number, number, number];
  summonEnemies: SpawnEntry[];
  difficulty?: 'normal' | 'hard';
  // Wave 1 — the boss's signature mechanic (id is derived as `${id}_sig`).
  signatureMechanic?: { type: BossSignatureMechanicType; config: Record<string, number>; activeInPhaseIds?: string[]; enemyRef?: string; vfxId?: string };
}

export interface BossFamily {
  boss: BossDefinition;
  phases: BossPhaseDefinition[];
  weakpoints: BossWeakpointDefinition[];
  attacks: BossAttackPatternDefinition[];
  arena: BossArenaDefinition;
  wave: BossSummonWaveDefinition;
  summonGroup: EnemySpawnGroupDefinition;
}

const r = (n: number) => Math.round(n);

export function makeBossFamily(cfg: BossFamilyCfg): BossFamily {
  const { id } = cfg;
  const p1 = `${id}_p1`, p2 = `${id}_p2`, p3 = `${id}_p3`;
  const wpNode = `${id}_wp_node`, wpCore = `${id}_wp_core`;
  const atkProj = `${id}_atk_projectile`, atkPulse = `${id}_atk_shield_pulse`, atkSummon = `${id}_atk_summon`,
    atkShock = `${id}_atk_shockwave`, atkSweep = `${id}_atk_sweep`;
  const arenaId = `${id}_arena`, waveId = `${id}_wave`, groupId = `${id}_summon_grp`;
  const isElite = cfg.bossType === 'elite-machine';
  const eliteTag = isElite ? 'aoe' : 'shield-break';

  const boss: BossDefinition = {
    id,
    name: cfg.name,
    bossType: cfg.bossType,
    zoneId: cfg.zoneId,
    segmentId: `random_only_${id}`, // sentinel — never matches a real segment (random-pool only)
    arenaId,
    damageable: {
      id: `dmg_${id}`,
      maxHp: cfg.hp,
      maxShield: cfg.shield,
      weaknessTags: ['weakpoint', eliteTag],
      resistanceTags: isElite ? ['energy'] : ['impact', 'energy'],
      armorType: 'shielded',
      shieldRules: { enabled: true, shieldHp: cfg.shield, shieldWeaknessTags: ['shield-break', eliteTag], shieldBreakStaggerSeconds: 1.5 },
      onHpZero: 'destroy',
      editorMeta: { displayName: cfg.name, color: cfg.color },
    },
    phaseIds: [p1, p2, p3],
    startPhaseId: p1,
    finalPhaseIds: [p3],
    weakpointIds: [wpNode, wpCore],
    attackPatternIds: [atkProj, atkPulse, atkSummon, atkShock, atkSweep],
    summonWaveIds: [waveId],
    roleRecommendations: {
      recommendedCharacterIds: ['char_chase', 'char_jett', 'char_paul', 'char_donnie'],
      recommendedSupportAbilityTypes: ['scan-support', 'strike-support', 'break-support'],
      recommendedSkillTags: ['scan', 'weakpoint', eliteTag],
    },
    completion: { completeZoneOnDefeat: false, enterMissionCompleteOnDefeat: false, returnToBaseOnDefeat: false },
    visual: {
      modelPresetId: cfg.model,
      scale: [2, 2, 2],
      themeColor: cfg.color,
      phaseVisualPresets: { [p1]: cfg.color, [p2]: '#f59e0b', [p3]: '#ef4444' },
      defeatedVisualPresetId: 'boss_defeated',
    },
    // World-build Wave 1 — every zone boss gets a dramatic entrance + an enrage timer (hard bosses enrage sooner/harder).
    intro: { title: cfg.name, subtitle: 'Zone guardian engaged', durationSeconds: 3 },
    enrage: { afterSeconds: cfg.difficulty === 'hard' ? 80 : 95, damageMultiplier: cfg.difficulty === 'hard' ? 1.7 : 1.5 },
    // Wave 1 — signature mechanic (id derived from the boss id).
    signatureMechanic: cfg.signatureMechanic ? { id: `${id}_sig`, enabled: true, ...cfg.signatureMechanic } : undefined,
    editorMeta: { difficulty: cfg.difficulty ?? 'normal', debugColor: cfg.color },
    enabled: true,
  };

  const phases: BossPhaseDefinition[] = [
    {
      id: p1, bossId: id, name: 'Shielded Core', phaseIndex: 0,
      startCondition: { type: 'on-boss-start' },
      completionConditions: [{ type: 'destroy-weakpoint', weakpointId: wpNode }],
      enabledAttackPatternIds: [atkProj, atkPulse],
      enabledWeakpointIds: [wpNode],
      bossModifiers: { invulnerableUntilWeakpointExposed: true, defenseMultiplier: 0.4 },
      nextPhaseIds: [p2],
      editorMeta: { phaseColor: cfg.color, notes: 'Scan/break the shield to expose the node, then destroy it.' },
    },
    {
      id: p2, bossId: id, name: 'Summon Defense', phaseIndex: 1,
      startCondition: { type: 'previous-phase-complete', phaseId: p1 },
      completionConditions: [{ type: 'clear-summon-wave', summonWaveId: waveId }],
      enabledAttackPatternIds: [atkSummon, atkShock],
      enabledSummonWaveIds: [waveId],
      bossModifiers: { defenseMultiplier: 0.3 },
      nextPhaseIds: [p3],
      editorMeta: { phaseColor: '#f59e0b', notes: 'Clear the summoned wave to stagger the boss.' },
    },
    {
      id: p3, bossId: id, name: 'Overload Core', phaseIndex: 2,
      startCondition: { type: 'previous-phase-complete', phaseId: p2 },
      completionConditions: [{ type: 'destroy-weakpoint', weakpointId: wpCore }],
      enabledAttackPatternIds: [atkSweep, atkShock],
      enabledWeakpointIds: [wpCore],
      bossModifiers: { damageMultiplier: 1.4 },
      nextPhaseIds: [],
      editorMeta: { phaseColor: '#ef4444', notes: 'Dodge/shield the sweep; destroy the overload core.' },
    },
  ];

  const weakpoints: BossWeakpointDefinition[] = [
    {
      id: wpNode, bossId: id, displayName: `${cfg.name} Node`, fallbackPosition: [0, 2.4, 0],
      activeInPhaseIds: [p1],
      damageable: { id: `dmg_${wpNode}`, maxHp: r(cfg.hp * 0.2), weaknessTags: ['precision', 'weakpoint', eliteTag], resistanceTags: [], onHpZero: 'destroy', editorMeta: { displayName: 'Shield Node', color: '#f87171' } },
      exposedRules: { initiallyExposed: false, exposeOnScan: true, exposeOnSupportScan: true, exposeOnShieldBreak: true, exposeDurationSeconds: 9 },
      effectOnDestroyed: { damageBossAmount: r(cfg.hp * 0.25), removeBossShield: cfg.shield, triggerNextPhase: true },
      validAttackTags: ['precision', 'weakpoint', eliteTag, 'impact', 'energy'],
      visual: { hiddenPresetId: 'wp_hidden', exposedPresetId: 'wp_exposed', destroyedPresetId: 'wp_destroyed', markerGeometry: 'ring', color: '#f87171' },
    },
    {
      id: wpCore, bossId: id, displayName: `${cfg.name} Core`, fallbackPosition: [0, 3, 0],
      activeInPhaseIds: [p3],
      damageable: { id: `dmg_${wpCore}`, maxHp: r(cfg.hp * 0.27), weaknessTags: ['precision', 'weakpoint'], resistanceTags: [], onHpZero: 'destroy', editorMeta: { displayName: 'Overload Core', color: '#fb7185' } },
      exposedRules: { initiallyExposed: true, exposeOnScan: true, exposeOnSupportScan: true, exposeDurationSeconds: 14 },
      effectOnDestroyed: { damageBossAmount: r(cfg.hp * 0.7), triggerNextPhase: false },
      validAttackTags: ['precision', 'weakpoint', 'impact', 'energy'],
      visual: { hiddenPresetId: 'wp_hidden', exposedPresetId: 'wp_exposed', destroyedPresetId: 'wp_destroyed', markerGeometry: 'diamond', color: '#fb7185' },
    },
  ];

  const attacks: BossAttackPatternDefinition[] = [
    {
      id: atkProj, bossId: id, patternType: 'targeted-projectile', cooldownSeconds: 3.4, castTimeSeconds: 0.6, activeDurationSeconds: 0.2,
      damageEventTemplate: { amount: 10, damageType: 'energy', attackTags: ['energy', 'boss'] },
      hitVolume: { id: `bhv_${id}_proj`, shape: 'sphere', origin: 'world-position', radius: 2, activeDurationSeconds: 0.2 },
      warningVisualId: 'fx_boss_projectile_warn', targetRules: { targetType: 'player', priority: 'current-player' },
      phaseIds: [p1], counterplay: { canBeDodged: true, canBeBlocked: true },
    },
    {
      id: atkPulse, bossId: id, patternType: 'shield-pulse', cooldownSeconds: 6, castTimeSeconds: 0.8, activeDurationSeconds: 0.5,
      damageEventTemplate: { amount: 8, damageType: 'energy', attackTags: ['energy'] },
      hitVolume: { id: `bhv_${id}_pulse`, shape: 'cylinder', origin: 'character-root', radius: 6, activeDurationSeconds: 0.5 },
      executionVisualId: 'fx_boss_shield_pulse', targetRules: { targetType: 'area' }, phaseIds: [p1],
    },
    {
      id: atkSummon, bossId: id, patternType: 'summon-wave', cooldownSeconds: 12, castTimeSeconds: 1, activeDurationSeconds: 0.2,
      hitVolume: { id: `bhv_${id}_summon`, shape: 'sphere', origin: 'character-root', radius: 1, activeDurationSeconds: 0.1 },
      warningVisualId: 'fx_boss_spawn_marker', summonWaveId: waveId, targetRules: { targetType: 'area' }, phaseIds: [p2],
    },
    {
      id: atkShock, bossId: id, patternType: 'ground-shockwave', cooldownSeconds: 5, castTimeSeconds: 0.9, activeDurationSeconds: 0.4,
      damageEventTemplate: { amount: 14, damageType: 'impact', attackTags: ['impact'] },
      hitVolume: { id: `bhv_${id}_shock`, shape: 'cylinder', origin: 'character-root', radius: 8, activeDurationSeconds: 0.4 },
      warningVisualId: 'fx_boss_shockwave_warn', executionVisualId: 'fx_boss_shockwave_exec', targetRules: { targetType: 'area' }, phaseIds: [p2, p3],
    },
    {
      id: atkSweep, bossId: id, patternType: 'sweep-beam', cooldownSeconds: 7, castTimeSeconds: 1.2, activeDurationSeconds: 0.6,
      damageEventTemplate: { amount: 18, damageType: 'energy', attackTags: ['energy'] },
      hitVolume: { id: `bhv_${id}_sweep`, shape: 'cone', origin: 'character-forward', radius: 14, angleDegrees: 50, activeDurationSeconds: 0.6 },
      warningVisualId: 'fx_boss_sweep_warn', executionVisualId: 'fx_boss_sweep_exec', targetRules: { targetType: 'player' },
      phaseIds: [p3], counterplay: { canBeBlocked: true, recommendedDefenseTags: ['shield', 'shield-support'] },
    },
  ];

  const arena: BossArenaDefinition = {
    id: arenaId, zoneId: cfg.zoneId, segmentId: `random_only_${id}`, name: `${cfg.name} Arena`,
    bounds: { center: [cfg.arenaPos[0], 0, cfg.arenaPos[2]], size: [24, 8, 24] },
    entryMarkerId: `${id}_entry`, bossSpawnPointId: `${id}_boss_spawn`, playerStartPointId: `${id}_player_start`,
    bossSpawnPosition: cfg.arenaPos, playerStartPosition: [cfg.arenaPos[0], 0, cfg.arenaPos[2] - 12],
    arenaLock: { lockOnStart: true, unlockOnBossDefeat: true, boundaryModelPresetId: 'arena_ring' },
    supportBeaconIds: [], supplyStationIds: [],
    camera: { useArenaCameraHints: true, minDistance: 8, maxDistance: 22 },
    editorMeta: { debugColor: cfg.color },
  };

  const wave: BossSummonWaveDefinition = {
    id: waveId, bossId: id, phaseId: p2, enemySpawnGroupIds: [groupId],
    trigger: { type: 'on-phase-start' }, maxActiveEnemies: 6, completeWhenGroupsCleared: true,
  };

  const summonGroup: EnemySpawnGroupDefinition = {
    id: groupId, zoneId: cfg.zoneId, segmentId: `random_only_${id}`, spawnMode: 'debug-only',
    enemies: cfg.summonEnemies, completeWhenAllDefeated: true, enabled: true,
  };

  return { boss, phases, weakpoints, attacks, arena, wave, summonGroup };
}

const BOSS_CFGS: BossFamilyCfg[] = [
  { id: 'gridlock_warden', name: 'Gridlock Warden', zoneId: 'zone_downtown_traffic_collapse', bossType: 'elite-machine', model: GLITCH_HIVE_MODEL, color: '#fbbf24', hp: 420, shield: 120, arenaPos: [-20, 0, 14], summonEnemies: [{ enemyDefinitionId: 'crusher_drone', count: 2, formation: 'circle' }, { enemyDefinitionId: 'shield_carrier', count: 1, formation: 'cluster' }], signatureMechanic: { type: 'moving-hazard-lasers', config: { intervalSeconds: 4, warnSeconds: 1, radius: 4, damage: 14 } } },
  { id: 'foundry_overmind', name: 'Foundry Overmind', zoneId: 'zone_factory_core_breakdown', bossType: 'core-sentinel', model: HARBOR_CORE_MODEL, color: '#f97316', hp: 480, shield: 160, arenaPos: [-24, 0, -10], summonEnemies: [{ enemyDefinitionId: 'glitch_spawner', count: 1, formation: 'line' }, { enemyDefinitionId: 'drone_swarm', count: 2, formation: 'circle' }], signatureMechanic: { type: 'priority-healer', config: { intervalSeconds: 11, healPerSec: 12, maxHealers: 1 }, enemyRef: 'repair_wisp' } },
  { id: 'rockfall_colossus', name: 'Rockfall Colossus', zoneId: 'zone_mountain_tunnel_rescue', bossType: 'elite-machine', model: GLITCH_HIVE_MODEL, color: '#a16207', hp: 520, shield: 120, arenaPos: [0, 0, -28], summonEnemies: [{ enemyDefinitionId: 'quake_walker', count: 1, formation: 'cluster' }, { enemyDefinitionId: 'crusher_drone', count: 2, formation: 'circle' }], signatureMechanic: { type: 'falling-debris', config: { intervalSeconds: 3.5, warnSeconds: 1.1, radius: 5, damage: 16 } } },
  { id: 'blackout_revenant', name: 'Blackout Revenant', zoneId: 'zone_night_city_blackout', bossType: 'elite-machine', model: GLITCH_HIVE_MODEL, color: '#6366f1', hp: 460, shield: 140, arenaPos: [-12, 0, 26], summonEnemies: [{ enemyDefinitionId: 'pulse_turret', count: 2, formation: 'line' }, { enemyDefinitionId: 'sniper_node', count: 1, formation: 'cluster' }], signatureMechanic: { type: 'blackout-pulse', config: { intervalSeconds: 5 } } },
  { id: 'tide_leviathan', name: 'Tide Leviathan', zoneId: 'zone_storm_coast_flood_rescue', bossType: 'core-sentinel', model: HARBOR_CORE_MODEL, color: '#0ea5e9', hp: 540, shield: 180, arenaPos: [28, 0, 12], summonEnemies: [{ enemyDefinitionId: 'drone_swarm', count: 3, formation: 'circle' }, { enemyDefinitionId: 'repair_wisp', count: 1, formation: 'cluster' }], difficulty: 'hard', signatureMechanic: { type: 'arena-flood', config: { intervalSeconds: 7, warnSeconds: 1.5, radius: 14, damage: 18 } } },
  { id: 'labyrinth_stalker', name: 'Labyrinth Stalker', zoneId: 'zone_metro_rescue_labyrinth', bossType: 'elite-machine', model: GLITCH_HIVE_MODEL, color: '#14b8a6', hp: 500, shield: 140, arenaPos: [-28, 0, 28], summonEnemies: [{ enemyDefinitionId: 'zip_glitch', count: 2, formation: 'circle' }, { enemyDefinitionId: 'shield_carrier', count: 1, formation: 'cluster' }], signatureMechanic: { type: 'arena-shrink', config: { intervalSeconds: 2, baseRadius: 22, minRadius: 8, shrinkSeconds: 30, damage: 10 } } },
  { id: 'skybreaker_aegis', name: 'Skybreaker Aegis', zoneId: 'zone_aero_tower_high_rescue', bossType: 'core-sentinel', model: HARBOR_CORE_MODEL, color: '#38bdf8', hp: 560, shield: 200, arenaPos: [10, 0, -36], summonEnemies: [{ enemyDefinitionId: 'zip_glitch', count: 2, formation: 'circle' }, { enemyDefinitionId: 'barrier_node', count: 1, formation: 'cluster' }], difficulty: 'hard', signatureMechanic: { type: 'reflect-aegis', config: { shieldRegenPerSec: 14 } } },
  // World-build Wave 1 — new elite mid-boss for the skyport route; summons the new owl/demon enemies (factory-generated).
  { id: 'skyport_warden_elite', name: 'Skyport Warden', zoneId: 'zone_skyport_core_finale', bossType: 'elite-machine', model: GLITCH_HIVE_MODEL, color: '#818cf8', hp: 500, shield: 150, arenaPos: [0, 0, -30], summonEnemies: [{ enemyDefinitionId: 'owl_scout', count: 2, formation: 'circle' }, { enemyDefinitionId: 'demon_brute', count: 1, formation: 'cluster' }], difficulty: 'hard', signatureMechanic: { type: 'moving-hazard-lasers', config: { intervalSeconds: 3.5, warnSeconds: 0.9, radius: 4, damage: 13 } } },
];

const FAMILIES: BossFamily[] = BOSS_CFGS.map(makeBossFamily);

export const EXTRA_BOSSES: BossDefinition[] = FAMILIES.map((f) => f.boss);
export const EXTRA_BOSS_PHASES: BossPhaseDefinition[] = FAMILIES.flatMap((f) => f.phases);
export const EXTRA_BOSS_WEAKPOINTS: BossWeakpointDefinition[] = FAMILIES.flatMap((f) => f.weakpoints);
export const EXTRA_BOSS_ATTACKS: BossAttackPatternDefinition[] = FAMILIES.flatMap((f) => f.attacks);
export const EXTRA_BOSS_ARENAS: BossArenaDefinition[] = FAMILIES.map((f) => f.arena);
export const EXTRA_BOSS_SUMMON_WAVES: BossSummonWaveDefinition[] = FAMILIES.map((f) => f.wave);
export const EXTRA_BOSS_SUMMON_GROUPS: EnemySpawnGroupDefinition[] = FAMILIES.map((f) => f.summonGroup);
