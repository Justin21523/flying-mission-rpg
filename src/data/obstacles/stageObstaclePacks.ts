export type StageObstaclePackDefinition = {
  id: string;
  stageId: string;
  name: string;
  obstacleIds: string[];
  editorMeta?: { notes?: string };
};

export const STAGE_OBSTACLE_PACKS: StageObstaclePackDefinition[] = [
  { id: 'obstacles_stage1_harbor', stageId: 'stage_sunny_harbor_emergency', name: 'Harbor Tutorial Obstacles', obstacleIds: ['cracked_wall_01', 'corrupted_device_01'], editorMeta: { notes: 'Heavy break then repair terminal.' } },
  { id: 'obstacles_stage2_downtown', stageId: 'stage_downtown_traffic_collapse', name: 'Downtown Traffic Obstacles', obstacleIds: ['downtown_energy_barrier_01', 'downtown_traffic_command_device'], editorMeta: { notes: 'Shield/traffic command obstacles.' } },
  { id: 'obstacles_stage3_factory', stageId: 'stage_factory_core_breakdown', name: 'Factory Repair Obstacles', obstacleIds: ['factory_corrupted_device_01', 'factory_core_device_01'], editorMeta: { notes: 'Scan and repair targets.' } },
  { id: 'obstacles_stage4_mountain', stageId: 'stage_mountain_tunnel_rescue', name: 'Mountain Tunnel Obstacles', obstacleIds: ['tunnel_cracked_wall_01', 'tunnel_gate_core_01'], editorMeta: { notes: 'Heavy break wall and exit gate.' } },
  { id: 'obstacles_stage5_skyport', stageId: 'stage_skyport_core_finale', name: 'Skyport Barrier Obstacles', obstacleIds: ['skyport_barrier_node_device_01'], editorMeta: { notes: 'Barrier node before boss.' } },
  { id: 'obstacles_stage6_blackout', stageId: 'stage_night_city_blackout', name: 'Blackout Power Obstacles', obstacleIds: ['blackout_power_box_01', 'blackout_energy_barrier_01'], editorMeta: { notes: 'Power box and dark barrier.' } },
  { id: 'obstacles_stage7_flood', stageId: 'stage_storm_coast_flood_rescue', name: 'Storm Flood Obstacles', obstacleIds: ['storm_pump_device_01', 'storm_flooded_path_01'], editorMeta: { notes: 'Pump repair and route hazard.' } },
  { id: 'obstacles_stage8_metro', stageId: 'stage_metro_rescue_labyrinth', name: 'Metro Route Obstacles', obstacleIds: ['metro_locked_core_01', 'metro_energy_barrier_01'], editorMeta: { notes: 'Locked exit and electric rail barrier.' } },
  { id: 'obstacles_stage9_tower', stageId: 'stage_aero_tower_high_rescue', name: 'Aero Tower Obstacles', obstacleIds: ['tower_broken_lift_01', 'tower_antenna_device_01'], editorMeta: { notes: 'Lift repair and antenna stabilization.' } },
  { id: 'obstacles_stage10_finale', stageId: 'stage_rescue_vanguard_finale', name: 'Finale Crisis Obstacles', obstacleIds: ['finale_crisis_node_01', 'finale_core_barrier_01'], editorMeta: { notes: 'Crisis nodes and final barrier.' } },
];
