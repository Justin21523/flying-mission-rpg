import type { IncidentScenarioDefinition } from '../../types/trafficIncident';

// Phase F — 3 child-friendly, recoverable traffic scenarios the director stages on a path in rescue_hq. Each
// sets up (stalled vehicle / dropped cargo / a gentle bump), blocks the road partially so followers reroute,
// runs a short timeline for a staged feel, then resolves when the player reaches the scene OR after a timeout —
// always cleaning up (entities removed, road unblocked). No crashes-with-harm; severity ≤ 3.
export const TRAFFIC_SCENARIO_SEED: IncidentScenarioDefinition[] = [
  {
    id: 'scn_breakdown', name: 'Vehicle Breakdown', enabled: true, category: 'breakdown', severity: 1,
    requiredLocationTags: [], minParticipants: 1, maxParticipants: 1,
    cooldown: 30, globalCooldown: 10, maxConcurrentInstances: 1, triggerMode: 'randomWeighted', weight: 1,
    setupActions: [
      { type: 'spawnVehicle', vehicleType: 'sedan' },
      { type: 'blockRoad', pathId: '', partial: true },
      { type: 'npcReaction', npcSelector: 'nearby', reaction: 'stopAndLook' },
    ],
    timeline: [
      { atSeconds: 1, actions: [{ type: 'setVehicleState', participant: 'v0', state: 'breakdown' }] },
      { atSeconds: 3, actions: [{ type: 'emitEvent', event: 'breakdown_smoke' }] },
    ],
    resolutionConditions: [{ type: 'playerReached', radius: 4 }, { type: 'timeout', seconds: 60 }],
    cleanupActions: [{ type: 'emitEvent', event: 'breakdown_cleared' }],
  },
  {
    id: 'scn_cargo', name: 'Cargo Drop', enabled: true, category: 'cargoDrop', severity: 2,
    requiredLocationTags: [], minParticipants: 1, maxParticipants: 1,
    cooldown: 40, globalCooldown: 10, maxConcurrentInstances: 1, triggerMode: 'randomWeighted', weight: 1,
    setupActions: [
      { type: 'spawnVehicle', vehicleType: 'truck' },
      { type: 'spawnObstacle', obstacleId: 'crate' },
      { type: 'blockRoad', pathId: '', partial: true },
      { type: 'npcReaction', npcSelector: 'nearby', reaction: 'warnOthers' },
    ],
    timeline: [
      { atSeconds: 2, actions: [{ type: 'spawnObstacle', obstacleId: 'crate2' }] },
      { atSeconds: 4, actions: [{ type: 'emitEvent', event: 'cargo_scattered' }] },
    ],
    resolutionConditions: [{ type: 'playerReached', radius: 5 }, { type: 'timeout', seconds: 60 }],
    cleanupActions: [{ type: 'emitEvent', event: 'cargo_cleared' }],
  },
  {
    id: 'scn_bump', name: 'Controlled Minor Collision', enabled: true, category: 'collision', severity: 3,
    requiredLocationTags: [], minParticipants: 2, maxParticipants: 2,
    cooldown: 50, globalCooldown: 15, maxConcurrentInstances: 1, triggerMode: 'randomWeighted', weight: 1,
    setupActions: [
      { type: 'spawnVehicle', vehicleType: 'sedan' },
      { type: 'spawnVehicle', vehicleType: 'sedan' },
      { type: 'blockRoad', pathId: '', partial: true },
      { type: 'npcReaction', npcSelector: 'nearby', reaction: 'stopAndLook' },
    ],
    timeline: [
      { atSeconds: 1, actions: [{ type: 'setVehicleState', participant: 'v0', state: 'stopped' }, { type: 'setVehicleState', participant: 'v1', state: 'stopped' }] },
      { atSeconds: 3, actions: [{ type: 'npcReaction', npcSelector: 'nearby', reaction: 'callRescue' }] },
    ],
    resolutionConditions: [{ type: 'playerReached', radius: 5 }, { type: 'timeout', seconds: 70 }],
    cleanupActions: [{ type: 'emitEvent', event: 'collision_cleared' }],
  },
];
