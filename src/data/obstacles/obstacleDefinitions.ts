import type { ObstacleDefinition } from '../../types/game/obstacle';

const ZONE = 'zone_sunny_harbor_advanced_foundation';

// Seed obstacles for the Sunny Harbor zone (Batch C). Energy Barrier + Cracked Wall are damageable (a proxy
// combat target takes the hits through the shared DamageResolver); Corrupted Device is interact/repair-only.
export const SEED_OBSTACLES: ObstacleDefinition[] = [
  {
    id: 'cracked_wall_01',
    name: 'Cracked Wall',
    obstacleType: 'cracked-wall',
    zoneId: ZONE,
    segmentId: 'seg_cargo_street',
    transform: { position: [0, 0, 16], rotation: [0, 0, 0], scale: [1, 1, 1] },
    damageable: { id: 'dmg_cracked_wall', maxHp: 120, weaknessTags: ['heavy-impact', 'drill', 'impact'], resistanceTags: ['energy'], onHpZero: 'destroy', editorMeta: { displayName: 'Cracked Wall', color: '#8b7355' } },
    interactionRules: [
      // Highest threshold first — at full depletion this matches before the intermediate 'damaged' rule.
      { id: 'r_break', trigger: 'damage', resultState: 'destroyed', threshold: { damageAmount: 120 } },
      { id: 'r_damage', trigger: 'damage', resultState: 'damaged', threshold: { damageAmount: 40 } },
      { id: 'r_debug', trigger: 'debug-clear', resultState: 'destroyed' },
    ],
    stateMachine: {
      initialState: 'active',
      allowedTransitions: [
        { from: 'active', to: 'damaged', trigger: 'damage' },
        { from: 'active', to: 'destroyed', trigger: 'damage' },
        { from: 'damaged', to: 'destroyed', trigger: 'damage' },
        { from: 'active', to: 'destroyed', trigger: 'debug-clear' },
        { from: 'damaged', to: 'destroyed', trigger: 'debug-clear' },
      ],
    },
    visualStates: {
      active: { color: '#8b7355' },
      damaged: { color: '#a8865f' },
      destroyed: { color: '#6b5b45', opacity: 0.4 },
    },
    linkedZoneConditionId: 'break_wall',
    enabled: true,
  },
  {
    id: 'corrupted_device_01',
    name: 'Corrupted Device',
    obstacleType: 'corrupted-device',
    zoneId: ZONE,
    segmentId: 'seg_repair_plaza',
    transform: { position: [-6, 0, -26], rotation: [0, 0, 0], scale: [1, 1, 1] },
    interactionRules: [
      { id: 'r_repair', trigger: 'repair', resultState: 'repaired', threshold: { repairAmount: 100 } },
      { id: 'r_interact', trigger: 'interact', resultState: 'repaired', threshold: { interactCount: 3 } },
      { id: 'r_debug', trigger: 'debug-clear', resultState: 'repaired' },
    ],
    stateMachine: {
      initialState: 'active',
      allowedTransitions: [
        { from: 'active', to: 'repaired', trigger: 'repair' },
        { from: 'active', to: 'repaired', trigger: 'interact' },
        { from: 'active', to: 'repaired', trigger: 'debug-clear' },
      ],
    },
    visualStates: {
      active: { color: '#dc2626' },
      repaired: { color: '#22c55e' },
    },
    linkedZoneConditionId: 'repair_device',
    enabled: true,
  },
  {
    id: 'energy_barrier_01',
    name: 'Energy Barrier',
    obstacleType: 'energy-barrier',
    zoneId: ZONE,
    segmentId: 'seg_harbor_core',
    transform: { position: [12, 0, 8], rotation: [0, 0, 0], scale: [6, 4, 0.6] },
    damageable: { id: 'dmg_energy_barrier', maxHp: 1, maxShield: 120, weaknessTags: ['energy', 'shield-break'], resistanceTags: ['impact'], shieldRules: { enabled: true, shieldHp: 120, shieldWeaknessTags: ['shield-break', 'energy'], shieldBreakStaggerSeconds: 0 }, onHpZero: 'destroy', editorMeta: { displayName: 'Energy Barrier', color: '#38bdf8' } },
    interactionRules: [
      { id: 'r_damage', trigger: 'damage', resultState: 'cleared', threshold: { damageAmount: 1 } },
      { id: 'r_debug', trigger: 'debug-clear', resultState: 'cleared' },
    ],
    stateMachine: {
      initialState: 'active',
      allowedTransitions: [
        { from: 'active', to: 'damaged', trigger: 'damage' },
        { from: 'active', to: 'cleared', trigger: 'damage' },
        { from: 'damaged', to: 'cleared', trigger: 'damage' },
        { from: 'active', to: 'cleared', trigger: 'debug-clear' },
      ],
    },
    visualStates: {
      active: { color: '#38bdf8', opacity: 0.4 },
      damaged: { color: '#38bdf8', opacity: 0.25 },
      cleared: { color: '#38bdf8', opacity: 0 },
    },
    linkedZoneConditionId: 'clear_barrier',
    enabled: true,
  },
];
