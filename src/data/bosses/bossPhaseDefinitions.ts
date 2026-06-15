import type { BossPhaseDefinition } from '../../types/game/boss';

// Harbor Core Sentinel — 3 phases (Batch F). Phase 1 teaches scan/break-shield/weakpoint; Phase 2 a summon
// wave; Phase 3 the overload burst. Phase transitions are driven by BossPhaseController completion conditions.
export const SEED_BOSS_PHASES: BossPhaseDefinition[] = [
  {
    id: 'phase_harbor_p1',
    bossId: 'harbor_core_sentinel',
    name: 'Shielded Core',
    phaseIndex: 0,
    startCondition: { type: 'on-boss-start' },
    completionConditions: [{ type: 'destroy-weakpoint', weakpointId: 'wp_core' }],
    enabledAttackPatternIds: ['atk_harbor_projectile', 'atk_harbor_shield_pulse'],
    enabledWeakpointIds: ['wp_core'],
    enabledObstacleIds: ['energy_barrier_01'],
    bossModifiers: { invulnerableUntilWeakpointExposed: true, defenseMultiplier: 0.4 },
    nextPhaseIds: ['phase_harbor_p2'],
    editorMeta: { phaseColor: '#38bdf8', notes: 'Scan to expose the core, break the shield, destroy the weakpoint.' },
  },
  {
    id: 'phase_harbor_p2',
    bossId: 'harbor_core_sentinel',
    name: 'Summon Defense',
    phaseIndex: 1,
    startCondition: { type: 'previous-phase-complete', phaseId: 'phase_harbor_p1' },
    completionConditions: [{ type: 'clear-summon-wave', summonWaveId: 'wave_harbor_summon' }],
    enabledAttackPatternIds: ['atk_harbor_summon', 'atk_harbor_shockwave'],
    enabledSummonWaveIds: ['wave_harbor_summon'],
    bossModifiers: { defenseMultiplier: 0.3 },
    nextPhaseIds: ['phase_harbor_p3'],
    editorMeta: { phaseColor: '#f59e0b', notes: 'Clear the summoned wave to stun the boss.' },
  },
  {
    id: 'phase_harbor_p3',
    bossId: 'harbor_core_sentinel',
    name: 'Overload Core',
    phaseIndex: 2,
    startCondition: { type: 'previous-phase-complete', phaseId: 'phase_harbor_p2' },
    completionConditions: [{ type: 'destroy-weakpoint', weakpointId: 'wp_overload' }],
    enabledAttackPatternIds: ['atk_harbor_sweep', 'atk_harbor_shockwave'],
    enabledWeakpointIds: ['wp_overload'],
    bossModifiers: { damageMultiplier: 1.4 },
    nextPhaseIds: [],
    editorMeta: { phaseColor: '#ef4444', notes: 'Dodge/shield the sweep beam; destroy the overload core.' },
  },
];
