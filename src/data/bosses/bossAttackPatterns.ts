import type { BossAttackPatternDefinition } from '../../types/game/boss';
import type { HitVolumeDefinition } from '../../types/game/combat';

// Harbor Core Sentinel attack patterns (Batch F). Damage routes through the shared combat seams: projectile/
// summon via combatSpawn, hit-volume attacks via applyDamageToPlayer. Warnings/executions are geometry fx.
const hv = (over: Partial<HitVolumeDefinition>): HitVolumeDefinition => ({
  id: `bhv_${over.shape ?? 'sphere'}`,
  shape: over.shape ?? 'sphere',
  origin: over.origin ?? 'character-root',
  activeDurationSeconds: over.activeDurationSeconds ?? 0.3,
  ...over,
});

export const SEED_BOSS_ATTACK_PATTERNS: BossAttackPatternDefinition[] = [
  // Phase 1
  {
    id: 'atk_harbor_projectile', bossId: 'harbor_core_sentinel', patternType: 'targeted-projectile',
    cooldownSeconds: 3.5, castTimeSeconds: 0.6, activeDurationSeconds: 0.2,
    damageEventTemplate: { amount: 10, damageType: 'energy', attackTags: ['energy', 'boss'] },
    hitVolume: hv({ shape: 'sphere', origin: 'world-position', radius: 2 }),
    warningVisualId: 'fx_boss_projectile_warn',
    targetRules: { targetType: 'player', priority: 'current-player' },
    phaseIds: ['phase_harbor_p1'],
    counterplay: { canBeDodged: true, canBeBlocked: true },
  },
  {
    id: 'atk_harbor_shield_pulse', bossId: 'harbor_core_sentinel', patternType: 'shield-pulse',
    cooldownSeconds: 6, castTimeSeconds: 0.8, activeDurationSeconds: 0.5,
    damageEventTemplate: { amount: 8, damageType: 'energy', attackTags: ['energy'] },
    hitVolume: hv({ shape: 'cylinder', origin: 'character-root', radius: 6, activeDurationSeconds: 0.5 }),
    executionVisualId: 'fx_boss_shield_pulse',
    targetRules: { targetType: 'area' },
    phaseIds: ['phase_harbor_p1'],
  },
  // Phase 2
  {
    id: 'atk_harbor_summon', bossId: 'harbor_core_sentinel', patternType: 'summon-wave',
    cooldownSeconds: 12, castTimeSeconds: 1, activeDurationSeconds: 0.2,
    hitVolume: hv({ shape: 'sphere', origin: 'character-root', radius: 1, activeDurationSeconds: 0.1 }),
    warningVisualId: 'fx_boss_spawn_marker', summonWaveId: 'wave_harbor_summon',
    targetRules: { targetType: 'area' },
    phaseIds: ['phase_harbor_p2'],
  },
  {
    id: 'atk_harbor_shockwave', bossId: 'harbor_core_sentinel', patternType: 'ground-shockwave',
    cooldownSeconds: 5, castTimeSeconds: 0.9, activeDurationSeconds: 0.4,
    damageEventTemplate: { amount: 14, damageType: 'impact', attackTags: ['impact'] },
    hitVolume: hv({ shape: 'cylinder', origin: 'character-root', radius: 8, activeDurationSeconds: 0.4 }),
    warningVisualId: 'fx_boss_shockwave_warn', executionVisualId: 'fx_boss_shockwave_exec',
    targetRules: { targetType: 'area' },
    phaseIds: ['phase_harbor_p2', 'phase_harbor_p3'],
  },
  // Phase 3
  {
    id: 'atk_harbor_sweep', bossId: 'harbor_core_sentinel', patternType: 'sweep-beam',
    cooldownSeconds: 7, castTimeSeconds: 1.2, activeDurationSeconds: 0.6,
    damageEventTemplate: { amount: 18, damageType: 'energy', attackTags: ['energy'] },
    hitVolume: hv({ shape: 'cone', origin: 'character-forward', radius: 14, angleDegrees: 50, activeDurationSeconds: 0.6 }),
    warningVisualId: 'fx_boss_sweep_warn', executionVisualId: 'fx_boss_sweep_exec',
    targetRules: { targetType: 'player' },
    phaseIds: ['phase_harbor_p3'],
    counterplay: { canBeBlocked: true, recommendedDefenseTags: ['shield', 'shield-support'] },
  },
  // Batch I — Glitch Hive Tyrant attack patterns (reuse the shared boss warning/execution fx).
  {
    id: 'atk_glitch_projectile', bossId: 'glitch_hive_tyrant', patternType: 'targeted-projectile',
    cooldownSeconds: 3.2, castTimeSeconds: 0.6, activeDurationSeconds: 0.2,
    damageEventTemplate: { amount: 9, damageType: 'energy', attackTags: ['energy', 'boss'] },
    hitVolume: hv({ shape: 'sphere', origin: 'world-position', radius: 2 }),
    warningVisualId: 'fx_boss_projectile_warn', targetRules: { targetType: 'player', priority: 'current-player' },
    phaseIds: ['phase_glitch_p1'], counterplay: { canBeDodged: true, canBeBlocked: true },
  },
  {
    id: 'atk_glitch_shield_pulse', bossId: 'glitch_hive_tyrant', patternType: 'shield-pulse',
    cooldownSeconds: 6, castTimeSeconds: 0.8, activeDurationSeconds: 0.5,
    damageEventTemplate: { amount: 8, damageType: 'energy', attackTags: ['energy'] },
    hitVolume: hv({ shape: 'cylinder', origin: 'character-root', radius: 6, activeDurationSeconds: 0.5 }),
    executionVisualId: 'fx_boss_shield_pulse', targetRules: { targetType: 'area' }, phaseIds: ['phase_glitch_p1'],
  },
  {
    id: 'atk_glitch_summon', bossId: 'glitch_hive_tyrant', patternType: 'summon-wave',
    cooldownSeconds: 12, castTimeSeconds: 1, activeDurationSeconds: 0.2,
    hitVolume: hv({ shape: 'sphere', origin: 'character-root', radius: 1, activeDurationSeconds: 0.1 }),
    warningVisualId: 'fx_boss_spawn_marker', summonWaveId: 'wave_glitch_summon', targetRules: { targetType: 'area' },
    phaseIds: ['phase_glitch_p2'],
  },
  {
    id: 'atk_glitch_shockwave', bossId: 'glitch_hive_tyrant', patternType: 'ground-shockwave',
    cooldownSeconds: 5, castTimeSeconds: 0.9, activeDurationSeconds: 0.4,
    damageEventTemplate: { amount: 14, damageType: 'impact', attackTags: ['impact'] },
    hitVolume: hv({ shape: 'cylinder', origin: 'character-root', radius: 8, activeDurationSeconds: 0.4 }),
    warningVisualId: 'fx_boss_shockwave_warn', executionVisualId: 'fx_boss_shockwave_exec', targetRules: { targetType: 'area' },
    phaseIds: ['phase_glitch_p2', 'phase_glitch_p3'],
  },
  {
    id: 'atk_glitch_sweep', bossId: 'glitch_hive_tyrant', patternType: 'sweep-beam',
    cooldownSeconds: 7, castTimeSeconds: 1.2, activeDurationSeconds: 0.6,
    damageEventTemplate: { amount: 18, damageType: 'energy', attackTags: ['energy'] },
    hitVolume: hv({ shape: 'cone', origin: 'character-forward', radius: 14, angleDegrees: 50, activeDurationSeconds: 0.6 }),
    warningVisualId: 'fx_boss_sweep_warn', executionVisualId: 'fx_boss_sweep_exec', targetRules: { targetType: 'player' },
    phaseIds: ['phase_glitch_p3'], counterplay: { canBeBlocked: true, recommendedDefenseTags: ['shield', 'shield-support'] },
  },
];
