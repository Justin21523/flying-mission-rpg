import type { BossDefinition } from '../../types/game/boss';
import { HARBOR_CORE_MODEL } from './bossVisualPresets';

// Seed boss (Batch F) — Harbor Core Sentinel, the final-segment boss of the Sunny Harbor advanced zone.
export const SEED_BOSSES: BossDefinition[] = [
  {
    id: 'harbor_core_sentinel',
    name: 'Harbor Core Sentinel',
    bossType: 'core-sentinel',
    zoneId: 'zone_sunny_harbor_advanced_foundation',
    segmentId: 'seg_harbor_core',
    arenaId: 'harbor_core_arena',
    damageable: {
      id: 'dmg_harbor_core_sentinel',
      maxHp: 600,
      maxShield: 200,
      weaknessTags: ['shield-break', 'weakpoint'],
      resistanceTags: ['impact', 'energy'],
      armorType: 'shielded',
      shieldRules: { enabled: true, shieldHp: 200, shieldWeaknessTags: ['shield-break', 'energy'], shieldBreakStaggerSeconds: 1.5 },
      onHpZero: 'destroy',
      editorMeta: { displayName: 'Harbor Core Sentinel', color: '#38bdf8' },
    },
    phaseIds: ['phase_harbor_p1', 'phase_harbor_p2', 'phase_harbor_p3'],
    startPhaseId: 'phase_harbor_p1',
    finalPhaseIds: ['phase_harbor_p3'],
    weakpointIds: ['wp_core', 'wp_overload'],
    attackPatternIds: ['atk_harbor_projectile', 'atk_harbor_shield_pulse', 'atk_harbor_summon', 'atk_harbor_shockwave', 'atk_harbor_sweep'],
    summonWaveIds: ['wave_harbor_summon'],
    linkedObstacleIds: ['energy_barrier_01'],
    roleRecommendations: {
      recommendedCharacterIds: ['char_chase', 'char_donnie', 'char_paul', 'char_jett'],
      recommendedSupportAbilityTypes: ['scan-support', 'break-support', 'shield-support', 'strike-support'],
      recommendedSkillTags: ['scan', 'shield-break', 'precision'],
    },
    completion: { completeZoneOnDefeat: true, enterMissionCompleteOnDefeat: true, returnToBaseOnDefeat: false },
    visual: {
      modelPresetId: HARBOR_CORE_MODEL,
      scale: [2.2, 2.2, 2.2],
      themeColor: '#38bdf8',
      phaseVisualPresets: { phase_harbor_p1: '#38bdf8', phase_harbor_p2: '#f59e0b', phase_harbor_p3: '#ef4444' },
      defeatedVisualPresetId: 'boss_defeated',
    },
    editorMeta: { difficulty: 'normal', debugColor: '#38bdf8' },
    enabled: true,
  },
];
