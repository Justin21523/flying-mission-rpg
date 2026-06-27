import type { EnvironmentPropSetDefinition } from '../../types/environmentThemeTypes';

export const SEED_ENVIRONMENT_PROP_SETS: EnvironmentPropSetDefinition[] = [
  { id: 'props_harbor_day', name: 'Harbor Day Props', propIds: ['cargo_crate', 'dock_lamp', 'control_terminal', 'road_cone'], editorMeta: { notes: 'Open road, dock props, harbor control silhouettes.' } },
  { id: 'props_downtown_traffic', name: 'Downtown Traffic Props', propIds: ['traffic_signal', 'evac_barrier', 'stalled_car', 'street_light'], editorMeta: { notes: 'Dense traffic composition with evacuation blockers.' } },
  { id: 'props_factory_core', name: 'Factory Core Props', propIds: ['machine_arm', 'spark_panel', 'pipe_cluster', 'broken_console'], editorMeta: { notes: 'Industrial mechanical failure set.' } },
  { id: 'props_mountain_tunnel', name: 'Mountain Tunnel Props', propIds: ['rock_slide', 'warning_sign', 'rescue_lamp', 'support_beam'], editorMeta: { notes: 'Tunnel collapse and low visibility rescue props.' } },
  { id: 'props_skyport_core', name: 'Skyport Core Props', propIds: ['sky_bridge', 'wind_turbine', 'core_pylon', 'landing_beacon'], editorMeta: { notes: 'High-tech aerial platform finale props.' } },
  { id: 'props_night_city_blackout', name: 'Night City Blackout Props', propIds: ['dark_street_light', 'glowing_sign', 'power_box', 'parked_bus'], editorMeta: { notes: 'Dark street silhouettes with readable glowing repair targets.' } },
  { id: 'props_storm_coast_flood', name: 'Storm Coast Flood Props', propIds: ['pump_station', 'flood_marker', 'rescue_boat', 'wet_barrier'], editorMeta: { notes: 'Flood rescue props and pump objective silhouettes.' } },
  { id: 'props_metro_labyrinth', name: 'Metro Labyrinth Props', propIds: ['rail_switch', 'platform_gate', 'warning_light', 'station_column'], editorMeta: { notes: 'Underground branch route and rail hazard props.' } },
  { id: 'props_aero_tower_wind', name: 'Aero Tower Wind Props', propIds: ['broken_lift', 'antenna_array', 'wind_sock', 'platform_railing'], editorMeta: { notes: 'High platform rescue and antenna props.' } },
  { id: 'props_rescue_vanguard_finale', name: 'Rescue Vanguard Finale Props', propIds: ['crisis_node', 'elite_gate', 'core_pylon_finale', 'support_beacon'], editorMeta: { notes: 'Final mixed crisis set.' } },
];
