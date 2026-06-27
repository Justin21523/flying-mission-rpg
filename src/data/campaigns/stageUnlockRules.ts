import type { CampaignUnlockRule } from '../../types/stageProgressionTypes';

export const RESCUE_VANGUARD_UNLOCK_RULES: CampaignUnlockRule[] = [
  { type: 'start-unlocked', stageId: 'stage_sunny_harbor_emergency' },
  // Batch E — branch fork: clearing the first stage opens a choice of two routes (downtown OR factory).
  { type: 'clear-stage', stageId: 'stage_sunny_harbor_emergency', unlockStageIds: ['stage_downtown_traffic_collapse', 'stage_factory_core_breakdown'] },
  { type: 'clear-stage', stageId: 'stage_downtown_traffic_collapse', unlockStageIds: ['stage_factory_core_breakdown'] },
  // World-build W1 — fork: factory opens the mountain or skyport route.
  { type: 'clear-stage', stageId: 'stage_factory_core_breakdown', unlockStageIds: ['stage_mountain_tunnel_rescue', 'stage_skyport_core_finale'] },
  { type: 'clear-stage', stageId: 'stage_mountain_tunnel_rescue', unlockStageIds: ['stage_skyport_core_finale'] },
  // World-build W1 — fork: skyport opens the blackout or storm-coast route.
  { type: 'clear-stage', stageId: 'stage_skyport_core_finale', unlockStageIds: ['stage_night_city_blackout', 'stage_storm_coast_flood_rescue'] },
  { type: 'clear-stage', stageId: 'stage_night_city_blackout', unlockStageIds: ['stage_storm_coast_flood_rescue'] },
  { type: 'clear-stage', stageId: 'stage_storm_coast_flood_rescue', unlockStageIds: ['stage_metro_rescue_labyrinth'] },
  { type: 'clear-stage', stageId: 'stage_metro_rescue_labyrinth', unlockStageIds: ['stage_aero_tower_high_rescue'] },
  { type: 'clear-stage', stageId: 'stage_aero_tower_high_rescue', unlockStageIds: ['stage_rescue_vanguard_finale'] },
];
