import type { LevelSegmentDefinition } from '../../types/levelTypes';

export const SEED_LEVEL_SEGMENTS: LevelSegmentDefinition[] = [
  { id: 'seg_landing_dock', layoutId: 'layout_sunny_harbor_emergency', name: 'Landing Dock', order: 1, segmentType: 'landing', bounds: { center: [0, 0, 4], size: [24, 8, 24] }, entryMarkerId: 'dock_marker', exitMarkerIds: ['road_control_switch'] },
  { id: 'seg_cargo_street', layoutId: 'layout_sunny_harbor_emergency', name: 'Cargo Street', order: 2, segmentType: 'incident', bounds: { center: [0, 0, 24], size: [16, 8, 40] }, entryMarkerId: 'road_control_switch', exitMarkerIds: ['signal_yard_area'] },
  { id: 'seg_signal_yard', layoutId: 'layout_sunny_harbor_emergency', name: 'Signal Yard', order: 3, segmentType: 'combat', bounds: { center: [22, 0, -12], size: [20, 8, 20] }, entryMarkerId: 'signal_yard_area', exitMarkerIds: ['glitch_hive_terminal'] },
  { id: 'seg_repair_plaza', layoutId: 'layout_sunny_harbor_emergency', name: 'Repair Plaza', order: 4, segmentType: 'repair', bounds: { center: [-6, 0, -28], size: [20, 8, 20] }, entryMarkerId: 'beacon_spot', exitMarkerIds: [] },
  { id: 'seg_harbor_core', layoutId: 'layout_sunny_harbor_emergency', name: 'Harbor Core', order: 5, segmentType: 'boss', bounds: { center: [16, 0, 8], size: [24, 8, 24] }, entryMarkerId: 'harbor_core_terminal', exitMarkerIds: [] },

  { id: 'seg_downtown_arrival', layoutId: 'layout_downtown_traffic_collapse', name: 'Traffic Arrival', order: 1, segmentType: 'landing', bounds: { center: [-18, 0, 4], size: [22, 8, 22] }, entryMarkerId: 'mk_downtown_arrival', exitMarkerIds: ['mk_downtown_intersection'] },
  { id: 'seg_downtown_intersection', layoutId: 'layout_downtown_traffic_collapse', name: 'Shielded Intersection', order: 2, segmentType: 'incident', bounds: { center: [0, 0, 22], size: [30, 8, 28] }, entryMarkerId: 'mk_downtown_intersection', exitMarkerIds: ['mk_downtown_evac'] },
  { id: 'seg_downtown_evac', layoutId: 'layout_downtown_traffic_collapse', name: 'Evacuation Corridor', order: 3, segmentType: 'combat', bounds: { center: [22, 0, 10], size: [28, 8, 22] }, entryMarkerId: 'mk_downtown_evac', exitMarkerIds: ['mk_downtown_command'] },
  { id: 'seg_downtown_command', layoutId: 'layout_downtown_traffic_collapse', name: 'Traffic Command Node', order: 4, segmentType: 'repair', bounds: { center: [0, 0, -22], size: [24, 8, 24] }, entryMarkerId: 'mk_downtown_command', exitMarkerIds: [] },

  { id: 'seg_factory_entry', layoutId: 'layout_factory_core_breakdown', name: 'Factory Entry', order: 1, segmentType: 'landing', bounds: { center: [-20, 0, 0], size: [22, 8, 22] }, entryMarkerId: 'mk_factory_entry', exitMarkerIds: ['mk_factory_assembly'] },
  { id: 'seg_factory_assembly', layoutId: 'layout_factory_core_breakdown', name: 'Assembly Breakdown', order: 2, segmentType: 'incident', bounds: { center: [0, 0, 20], size: [30, 8, 30] }, entryMarkerId: 'mk_factory_assembly', exitMarkerIds: ['mk_factory_hazard'] },
  { id: 'seg_factory_hazard', layoutId: 'layout_factory_core_breakdown', name: 'Hazard Core Bay', order: 3, segmentType: 'combat', bounds: { center: [20, 0, 0], size: [28, 8, 28] }, entryMarkerId: 'mk_factory_hazard', exitMarkerIds: ['mk_factory_control'] },
  { id: 'seg_factory_control', layoutId: 'layout_factory_core_breakdown', name: 'Control Room Repair', order: 4, segmentType: 'elite', bounds: { center: [0, 0, -24], size: [26, 8, 26] }, entryMarkerId: 'mk_factory_control', exitMarkerIds: [] },

  { id: 'seg_tunnel_entrance', layoutId: 'layout_mountain_tunnel_rescue', name: 'Tunnel Entrance', order: 1, segmentType: 'landing', bounds: { center: [-22, 0, 0], size: [24, 8, 24] }, entryMarkerId: 'mk_tunnel_entrance', exitMarkerIds: ['mk_tunnel_collapse'] },
  { id: 'seg_tunnel_collapse', layoutId: 'layout_mountain_tunnel_rescue', name: 'Rock Collapse', order: 2, segmentType: 'obstacle', bounds: { center: [0, 0, 20], size: [30, 8, 28] }, entryMarkerId: 'mk_tunnel_collapse', exitMarkerIds: ['mk_tunnel_rescue'] },
  { id: 'seg_tunnel_rescue', layoutId: 'layout_mountain_tunnel_rescue', name: 'Trapped NPC Rescue', order: 3, segmentType: 'incident', bounds: { center: [22, 0, 0], size: [26, 8, 26] }, entryMarkerId: 'mk_tunnel_rescue', exitMarkerIds: ['mk_tunnel_exit'] },
  { id: 'seg_tunnel_exit', layoutId: 'layout_mountain_tunnel_rescue', name: 'Sniper Exit', order: 4, segmentType: 'elite', bounds: { center: [0, 0, -24], size: [30, 8, 24] }, entryMarkerId: 'mk_tunnel_exit', exitMarkerIds: [] },

  { id: 'seg_skyport_drop', layoutId: 'layout_skyport_core_finale', name: 'Skyport Drop', order: 1, segmentType: 'landing', bounds: { center: [-24, 0, 0], size: [24, 8, 24] }, entryMarkerId: 'mk_skyport_drop', exitMarkerIds: ['mk_skyport_bridge'] },
  { id: 'seg_skyport_bridge', layoutId: 'layout_skyport_core_finale', name: 'Storm Bridge', order: 2, segmentType: 'combat', bounds: { center: [0, 0, 22], size: [32, 8, 30] }, entryMarkerId: 'mk_skyport_bridge', exitMarkerIds: ['mk_skyport_core'] },
  { id: 'seg_skyport_core', layoutId: 'layout_skyport_core_finale', name: 'Core Sentinel', order: 3, segmentType: 'boss', bounds: { center: [20, 0, 0], size: [32, 8, 32] }, entryMarkerId: 'mk_skyport_core', exitMarkerIds: ['mk_skyport_extract'] },
  { id: 'seg_skyport_extract', layoutId: 'layout_skyport_core_finale', name: 'Final Extraction', order: 4, segmentType: 'extraction', bounds: { center: [0, 0, -24], size: [24, 8, 24] }, entryMarkerId: 'mk_skyport_extract', exitMarkerIds: [] },

  { id: 'seg_blackout_arrival', layoutId: 'layout_night_city_blackout', name: 'Blackout Arrival', order: 1, segmentType: 'landing', bounds: { center: [-24, 0, 2], size: [24, 8, 24] }, entryMarkerId: 'mk_blackout_arrival', exitMarkerIds: ['mk_blackout_scan'] },
  { id: 'seg_blackout_scan', layoutId: 'layout_night_city_blackout', name: 'Dark Scan Lane', order: 2, segmentType: 'scan', bounds: { center: [0, 0, 22], size: [30, 8, 30] }, entryMarkerId: 'mk_blackout_scan', exitMarkerIds: ['mk_blackout_power'] },
  { id: 'seg_blackout_power_box', layoutId: 'layout_night_city_blackout', name: 'Power Box Repair', order: 3, segmentType: 'repair', bounds: { center: [22, 0, 0], size: [26, 8, 26] }, entryMarkerId: 'mk_blackout_power', exitMarkerIds: ['mk_blackout_grid'] },
  { id: 'seg_blackout_grid', layoutId: 'layout_night_city_blackout', name: 'District Grid', order: 4, segmentType: 'combat', bounds: { center: [0, 0, -24], size: [32, 8, 30] }, entryMarkerId: 'mk_blackout_grid', exitMarkerIds: [] },

  { id: 'seg_flood_landing', layoutId: 'layout_storm_coast_flood_rescue', name: 'Flood Landing', order: 1, segmentType: 'landing', bounds: { center: [-24, 0, 0], size: [24, 8, 24] }, entryMarkerId: 'mk_flood_landing', exitMarkerIds: ['mk_flood_pump'] },
  { id: 'seg_flood_pump', layoutId: 'layout_storm_coast_flood_rescue', name: 'Pump Device', order: 2, segmentType: 'repair', bounds: { center: [0, 0, 20], size: [30, 8, 28] }, entryMarkerId: 'mk_flood_pump', exitMarkerIds: ['mk_flood_evac'] },
  { id: 'seg_flood_evac', layoutId: 'layout_storm_coast_flood_rescue', name: 'Evacuation Boardwalk', order: 3, segmentType: 'rescue', bounds: { center: [24, 0, 2], size: [28, 8, 26] }, entryMarkerId: 'mk_flood_evac', exitMarkerIds: ['mk_flood_core'] },
  { id: 'seg_flood_hazard_core', layoutId: 'layout_storm_coast_flood_rescue', name: 'Flood Hazard Core', order: 4, segmentType: 'combat', bounds: { center: [0, 0, -24], size: [32, 8, 30] }, entryMarkerId: 'mk_flood_core', exitMarkerIds: [] },

  { id: 'seg_metro_entry', layoutId: 'layout_metro_rescue_labyrinth', name: 'Metro Entry', order: 1, segmentType: 'landing', bounds: { center: [-22, 0, 0], size: [24, 8, 24] }, entryMarkerId: 'mk_metro_entry', exitMarkerIds: ['mk_metro_switch'] },
  { id: 'seg_metro_switch', layoutId: 'layout_metro_rescue_labyrinth', name: 'Switch Room', order: 2, segmentType: 'scan', bounds: { center: [0, 0, 22], size: [30, 8, 28] }, entryMarkerId: 'mk_metro_switch', exitMarkerIds: ['mk_metro_platform'] },
  { id: 'seg_metro_platform', layoutId: 'layout_metro_rescue_labyrinth', name: 'Trapped Platform', order: 3, segmentType: 'incident', bounds: { center: [24, 0, 0], size: [28, 8, 28] }, entryMarkerId: 'mk_metro_platform', exitMarkerIds: ['mk_metro_exit'] },
  { id: 'seg_metro_exit', layoutId: 'layout_metro_rescue_labyrinth', name: 'Exit Route', order: 4, segmentType: 'combat', bounds: { center: [0, 0, -24], size: [30, 8, 28] }, entryMarkerId: 'mk_metro_exit', exitMarkerIds: [] },

  { id: 'seg_tower_base', layoutId: 'layout_aero_tower_high_rescue', name: 'Tower Base', order: 1, segmentType: 'landing', bounds: { center: [-22, 0, 0], size: [24, 8, 24] }, entryMarkerId: 'mk_tower_base', exitMarkerIds: ['mk_tower_lift'] },
  { id: 'seg_tower_lift', layoutId: 'layout_aero_tower_high_rescue', name: 'Broken Lift', order: 2, segmentType: 'obstacle', bounds: { center: [0, 0, 20], size: [28, 8, 28] }, entryMarkerId: 'mk_tower_lift', exitMarkerIds: ['mk_tower_platform'] },
  { id: 'seg_tower_platform', layoutId: 'layout_aero_tower_high_rescue', name: 'High Platform Rescue', order: 3, segmentType: 'rescue', bounds: { center: [22, 0, 0], size: [28, 8, 28] }, entryMarkerId: 'mk_tower_platform', exitMarkerIds: ['mk_tower_antenna'] },
  { id: 'seg_tower_antenna', layoutId: 'layout_aero_tower_high_rescue', name: 'Antenna Stabilizer', order: 4, segmentType: 'combat', bounds: { center: [0, 0, -24], size: [30, 8, 28] }, entryMarkerId: 'mk_tower_antenna', exitMarkerIds: [] },

  { id: 'seg_finale_arrival', layoutId: 'layout_rescue_vanguard_finale', name: 'Finale Arrival', order: 1, segmentType: 'landing', bounds: { center: [-26, 0, 0], size: [24, 8, 24] }, entryMarkerId: 'mk_finale_arrival', exitMarkerIds: ['mk_finale_nodes'] },
  { id: 'seg_finale_crisis_nodes', layoutId: 'layout_rescue_vanguard_finale', name: 'Crisis Nodes', order: 2, segmentType: 'incident', bounds: { center: [0, 0, 24], size: [32, 8, 30] }, entryMarkerId: 'mk_finale_nodes', exitMarkerIds: ['mk_finale_elite'] },
  { id: 'seg_finale_elite_guard', layoutId: 'layout_rescue_vanguard_finale', name: 'Elite Guard', order: 3, segmentType: 'elite', bounds: { center: [24, 0, 0], size: [30, 8, 30] }, entryMarkerId: 'mk_finale_elite', exitMarkerIds: ['mk_finale_core'] },
  { id: 'seg_finale_core', layoutId: 'layout_rescue_vanguard_finale', name: 'Final Core Sentinel', order: 4, segmentType: 'boss', bounds: { center: [0, 0, -26], size: [34, 8, 34] }, entryMarkerId: 'mk_finale_core', exitMarkerIds: [] },
];
