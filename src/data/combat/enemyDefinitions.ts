import type { EnemyDefinition, BossPhaseDefinition } from '../../types/game/combat';

// Enemy + boss definitions (model-driven, using yokais/* + others/crystal boss). Enemies reference
// enemy-faction skill ids from enemySkills.ts. The boss groups 3 HP-gated phases (bossPhases below).
export const SEED_ENEMIES: EnemyDefinition[] = [
  // --- Batch C named archetypes (own AI state machines) ---
  {
    id: 'crusher_drone', name: 'Crusher Drone', archetype: 'crusher-drone', modelAssetId: 'yokais/red+fire+lion+3d+model',
    maxHp: 80, moveSpeed: 3.6, aggroRange: 22, attackRange: 4, aiBehavior: 'chaser', skillIds: [],
    weaknessTags: ['back-attack', 'energy'], resistanceTags: ['impact'],
    charge: { windupSeconds: 0.7, chargeSpeed: 15, chargeDurationSeconds: 0.8, recoverSeconds: 1.2, damageAmount: 16, knockbackForce: 6 },
    scale: 1, color: '#ef4444', enabled: true,
  },
  {
    id: 'pulse_turret', name: 'Pulse Turret', archetype: 'pulse-turret', modelAssetId: 'yokais/stylized+robot+3d+model',
    maxHp: 100, moveSpeed: 0, aggroRange: 24, attackRange: 18, aiBehavior: 'turret', skillIds: ['en_fireball'],
    weaknessTags: ['back-attack', 'shield-break'], resistanceTags: ['energy'],
    turret: { rotationSpeed: 2.2, projectileSkillId: 'en_fireball', fireCooldownSeconds: 2 },
    scale: 1.1, color: '#f59e0b', enabled: true,
  },
  {
    id: 'shield_carrier', name: 'Shield Carrier', archetype: 'shield-carrier', modelAssetId: 'yokais/fantasy+armored+knight+3d+model',
    maxHp: 120, maxShield: 80, moveSpeed: 2, aggroRange: 22, attackRange: 4, aiBehavior: 'chaser', skillIds: [],
    weaknessTags: ['shield-break', 'back-attack', 'heavy-impact'], resistanceTags: ['impact'],
    shield: { arcDegrees: 140, shieldHp: 80, breakStaggerSeconds: 2.5, bashDamage: 14, bashRange: 4 },
    scale: 1.2, color: '#3b82f6', enabled: true,
  },
  {
    id: 'enemy_warrior_cat', name: 'Cat Warrior', modelAssetId: 'yokais/brave+cat+warrior+3d+model',
    maxHp: 70, moveSpeed: 3.2, aggroRange: 22, attackRange: 3, aiBehavior: 'chaser',
    skillIds: ['en_charge', 'en_quake'], weaknessTags: ['energy'], resistanceTags: ['impact'], scale: 1, color: '#f97316', enabled: true,
  },
  {
    id: 'enemy_fire_lion', name: 'Fire Lion', modelAssetId: 'yokais/red+fire+lion+3d+model',
    maxHp: 90, moveSpeed: 2.6, aggroRange: 26, attackRange: 14, aiBehavior: 'kiter',
    skillIds: ['en_fireball', 'en_homing_orb', 'en_charge'], weaknessTags: ['water'], resistanceTags: ['fire'], scale: 1, color: '#dc2626', enabled: true,
  },
  {
    id: 'enemy_robot_sentry', name: 'Robot Sentry', modelAssetId: 'yokais/stylized+robot+3d+model',
    maxHp: 110, maxShield: 40, moveSpeed: 1.4, aggroRange: 24, attackRange: 16, aiBehavior: 'turret',
    skillIds: ['en_fireball', 'en_homing_orb'], weaknessTags: ['shield-break', 'electric'], resistanceTags: ['impact'], scale: 1.1, color: '#64748b', enabled: true,
  },
  // --- Batch I — the remaining 4 archetypes (complete the 8) ---
  {
    id: 'glitch_spawner', name: 'Spawner Bug', archetype: 'spawner-bug', modelAssetId: 'yokais/giant+water+snake+3d+model',
    maxHp: 60, moveSpeed: 2.4, aggroRange: 24, attackRange: 3, aiBehavior: 'kiter', skillIds: [],
    weaknessTags: ['control', 'aoe'], resistanceTags: [],
    spawner: { spawnGroupId: 'glitch_swarm', spawnIntervalSeconds: 6, maxSpawns: 3, retreatRange: 6 },
    scale: 1.1, color: '#84cc16', enabled: true,
  },
  {
    id: 'zip_glitch', name: 'Zip Glitch', archetype: 'zip-glitch', modelAssetId: 'yokais/japanese+ninja+3d+model',
    maxHp: 45, moveSpeed: 4, aggroRange: 24, attackRange: 3, aiBehavior: 'chaser', skillIds: ['en_charge'],
    weaknessTags: ['aoe', 'slow'], resistanceTags: [],
    zip: { dashSpeed: 14, dashIntervalSeconds: 2.5, dashDurationSeconds: 0.5, jitter: 0.8 },
    scale: 0.9, color: '#22d3ee', enabled: true,
  },
  {
    id: 'quake_walker', name: 'Quake Walker', archetype: 'quake-walker', modelAssetId: 'yokais/red+demon+pirate+3d+model',
    maxHp: 160, moveSpeed: 1.6, aggroRange: 22, attackRange: 6, aiBehavior: 'chaser', skillIds: [],
    weaknessTags: ['interrupt', 'energy'], resistanceTags: ['impact'],
    quake: { windupSeconds: 1.2, slamRadius: 6, slamDamage: 22, cooldownSeconds: 4 },
    scale: 1.4, color: '#b45309', enabled: true,
  },
  {
    id: 'repair_wisp', name: 'Repair Wisp', archetype: 'repair-wisp', modelAssetId: 'characters/Carey drone 3d model',
    maxHp: 50, moveSpeed: 3, aggroRange: 20, attackRange: 0, aiBehavior: 'kiter', skillIds: [],
    weaknessTags: ['scan', 'precision'], resistanceTags: [],
    repairWisp: { healAmount: 30, healIntervalSeconds: 4, healRange: 12, fleeRange: 8 },
    scale: 0.8, color: '#34d399', enabled: true,
  },
  {
    id: 'boss_crystal_sentinel', name: 'Crystal Sentinel', modelAssetId: 'others/crystal boss 3d model',
    maxHp: 600, maxShield: 120, moveSpeed: 1.8, aggroRange: 40, attackRange: 24, aiBehavior: 'boss',
    skillIds: ['boss_barrage', 'boss_quake', 'boss_beam'], weaknessTags: ['shield-break'], resistanceTags: ['impact', 'fire'],
    isBoss: true, bossId: 'boss_crystal', scale: 2.4, color: '#a855f7', enabled: true,
  },
];

export const SEED_BOSS_PHASES: BossPhaseDefinition[] = [
  { id: 'phase_crystal_1', bossId: 'boss_crystal', name: 'Awakening', order: 1, hpThresholdPct: 1.0, skillIds: ['boss_barrage', 'boss_quake'], enabled: true },
  { id: 'phase_crystal_2', bossId: 'boss_crystal', name: 'Fracture', order: 2, hpThresholdPct: 0.66, skillIds: ['boss_barrage', 'boss_beam', 'boss_summon'], spawnMinions: [{ enemyId: 'enemy_robot_sentry', count: 2 }], enabled: true },
  { id: 'phase_crystal_3', bossId: 'boss_crystal', name: 'Overload', order: 3, hpThresholdPct: 0.33, skillIds: ['boss_beam', 'boss_meteor', 'boss_quake', 'boss_summon'], spawnMinions: [{ enemyId: 'enemy_warrior_cat', count: 3 }], enrageMoveSpeedMult: 1.5, enabled: true },
];
