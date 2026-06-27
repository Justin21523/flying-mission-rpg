import type { ZonePropDefinition } from '../../types/game/zoneProp';

// World-build Wave 2 — seed decorative props per zone (themed to each biome, real public/models/** GLBs).
// Placed around each zone's landing area (centers ≈ x -18..-26, z 0..4). Zone-wide (no segmentId) so they
// dress the whole zone. All gizmo-draggable + editable in the 🌳 Zone Props tab; contentIntegrity verifies models.
const p = (id: string, zoneId: string, modelAssetId: string, position: [number, number, number], extra: Partial<ZonePropDefinition> = {}): ZonePropDefinition => ({
  id, zoneId, modelAssetId, position, scale: 1, enabled: true, ...extra,
});

export const SEED_ZONE_PROPS: ZonePropDefinition[] = [
  // Sunny Harbor — docks + cargo
  p('zprop_harbor_crates', 'zone_sunny_harbor_advanced_foundation', 'harbors/colorful cargo crates 3d model', [-10, 0, 10]),
  p('zprop_harbor_crane', 'zone_sunny_harbor_advanced_foundation', 'harbors/port crane 3d model', [-26, 0, 12], { scale: 1.2 }),
  p('zprop_harbor_bollard', 'zone_sunny_harbor_advanced_foundation', 'harbors/harbor bollard 3d model', [-14, 0, -4]),
  p('zprop_harbor_dock', 'zone_sunny_harbor_advanced_foundation', 'decor/wooden dock 3d model', [-20, 0, 14]),

  // Downtown — street furniture
  p('zprop_downtown_sign', 'zone_downtown_traffic_collapse', 'decor/highway sign 3d model', [-12, 0, 8]),
  p('zprop_downtown_guardrail', 'zone_downtown_traffic_collapse', 'decor/highway guardrail 3d model', [-26, 0, 6]),
  p('zprop_downtown_bench', 'zone_downtown_traffic_collapse', 'props/wooden bench 3d model', [-16, 0, -6]),
  p('zprop_downtown_vending', 'zone_downtown_traffic_collapse', 'props/vending machine 3d model', [-22, 0, -8]),

  // Factory — crates + containers
  p('zprop_factory_container', 'zone_factory_core_breakdown', 'props/shipping container 3d model', [-14, 0, 10], { scale: 1.1 }),
  p('zprop_factory_boxes', 'zone_factory_core_breakdown', 'props/stacked cardboard boxes 3d model', [-28, 0, 8]),
  p('zprop_factory_crate', 'zone_factory_core_breakdown', 'props/wooden crate 3d model', [-18, 0, -6]),
  p('zprop_factory_shelf', 'zone_factory_core_breakdown', 'props/colorful shelving unit 3d model', [-24, 0, -10]),

  // Mountain Tunnel — rocks + trees
  p('zprop_tunnel_boulder', 'zone_mountain_tunnel_rescue', 'decor/rock boulder 3d model', [-12, 0, 10], { scale: 1.3 }),
  p('zprop_tunnel_mountain', 'zone_mountain_tunnel_rescue', 'decor/stylized mountain 3d model', [-30, 0, 14], { scale: 1.5 }),
  p('zprop_tunnel_tree', 'zone_mountain_tunnel_rescue', 'decor/stylized tree 3d model', [-16, 0, -8]),
  p('zprop_tunnel_stump', 'zone_mountain_tunnel_rescue', 'decor/tree stump 3d model', [-26, 0, -10]),

  // Skyport — airport props
  p('zprop_skyport_kiosk', 'zone_skyport_core_finale', 'props/airport check-in kiosk 3d model', [-14, 0, 10]),
  p('zprop_skyport_railing', 'zone_skyport_core_finale', 'props/safety railing 3d model', [-26, 0, 8]),
  p('zprop_skyport_rings', 'zone_skyport_core_finale', 'props/colorful ring stack 3d model', [-18, 0, -6]),
  p('zprop_skyport_sign', 'zone_skyport_core_finale', 'props/standing signpost 3d model', [-24, 0, -8]),

  // Night City Blackout — streets + lanterns
  p('zprop_blackout_house', 'zone_night_city_blackout', 'decor/stylized house 3d model', [-12, 0, 12], { scale: 1.2 }),
  p('zprop_blackout_lantern', 'zone_night_city_blackout', 'decor/japanese lantern 3d model', [-26, 0, 8]),
  p('zprop_blackout_lamp', 'zone_night_city_blackout', 'props/stylized lamp 3d model', [-16, 0, -6]),
  p('zprop_blackout_sign', 'zone_night_city_blackout', 'decor/colorful wooden signpost 3d model', [-24, 0, -10]),

  // Storm Coast Flood — beach + rescue
  p('zprop_storm_buoy', 'zone_storm_coast_flood_rescue', 'coasts/red white buoy 3d model', [-12, 0, 10]),
  p('zprop_storm_tower', 'zone_storm_coast_flood_rescue', 'coasts/lifeguard tower 3d model', [-26, 0, 12], { scale: 1.2 }),
  p('zprop_storm_guardrail', 'zone_storm_coast_flood_rescue', 'coasts/coastal guardrail 3d model', [-16, 0, -6]),
  p('zprop_storm_driftwood', 'zone_storm_coast_flood_rescue', 'coasts/driftwood and seaweed 3d model', [-22, 0, -8]),

  // Metro — platform furniture
  p('zprop_metro_railing', 'zone_metro_rescue_labyrinth', 'props/safety railing 3d model', [-12, 0, 8]),
  p('zprop_metro_bench', 'zone_metro_rescue_labyrinth', 'props/wooden bench 3d model', [-26, 0, 6]),
  p('zprop_metro_vending', 'zone_metro_rescue_labyrinth', 'props/vending machine 3d model', [-16, 0, -6]),
  p('zprop_metro_sign', 'zone_metro_rescue_labyrinth', 'props/standing signpost 3d model', [-24, 0, -8]),

  // Aero Tower — tower props
  p('zprop_tower_kiosk', 'zone_aero_tower_high_rescue', 'props/airport check-in kiosk 3d model', [-14, 0, 10]),
  p('zprop_tower_handrail', 'zone_aero_tower_high_rescue', 'props/colorful handrail 3d model', [-28, 0, 8]),
  p('zprop_tower_railing', 'zone_aero_tower_high_rescue', 'props/safety railing 3d model', [-18, 0, -6]),
  p('zprop_tower_plant', 'zone_aero_tower_high_rescue', 'props/potted plant 3d model', [-24, 0, -10]),

  // Vanguard Finale — ceremonial
  p('zprop_finale_torii', 'zone_rescue_vanguard_finale', 'decor/torii gate 3d model', [-14, 0, 10], { scale: 1.3 }),
  p('zprop_finale_flower', 'zone_rescue_vanguard_finale', 'decor/glowing flower 3d model', [-26, 0, 8]),
  p('zprop_finale_tree', 'zone_rescue_vanguard_finale', 'decor/stylized tree 3d model', [-18, 0, -6]),
  p('zprop_finale_bush', 'zone_rescue_vanguard_finale', 'decor/round leafy bush 3d model', [-24, 0, -10]),
];
