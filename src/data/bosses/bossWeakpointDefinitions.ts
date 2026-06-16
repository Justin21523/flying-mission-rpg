import type { BossWeakpointDefinition } from '../../types/game/boss';

// Harbor Core Sentinel weakpoints (Batch F). Each registers a hittable CombatTarget (BossWeakpointController)
// so player skills resolve damage through the shared DamageResolver. Exposed by scan / support-scan /
// shield-break; destroying one damages the boss + advances the phase.
export const SEED_BOSS_WEAKPOINTS: BossWeakpointDefinition[] = [
  {
    id: 'wp_core',
    bossId: 'harbor_core_sentinel',
    displayName: 'Shield Core',
    fallbackPosition: [0, 2.4, 0],
    activeInPhaseIds: ['phase_harbor_p1'],
    damageable: {
      id: 'dmg_wp_core', maxHp: 120, weaknessTags: ['precision', 'weakpoint', 'shield-break'], resistanceTags: [],
      onHpZero: 'destroy', editorMeta: { displayName: 'Shield Core', color: '#f87171' },
    },
    exposedRules: { initiallyExposed: false, exposeOnScan: true, exposeOnSupportScan: true, exposeOnShieldBreak: true, exposeDurationSeconds: 8 },
    effectOnDestroyed: { damageBossAmount: 150, removeBossShield: 200, triggerNextPhase: true },
    validAttackTags: ['precision', 'weakpoint', 'shield-break', 'impact', 'energy'],
    visual: { hiddenPresetId: 'wp_hidden', exposedPresetId: 'wp_exposed', destroyedPresetId: 'wp_destroyed', markerGeometry: 'ring', color: '#f87171' },
  },
  {
    id: 'wp_overload',
    bossId: 'harbor_core_sentinel',
    displayName: 'Overload Core',
    fallbackPosition: [0, 3, 0],
    activeInPhaseIds: ['phase_harbor_p3'],
    damageable: {
      id: 'dmg_wp_overload', maxHp: 160, weaknessTags: ['precision', 'weakpoint'], resistanceTags: [],
      onHpZero: 'destroy', editorMeta: { displayName: 'Overload Core', color: '#fb7185' },
    },
    exposedRules: { initiallyExposed: true, exposeOnScan: true, exposeOnSupportScan: true, exposeDurationSeconds: 14 },
    effectOnDestroyed: { damageBossAmount: 400, triggerNextPhase: false },
    validAttackTags: ['precision', 'weakpoint', 'impact', 'energy'],
    visual: { hiddenPresetId: 'wp_hidden', exposedPresetId: 'wp_exposed', destroyedPresetId: 'wp_destroyed', markerGeometry: 'diamond', color: '#fb7185' },
  },
  // Batch I — Glitch Hive Tyrant weakpoints.
  {
    id: 'wp_hive_node', bossId: 'glitch_hive_tyrant', displayName: 'Hive Node', fallbackPosition: [0, 2.4, 0],
    activeInPhaseIds: ['phase_glitch_p1'],
    damageable: { id: 'dmg_wp_hive_node', maxHp: 110, weaknessTags: ['precision', 'weakpoint', 'aoe'], resistanceTags: [], onHpZero: 'destroy', editorMeta: { displayName: 'Hive Node', color: '#a3e635' } },
    exposedRules: { initiallyExposed: false, exposeOnScan: true, exposeOnSupportScan: true, exposeOnShieldBreak: true, exposeDurationSeconds: 8 },
    effectOnDestroyed: { damageBossAmount: 120, removeBossShield: 150, triggerNextPhase: true },
    validAttackTags: ['precision', 'weakpoint', 'aoe', 'impact', 'energy'],
    visual: { hiddenPresetId: 'wp_hidden', exposedPresetId: 'wp_exposed', destroyedPresetId: 'wp_destroyed', markerGeometry: 'ring', color: '#a3e635' },
  },
  {
    id: 'wp_hive_core', bossId: 'glitch_hive_tyrant', displayName: 'Hive Core', fallbackPosition: [0, 3, 0],
    activeInPhaseIds: ['phase_glitch_p3'],
    damageable: { id: 'dmg_wp_hive_core', maxHp: 150, weaknessTags: ['precision', 'weakpoint'], resistanceTags: [], onHpZero: 'destroy', editorMeta: { displayName: 'Hive Core', color: '#fb7185' } },
    exposedRules: { initiallyExposed: true, exposeOnScan: true, exposeOnSupportScan: true, exposeDurationSeconds: 14 },
    effectOnDestroyed: { damageBossAmount: 350, triggerNextPhase: false },
    validAttackTags: ['precision', 'weakpoint', 'impact', 'energy', 'aoe'],
    visual: { hiddenPresetId: 'wp_hidden', exposedPresetId: 'wp_exposed', destroyedPresetId: 'wp_destroyed', markerGeometry: 'diamond', color: '#fb7185' },
  },
];
