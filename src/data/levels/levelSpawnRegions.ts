import type { LevelSpawnRegionDefinition } from '../../types/levelTypes';

export const SEED_LEVEL_SPAWN_REGIONS: LevelSpawnRegionDefinition[] = [
  { id: 'spawn_sunny_signal', segmentId: 'seg_signal_yard', label: 'Signal Yard Enemy Line', center: [22, 0, -12], radius: 8, tags: ['enemy', 'wave'] },
  { id: 'spawn_sunny_core', segmentId: 'seg_harbor_core', label: 'Harbor Core Boss Adds', center: [16, 0, 8], radius: 9, tags: ['boss', 'minion'] },
  { id: 'spawn_downtown_shield', segmentId: 'seg_downtown_intersection', label: 'Shield Carrier Blockade', center: [0, 0, 22], radius: 10, tags: ['shield', 'traffic'] },
  { id: 'spawn_downtown_swarm', segmentId: 'seg_downtown_evac', label: 'Drone Swarm Flow', center: [22, 0, 10], radius: 9, tags: ['swarm'] },
  { id: 'spawn_factory_support', segmentId: 'seg_factory_assembly', label: 'Repair Wisp Line', center: [0, 0, 20], radius: 10, tags: ['support'] },
  { id: 'spawn_factory_hazard', segmentId: 'seg_factory_hazard', label: 'Hazard Core Bay', center: [20, 0, 0], radius: 10, tags: ['hazard'] },
  { id: 'spawn_tunnel_heavy', segmentId: 'seg_tunnel_collapse', label: 'Quake Walker Collapse', center: [0, 0, 20], radius: 10, tags: ['heavy'] },
  { id: 'spawn_tunnel_sniper', segmentId: 'seg_tunnel_exit', label: 'Sniper Node Perch', center: [0, 0, -24], radius: 10, tags: ['sniper'] },
  { id: 'spawn_skyport_bridge', segmentId: 'seg_skyport_bridge', label: 'Storm Bridge Patrol', center: [0, 0, 22], radius: 12, tags: ['elite', 'shield'] },
  { id: 'spawn_skyport_core', segmentId: 'seg_skyport_core', label: 'Core Sentinel Arena', center: [20, 0, 0], radius: 12, tags: ['boss'] },
  { id: 'spawn_blackout_scan', segmentId: 'seg_blackout_scan', label: 'Blackout Turret Wake', center: [0, 0, 22], radius: 10, tags: ['turret', 'scan'] },
  { id: 'spawn_blackout_grid', segmentId: 'seg_blackout_grid', label: 'Sniper Grid Crossfire', center: [0, 0, -24], radius: 12, tags: ['sniper', 'night'] },
  { id: 'spawn_flood_evac', segmentId: 'seg_flood_evac', label: 'Flood Swarm Evac', center: [24, 0, 2], radius: 10, tags: ['rescue', 'swarm'] },
  { id: 'spawn_flood_core', segmentId: 'seg_flood_hazard_core', label: 'Flood Hazard Core', center: [0, 0, -24], radius: 12, tags: ['hazard', 'core'] },
  { id: 'spawn_metro_switch', segmentId: 'seg_metro_switch', label: 'Metro Patrol Switch Room', center: [0, 0, 22], radius: 10, tags: ['patrol', 'metro'] },
  { id: 'spawn_metro_platform', segmentId: 'seg_metro_platform', label: 'Metro Ambush Platform', center: [24, 0, 0], radius: 11, tags: ['ambush', 'rescue'] },
  { id: 'spawn_tower_platform', segmentId: 'seg_tower_platform', label: 'Tower Platform Pressure', center: [22, 0, 0], radius: 11, tags: ['wind', 'rescue'] },
  { id: 'spawn_tower_antenna', segmentId: 'seg_tower_antenna', label: 'Antenna Barrier Nodes', center: [0, 0, -24], radius: 11, tags: ['barrier', 'turret'] },
  { id: 'spawn_finale_elite', segmentId: 'seg_finale_elite_guard', label: 'Finale Elite Guard', center: [24, 0, 0], radius: 12, tags: ['elite', 'finale'] },
  { id: 'spawn_finale_core', segmentId: 'seg_finale_core', label: 'Final Core Support', center: [0, 0, -26], radius: 14, tags: ['boss', 'support'] },
];
