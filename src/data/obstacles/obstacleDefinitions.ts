import type { ObstacleDefinition } from '../../types/game/obstacle';

const ZONE = 'zone_sunny_harbor_advanced_foundation';

const repairDevice = (
  id: string,
  name: string,
  zoneId: string,
  segmentId: string,
  position: [number, number, number],
  linkedZoneConditionId: string,
): ObstacleDefinition => ({
  id,
  name,
  obstacleType: 'corrupted-device',
  zoneId,
  segmentId,
  transform: { position, rotation: [0, 0, 0], scale: [1, 1, 1] },
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
  visualStates: { active: { color: '#dc2626' }, repaired: { color: '#22c55e' } },
  linkedZoneConditionId,
  enabled: true,
});

const crackedWall = (
  id: string,
  name: string,
  zoneId: string,
  segmentId: string,
  position: [number, number, number],
  linkedZoneConditionId: string,
  hp = 160,
): ObstacleDefinition => ({
  id,
  name,
  obstacleType: 'cracked-wall',
  zoneId,
  segmentId,
  transform: { position, rotation: [0, 0, 0], scale: [1.3, 1.2, 1] },
  damageable: { id: `dmg_${id}`, maxHp: hp, weaknessTags: ['heavy-impact', 'drill', 'impact'], resistanceTags: ['energy'], onHpZero: 'destroy', editorMeta: { displayName: name, color: '#8b7355' } },
  interactionRules: [
    { id: 'r_break', trigger: 'damage', resultState: 'destroyed', threshold: { damageAmount: hp } },
    { id: 'r_damage', trigger: 'damage', resultState: 'damaged', threshold: { damageAmount: Math.round(hp / 3) } },
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
  visualStates: { active: { color: '#8b7355' }, damaged: { color: '#a8865f' }, destroyed: { color: '#6b5b45', opacity: 0.4 } },
  linkedZoneConditionId,
  enabled: true,
});

// Batch O — explosive fuel canister: a low-HP destructible prop that AOE-damages nearby enemies on destroy.
const fuelCanister = (id: string, name: string, zoneId: string, segmentId: string, position: [number, number, number]): ObstacleDefinition => ({
  id,
  name,
  obstacleType: 'cracked-wall',
  zoneId,
  segmentId,
  transform: { position, rotation: [0, 0, 0], scale: [0.6, 0.9, 0.6] },
  damageable: { id: `dmg_${id}`, maxHp: 40, weaknessTags: ['impact', 'heavy-impact', 'fire'], resistanceTags: [], onHpZero: 'destroy', editorMeta: { displayName: name, color: '#f59e0b' } },
  interactionRules: [
    { id: 'r_break', trigger: 'damage', resultState: 'destroyed', threshold: { damageAmount: 40 } },
    { id: 'r_debug', trigger: 'debug-clear', resultState: 'destroyed' },
  ],
  stateMachine: { initialState: 'active', allowedTransitions: [{ from: 'active', to: 'destroyed', trigger: 'damage' }, { from: 'active', to: 'destroyed', trigger: 'debug-clear' }] },
  visualStates: { active: { color: '#f59e0b' }, destroyed: { color: '#7c2d12', opacity: 0.3 } },
  explodeOnDestroy: { radius: 6, damage: 40 },
  enabled: true,
});

const barrier = (
  id: string,
  name: string,
  zoneId: string,
  segmentId: string,
  position: [number, number, number],
  linkedZoneConditionId: string,
): ObstacleDefinition => ({
  id,
  name,
  obstacleType: 'energy-barrier',
  zoneId,
  segmentId,
  transform: { position, rotation: [0, 0, 0], scale: [5, 3, 0.6] },
  damageable: { id: `dmg_${id}`, maxHp: 1, maxShield: 120, weaknessTags: ['energy', 'shield-break'], resistanceTags: ['impact'], shieldRules: { enabled: true, shieldHp: 120, shieldWeaknessTags: ['shield-break', 'energy'], shieldBreakStaggerSeconds: 0 }, onHpZero: 'destroy', editorMeta: { displayName: name, color: '#38bdf8' } },
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
  visualStates: { active: { color: '#38bdf8', opacity: 0.4 }, damaged: { color: '#38bdf8', opacity: 0.25 }, cleared: { color: '#38bdf8', opacity: 0 } },
  linkedZoneConditionId,
  enabled: true,
});

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
  barrier('downtown_energy_barrier_01', 'Downtown Energy Barrier', 'zone_downtown_traffic_collapse', 'seg_downtown_intersection', [0, 0, 18], 'clear_downtown_barrier'),
  repairDevice('downtown_traffic_command_device', 'Traffic Command Device', 'zone_downtown_traffic_collapse', 'seg_downtown_command', [0, 0, -22], 'repair_downtown_command'),
  repairDevice('factory_corrupted_device_01', 'Factory Corrupted Machine', 'zone_factory_core_breakdown', 'seg_factory_assembly', [0, 0, 18], 'repair_factory_assembly'),
  repairDevice('factory_core_device_01', 'Factory Core Device', 'zone_factory_core_breakdown', 'seg_factory_control', [0, 0, -24], 'repair_factory_control'),
  crackedWall('tunnel_cracked_wall_01', 'Large Cracked Tunnel Wall', 'zone_mountain_tunnel_rescue', 'seg_tunnel_collapse', [0, 0, 18], 'break_tunnel_wall', 220),
  repairDevice('tunnel_gate_core_01', 'Tunnel Gate Core', 'zone_mountain_tunnel_rescue', 'seg_tunnel_exit', [0, 0, -24], 'repair_tunnel_gate'),
  barrier('skyport_barrier_node_device_01', 'Skyport Barrier Node', 'zone_skyport_core_finale', 'seg_skyport_bridge', [0, 0, 20], 'clear_skyport_barrier'),
  repairDevice('blackout_power_box_01', 'Blackout Power Box', 'zone_night_city_blackout', 'seg_blackout_power_box', [22, 0, 0], 'repair_blackout_power'),
  barrier('blackout_energy_barrier_01', 'Blackout Energy Barrier', 'zone_night_city_blackout', 'seg_blackout_grid', [0, 0, -18], 'clear_blackout_barrier'),
  repairDevice('storm_pump_device_01', 'Storm Pump Device', 'zone_storm_coast_flood_rescue', 'seg_flood_pump', [0, 0, 20], 'repair_flood_pump'),
  barrier('storm_flooded_path_01', 'Flooded Path Barrier', 'zone_storm_coast_flood_rescue', 'seg_flood_evac', [22, 0, 2], 'clear_flooded_path'),
  repairDevice('metro_locked_core_01', 'Metro Locked Core', 'zone_metro_rescue_labyrinth', 'seg_metro_exit', [0, 0, -24], 'unlock_metro_exit'),
  barrier('metro_energy_barrier_01', 'Metro Rail Barrier', 'zone_metro_rescue_labyrinth', 'seg_metro_switch', [0, 0, 18], 'clear_metro_barrier'),
  repairDevice('tower_broken_lift_01', 'Broken Tower Lift', 'zone_aero_tower_high_rescue', 'seg_tower_lift', [0, 0, 20], 'repair_tower_lift'),
  repairDevice('tower_antenna_device_01', 'Tower Antenna Device', 'zone_aero_tower_high_rescue', 'seg_tower_antenna', [0, 0, -24], 'repair_tower_antenna'),
  repairDevice('finale_crisis_node_01', 'Finale Crisis Node', 'zone_rescue_vanguard_finale', 'seg_finale_crisis_nodes', [0, 0, 24], 'repair_finale_node'),
  barrier('finale_core_barrier_01', 'Final Core Barrier', 'zone_rescue_vanguard_finale', 'seg_finale_core', [0, 0, -20], 'clear_finale_barrier'),
  // Batch O — explosive props near the Signal Yard wave (blow them up next to enemies).
  fuelCanister('signal_yard_canister_1', 'Fuel Canister', 'zone_sunny_harbor_advanced_foundation', 'seg_signal_yard', [20, 0, -10]),
  fuelCanister('signal_yard_canister_2', 'Fuel Canister', 'zone_sunny_harbor_advanced_foundation', 'seg_signal_yard', [24, 0, -14]),
];
