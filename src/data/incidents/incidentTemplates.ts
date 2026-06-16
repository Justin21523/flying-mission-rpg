import type { IncidentTemplate } from '../../types/incidentTemplateTypes';
import type { IncidentObjectiveStep, IncidentCondition } from '../../types/incidentTypes';
import { npcChange, objectChange, obstacleChange, envChange } from './incidentStateChangePresets';
import { repairSolution, clearObstacleSolution, scanSolution, protectSolution, rescueSolution, medicalSolution, trafficControlSolution, scanRevealSolution } from './incidentSolutionPresets';

// 5 seed Incident TEMPLATES (Batch G §6). Slot ids ('npc#0', 'obstacle#0', 'device#0', 'enemy#0', 'area#main')
// are substituted with live world ids by the AIIncidentMockProvider. Every template offers ≥2 solutions so no
// single character is mandatory. defaultObjectives/conditions reference the slot ids; success requires the
// non-optional steps' conditions.
const NPC0 = 'npc#0', NPC1 = 'npc#1', OBJ0 = 'object#0', OBS0 = 'obstacle#0', DEV0 = 'device#0', AREA = 'area#main';

let o = 0;
function step(p: Partial<IncidentObjectiveStep> & Pick<IncidentObjectiveStep, 'label' | 'objectiveType' | 'completionConditions'>): IncidentObjectiveStep {
  return { id: `obj_${o++}`, optional: false, order: o, ...p };
}
const reach = (): IncidentCondition => ({ type: 'player-reached-area', areaId: AREA, radius: 8 });

const ROAD_ACCIDENT: IncidentTemplate = {
  id: 'tmpl_road_accident', incidentType: 'road-accident',
  title: 'Cargo Street Pile-up', description: 'A stalled cargo truck blocks the street, debris scattered, two bystanders panicking.',
  dangerLevel: 2, recommendedCharacterIds: ['char_paul', 'char_donnie', 'char_jett'], requiredRescueRoles: ['traffic-control', 'repair', 'air-rescue'],
  npcSlotCount: 2, objectSlotCount: 1, obstacleSlotCount: 1, deviceSlotCount: 0, enemyGroupSlotCount: 0,
  defaultObjectives: [
    step({ label: 'Reach the accident', objectiveType: 'reach-area', targetId: AREA, targetType: 'area', completionConditions: [reach()], uiHint: 'Jett: dash to the scene' }),
    step({ label: 'Protect the area', objectiveType: 'protect-area', targetId: AREA, targetType: 'area', requiredRoleTags: ['traffic-control', 'shield'], completionConditions: [{ type: 'support-used', supportAbilityId: 'support_paul_shield' }], optional: true, uiHint: 'Paul: block traffic / shield' }),
    step({ label: 'Clear the blockage', objectiveType: 'clear-obstacle', targetId: OBS0, targetType: 'obstacle', requiredRoleTags: ['heavy-break', 'engineering'], completionConditions: [{ type: 'obstacle-state', obstacleId: OBS0, state: 'cleared' }], uiHint: 'Donnie: clear debris' }),
    step({ label: 'Evacuate the bystanders', objectiveType: 'evacuate-npc', targetId: NPC0, targetType: 'npc', requiredRoleTags: ['evacuation', 'air-rescue'], completionConditions: [{ type: 'npc-state', npcId: NPC0, state: 'safe' }], uiHint: 'Escort the NPC to safety' }),
  ],
  defaultInitialStateChanges: [npcChange(NPC0, 'set-panicked'), npcChange(NPC1, 'set-waiting-rescue'), objectChange(OBJ0, 'set-blocking-path'), obstacleChange(OBS0, 'activate'), envChange(AREA, 'set-danger-zone')],
  defaultSolutions: [clearObstacleSolution(OBS0, [obstacleChange(OBS0, 'clear')]), protectSolution(AREA), rescueSolution(NPC0, [npcChange(NPC0, 'set-safe')])],
  defaultPostSuccessStateChanges: [envChange(AREA, 'clear-danger-zone'), npcChange(NPC1, 'set-safe'), objectChange(OBJ0, 'set-active')],
  timeLimitSeconds: 180, aiControlParameters: { allowEscalation: true, escalationIntervalSeconds: 45, maxEscalationLevel: 3, allowNPCStateChanges: true, allowObjectStateChanges: true, allowEnvironmentStateChanges: true },
  editorMeta: { tags: ['traffic', 'rescue'], difficulty: 'easy' }, enabled: true,
};

const FIRE_EVENT: IncidentTemplate = {
  id: 'tmpl_fire_event', incidentType: 'fire-event',
  title: 'Harbor Warehouse Fire', description: 'A fire source spreads smoke through the warehouse; a worker is trapped and needs evacuation.',
  dangerLevel: 4, recommendedCharacterIds: ['char_paul', 'char_bello', 'char_jett'], requiredRescueRoles: ['fire-rescue', 'medical', 'evacuation', 'shield'],
  npcSlotCount: 2, objectSlotCount: 0, obstacleSlotCount: 0, deviceSlotCount: 1, enemyGroupSlotCount: 0,
  defaultObjectives: [
    step({ label: 'Reach the fire', objectiveType: 'reach-area', targetId: AREA, targetType: 'area', completionConditions: [reach()] }),
    step({ label: 'Shield the trapped worker', objectiveType: 'protect-area', targetId: AREA, targetType: 'area', requiredRoleTags: ['shield'], completionConditions: [{ type: 'support-used', supportAbilityId: 'support_paul_shield' }], uiHint: 'Paul: shield the area' }),
    step({ label: 'Shut off the fire valve', objectiveType: 'repair-device', targetId: DEV0, targetType: 'device', requiredRoleTags: ['repair', 'engineering'], completionConditions: [{ type: 'device-repaired', deviceId: DEV0 }], uiHint: 'Donnie/Chase: repair the valve' }),
    step({ label: 'Clear the danger zone', objectiveType: 'extinguish-fire-placeholder', targetId: AREA, targetType: 'area', completionConditions: [{ type: 'object-state', objectId: AREA, state: 'cleared' }] }),
    step({ label: 'Evacuate the worker', objectiveType: 'evacuate-npc', targetId: NPC0, targetType: 'npc', requiredRoleTags: ['evacuation', 'medical'], completionConditions: [{ type: 'npc-state', npcId: NPC0, state: 'safe' }] }),
  ],
  defaultInitialStateChanges: [npcChange(NPC0, 'set-trapped'), npcChange(NPC1, 'set-panicked'), envChange(AREA, 'spawn-fire-placeholder'), envChange(AREA, 'spawn-smoke'), envChange(AREA, 'set-danger-zone')],
  defaultSolutions: [protectSolution(AREA, ['shield', 'fire-rescue']), repairSolution(DEV0, [obstacleChange(DEV0, 'repair')]), rescueSolution(NPC0, [npcChange(NPC0, 'set-safe')])],
  defaultPostSuccessStateChanges: [envChange(AREA, 'clear-danger-zone'), npcChange(NPC1, 'set-safe')],
  defaultEscalationEffects: [
    [npcChange(NPC1, 'set-panicked'), envChange(AREA, 'spawn-fire-placeholder')],
    [npcChange(NPC0, 'set-injured'), envChange(AREA, 'spawn-smoke')],
    [npcChange(NPC1, 'set-injured')],
  ],
  timeLimitSeconds: 150, aiControlParameters: { allowEscalation: true, escalationIntervalSeconds: 30, maxEscalationLevel: 4, allowNPCStateChanges: true, allowObjectStateChanges: true, allowEnvironmentStateChanges: true },
  editorMeta: { tags: ['fire', 'rescue'], difficulty: 'hard' }, enabled: true,
};

const MECHANICAL_FAILURE: IncidentTemplate = {
  id: 'tmpl_mechanical_failure', incidentType: 'mechanical-failure',
  title: 'Repair Plaza Breakdown', description: 'A corrupted device powers an energy barrier blocking the plaza. Scan the fault, repair it, drop the barrier.',
  dangerLevel: 3, recommendedCharacterIds: ['char_chase', 'char_donnie'], requiredRescueRoles: ['scan', 'repair', 'engineering'],
  npcSlotCount: 1, objectSlotCount: 0, obstacleSlotCount: 1, deviceSlotCount: 1, enemyGroupSlotCount: 0,
  defaultObjectives: [
    step({ label: 'Scan the fault', objectiveType: 'scan-target', targetId: DEV0, targetType: 'device', requiredRoleTags: ['scan'], completionConditions: [{ type: 'support-used', supportAbilityId: 'support_chase_scan' }], uiHint: 'Chase: scan the device' }),
    step({ label: 'Repair the device', objectiveType: 'repair-device', targetId: DEV0, targetType: 'device', requiredRoleTags: ['repair', 'engineering'], completionConditions: [{ type: 'device-repaired', deviceId: DEV0 }], uiHint: 'Donnie/Support: repair' }),
    step({ label: 'Clear the energy barrier', objectiveType: 'clear-obstacle', targetId: OBS0, targetType: 'obstacle', completionConditions: [{ type: 'obstacle-state', obstacleId: OBS0, state: 'cleared' }] }),
  ],
  defaultInitialStateChanges: [npcChange(NPC0, 'set-waiting-rescue'), obstacleChange(DEV0, 'damage'), obstacleChange(OBS0, 'activate'), envChange(AREA, 'spawn-electric-hazard')],
  defaultSolutions: [scanSolution(DEV0, []), repairSolution(DEV0, [obstacleChange(DEV0, 'repair')]), clearObstacleSolution(OBS0, [obstacleChange(OBS0, 'clear')])],
  defaultPostSuccessStateChanges: [envChange(AREA, 'clear-danger-zone'), npcChange(NPC0, 'set-safe')],
  timeLimitSeconds: 180, aiControlParameters: { allowEscalation: true, escalationIntervalSeconds: 50, maxEscalationLevel: 3, allowNPCStateChanges: true, allowObjectStateChanges: true, allowEnvironmentStateChanges: true },
  editorMeta: { tags: ['repair', 'engineering'], difficulty: 'normal' }, enabled: true,
};

const NPC_TRAPPED: IncidentTemplate = {
  id: 'tmpl_npc_trapped', incidentType: 'npc-trapped',
  title: 'Trapped Behind Debris', description: 'A bystander is trapped behind a collapsed wall and must be freed and escorted to safety.',
  dangerLevel: 2, recommendedCharacterIds: ['char_jett', 'char_paul', 'char_donnie'], requiredRescueRoles: ['heavy-break', 'air-rescue', 'evacuation'],
  npcSlotCount: 1, objectSlotCount: 0, obstacleSlotCount: 1, deviceSlotCount: 0, enemyGroupSlotCount: 0,
  defaultObjectives: [
    step({ label: 'Reach the trapped NPC', objectiveType: 'reach-area', targetId: AREA, targetType: 'area', completionConditions: [reach()] }),
    step({ label: 'Break the debris', objectiveType: 'clear-obstacle', targetId: OBS0, targetType: 'obstacle', requiredRoleTags: ['heavy-break'], completionConditions: [{ type: 'obstacle-state', obstacleId: OBS0, state: 'cleared' }] }),
    step({ label: 'Stabilize the NPC', objectiveType: 'stabilize-npc', targetId: NPC0, targetType: 'npc', requiredRoleTags: ['medical'], completionConditions: [{ type: 'npc-state', npcId: NPC0, state: 'waiting-rescue' }], optional: true }),
    step({ label: 'Escort to safety', objectiveType: 'evacuate-npc', targetId: NPC0, targetType: 'npc', requiredRoleTags: ['evacuation', 'air-rescue'], completionConditions: [{ type: 'npc-state', npcId: NPC0, state: 'safe' }] }),
  ],
  defaultInitialStateChanges: [npcChange(NPC0, 'set-trapped'), obstacleChange(OBS0, 'activate'), envChange(AREA, 'set-danger-zone')],
  defaultSolutions: [clearObstacleSolution(OBS0, [obstacleChange(OBS0, 'clear')]), rescueSolution(NPC0, [npcChange(NPC0, 'set-safe')])],
  defaultPostSuccessStateChanges: [envChange(AREA, 'clear-danger-zone')],
  timeLimitSeconds: 160, aiControlParameters: { allowEscalation: true, escalationIntervalSeconds: 45, maxEscalationLevel: 2, allowNPCStateChanges: true, allowObjectStateChanges: true, allowEnvironmentStateChanges: true },
  editorMeta: { tags: ['rescue'], difficulty: 'easy' }, enabled: true,
};

const MULTI_STAGE: IncidentTemplate = {
  id: 'tmpl_multi_stage_composite', incidentType: 'multi-stage-composite',
  title: 'Harbor Crisis Chain', description: 'A road accident, a corrupted device and a hostile glitch swarm chain together — scan, protect, repair, clear, rescue.',
  dangerLevel: 5, recommendedCharacterIds: ['char_jett', 'char_donnie', 'char_paul', 'char_chase'], requiredRescueRoles: ['scan', 'traffic-control', 'repair', 'air-rescue', 'combat'],
  npcSlotCount: 2, objectSlotCount: 1, obstacleSlotCount: 1, deviceSlotCount: 1, enemyGroupSlotCount: 1,
  defaultObjectives: [
    step({ label: 'Scan for the source', objectiveType: 'scan-target', targetId: DEV0, targetType: 'device', requiredRoleTags: ['scan'], completionConditions: [{ type: 'support-used', supportAbilityId: 'support_chase_scan' }] }),
    step({ label: 'Protect the crowd', objectiveType: 'protect-area', targetId: AREA, targetType: 'area', requiredRoleTags: ['traffic-control', 'shield'], completionConditions: [{ type: 'support-used', supportAbilityId: 'support_paul_shield' }] }),
    step({ label: 'Repair the device', objectiveType: 'repair-device', targetId: DEV0, targetType: 'device', requiredRoleTags: ['repair'], completionConditions: [{ type: 'device-repaired', deviceId: DEV0 }] }),
    step({ label: 'Clear the blockage / swarm', objectiveType: 'clear-obstacle', targetId: OBS0, targetType: 'obstacle', requiredRoleTags: ['heavy-break', 'combat'], completionConditions: [{ type: 'obstacle-state', obstacleId: OBS0, state: 'cleared' }] }),
    step({ label: 'Evacuate the bystanders', objectiveType: 'evacuate-npc', targetId: NPC0, targetType: 'npc', requiredRoleTags: ['evacuation', 'air-rescue'], completionConditions: [{ type: 'npc-state', npcId: NPC0, state: 'safe' }] }),
  ],
  defaultInitialStateChanges: [npcChange(NPC0, 'set-panicked'), npcChange(NPC1, 'set-trapped'), objectChange(OBJ0, 'set-blocking-path'), obstacleChange(OBS0, 'activate'), obstacleChange(DEV0, 'damage'), envChange(AREA, 'set-danger-zone'), envChange(AREA, 'spawn-smoke')],
  defaultSolutions: [scanSolution(DEV0, []), protectSolution(AREA), repairSolution(DEV0, [obstacleChange(DEV0, 'repair')]), clearObstacleSolution(OBS0, [obstacleChange(OBS0, 'clear')]), rescueSolution(NPC0, [npcChange(NPC0, 'set-safe')])],
  defaultPostSuccessStateChanges: [envChange(AREA, 'clear-danger-zone'), npcChange(NPC1, 'set-safe'), objectChange(OBJ0, 'set-active')],
  timeLimitSeconds: 240, aiControlParameters: { allowEscalation: true, escalationIntervalSeconds: 40, maxEscalationLevel: 5, allowNPCStateChanges: true, allowObjectStateChanges: true, allowEnvironmentStateChanges: true },
  editorMeta: { tags: ['composite', 'boss-prelude'], difficulty: 'hard' }, enabled: true,
};

// ── Batch H — 7 more templates so every IncidentType has a seed ──
const aiFull = { allowEscalation: true, escalationIntervalSeconds: 45, maxEscalationLevel: 3, allowNPCStateChanges: true, allowObjectStateChanges: true, allowEnvironmentStateChanges: true };

const BUILDING_DAMAGED: IncidentTemplate = {
  id: 'tmpl_building_damaged', incidentType: 'building-damaged',
  title: 'Unsafe Structure', description: 'A damaged building sheds debris; a resident is stuck inside and must be reached and evacuated.',
  dangerLevel: 3, recommendedCharacterIds: ['char_donnie', 'char_paul', 'char_jett'], requiredRescueRoles: ['engineering', 'shield', 'evacuation'],
  npcSlotCount: 1, objectSlotCount: 0, obstacleSlotCount: 1, deviceSlotCount: 0, enemyGroupSlotCount: 0,
  defaultObjectives: [
    step({ label: 'Reach the building', objectiveType: 'reach-area', targetId: AREA, targetType: 'area', completionConditions: [reach()] }),
    step({ label: 'Shore up + clear debris', objectiveType: 'clear-obstacle', targetId: OBS0, targetType: 'obstacle', requiredRoleTags: ['engineering', 'heavy-break'], completionConditions: [{ type: 'obstacle-state', obstacleId: OBS0, state: 'cleared' }] }),
    step({ label: 'Evacuate the resident', objectiveType: 'evacuate-npc', targetId: NPC0, targetType: 'npc', requiredRoleTags: ['evacuation'], completionConditions: [{ type: 'npc-state', npcId: NPC0, state: 'safe' }] }),
  ],
  defaultInitialStateChanges: [npcChange(NPC0, 'set-trapped'), obstacleChange(OBS0, 'activate'), envChange(AREA, 'set-danger-zone')],
  defaultSolutions: [clearObstacleSolution(OBS0, [obstacleChange(OBS0, 'clear')]), protectSolution(AREA, ['shield', 'engineering']), rescueSolution(NPC0, [npcChange(NPC0, 'set-safe')])],
  defaultPostSuccessStateChanges: [envChange(AREA, 'clear-danger-zone')],
  defaultEscalationEffects: [[npcChange(NPC0, 'set-panicked'), envChange(AREA, 'spawn-smoke')], [npcChange(NPC0, 'set-injured')]],
  timeLimitSeconds: 170, aiControlParameters: aiFull, editorMeta: { tags: ['structure', 'rescue'], difficulty: 'normal' }, enabled: true,
};

const BRIDGE_COLLAPSE: IncidentTemplate = {
  id: 'tmpl_bridge_collapse', incidentType: 'bridge-collapse',
  title: 'Bridge Down', description: 'A crossing has failed and blocks the route; a traveller is trapped on the far side.',
  dangerLevel: 4, recommendedCharacterIds: ['char_todd', 'char_donnie', 'char_jett'], requiredRescueRoles: ['heavy-break', 'engineering', 'air-rescue'],
  npcSlotCount: 1, objectSlotCount: 0, obstacleSlotCount: 1, deviceSlotCount: 0, enemyGroupSlotCount: 0,
  defaultObjectives: [
    step({ label: 'Reach the crossing', objectiveType: 'reach-area', targetId: AREA, targetType: 'area', completionConditions: [reach()] }),
    step({ label: 'Break through the rubble', objectiveType: 'clear-obstacle', targetId: OBS0, targetType: 'obstacle', requiredRoleTags: ['heavy-break'], completionConditions: [{ type: 'obstacle-state', obstacleId: OBS0, state: 'cleared' }] }),
    step({ label: 'Air-lift the traveller', objectiveType: 'evacuate-npc', targetId: NPC0, targetType: 'npc', requiredRoleTags: ['air-rescue', 'evacuation'], completionConditions: [{ type: 'npc-state', npcId: NPC0, state: 'safe' }] }),
  ],
  defaultInitialStateChanges: [npcChange(NPC0, 'set-trapped'), obstacleChange(OBS0, 'activate'), envChange(AREA, 'block-route'), envChange(AREA, 'set-danger-zone')],
  defaultSolutions: [clearObstacleSolution(OBS0, [obstacleChange(OBS0, 'clear')]), rescueSolution(NPC0, [npcChange(NPC0, 'set-safe')])],
  defaultPostSuccessStateChanges: [envChange(AREA, 'open-route'), envChange(AREA, 'clear-danger-zone')],
  defaultEscalationEffects: [[npcChange(NPC0, 'set-panicked')], [envChange(AREA, 'spawn-flood-placeholder'), npcChange(NPC0, 'set-injured')]],
  timeLimitSeconds: 160, aiControlParameters: aiFull, editorMeta: { tags: ['collapse', 'rescue'], difficulty: 'hard' }, enabled: true,
};

const FLOOD_OR_LEAK: IncidentTemplate = {
  id: 'tmpl_flood_or_leak', incidentType: 'flood-or-leak',
  title: 'Burst Main', description: 'Water floods the area and threatens a device; shut the valve and get the bystander out.',
  dangerLevel: 3, recommendedCharacterIds: ['char_donnie', 'char_chase', 'char_paul'], requiredRescueRoles: ['repair', 'evacuation', 'scan'],
  npcSlotCount: 1, objectSlotCount: 0, obstacleSlotCount: 0, deviceSlotCount: 1, enemyGroupSlotCount: 0,
  defaultObjectives: [
    step({ label: 'Find the valve', objectiveType: 'scan-target', targetId: DEV0, targetType: 'device', requiredRoleTags: ['scan'], completionConditions: [{ type: 'support-used', supportAbilityId: 'support_chase_scan' }], optional: true }),
    step({ label: 'Shut the valve', objectiveType: 'repair-device', targetId: DEV0, targetType: 'device', requiredRoleTags: ['repair', 'engineering'], completionConditions: [{ type: 'device-repaired', deviceId: DEV0 }] }),
    step({ label: 'Evacuate the bystander', objectiveType: 'evacuate-npc', targetId: NPC0, targetType: 'npc', requiredRoleTags: ['evacuation'], completionConditions: [{ type: 'npc-state', npcId: NPC0, state: 'safe' }] }),
  ],
  defaultInitialStateChanges: [npcChange(NPC0, 'set-waiting-rescue'), obstacleChange(DEV0, 'damage'), envChange(AREA, 'spawn-flood-placeholder'), envChange(AREA, 'set-danger-zone')],
  defaultSolutions: [scanRevealSolution(DEV0, []), repairSolution(DEV0, [obstacleChange(DEV0, 'repair')]), rescueSolution(NPC0, [npcChange(NPC0, 'set-safe')])],
  defaultPostSuccessStateChanges: [envChange(AREA, 'clear-danger-zone'), npcChange(NPC0, 'set-safe')],
  defaultEscalationEffects: [[envChange(AREA, 'spawn-flood-placeholder'), npcChange(NPC0, 'set-panicked')], [npcChange(NPC0, 'set-injured')]],
  timeLimitSeconds: 170, aiControlParameters: aiFull, editorMeta: { tags: ['flood', 'repair'], difficulty: 'normal' }, enabled: true,
};

const POWER_OUTAGE: IncidentTemplate = {
  id: 'tmpl_power_outage', incidentType: 'power-outage',
  title: 'Grid Down', description: 'Power is out; a faulty unit must be scanned and repaired to restore the door and signals.',
  dangerLevel: 2, recommendedCharacterIds: ['char_chase', 'char_donnie'], requiredRescueRoles: ['scan', 'repair', 'engineering'],
  npcSlotCount: 1, objectSlotCount: 0, obstacleSlotCount: 1, deviceSlotCount: 1, enemyGroupSlotCount: 0,
  defaultObjectives: [
    step({ label: 'Scan the fault', objectiveType: 'scan-target', targetId: DEV0, targetType: 'device', requiredRoleTags: ['scan'], completionConditions: [{ type: 'support-used', supportAbilityId: 'support_chase_scan' }] }),
    step({ label: 'Repair the unit', objectiveType: 'repair-device', targetId: DEV0, targetType: 'device', requiredRoleTags: ['repair'], completionConditions: [{ type: 'device-repaired', deviceId: DEV0 }] }),
    step({ label: 'Reopen the door', objectiveType: 'clear-obstacle', targetId: OBS0, targetType: 'obstacle', completionConditions: [{ type: 'obstacle-state', obstacleId: OBS0, state: 'cleared' }] }),
  ],
  defaultInitialStateChanges: [npcChange(NPC0, 'set-waiting-rescue'), obstacleChange(DEV0, 'damage'), obstacleChange(OBS0, 'lock'), envChange(AREA, 'spawn-electric-hazard')],
  defaultSolutions: [scanRevealSolution(DEV0, []), repairSolution(DEV0, [obstacleChange(DEV0, 'repair')]), clearObstacleSolution(OBS0, [obstacleChange(OBS0, 'unlock')])],
  defaultPostSuccessStateChanges: [envChange(AREA, 'clear-danger-zone'), npcChange(NPC0, 'set-safe')],
  timeLimitSeconds: 180, aiControlParameters: aiFull, editorMeta: { tags: ['power', 'repair'], difficulty: 'easy' }, enabled: true,
};

const TRAFFIC_CHAOS: IncidentTemplate = {
  id: 'tmpl_traffic_chaos', incidentType: 'traffic-chaos',
  title: 'Gridlock', description: 'Failed signals snarl traffic and panic bystanders; control the flow and clear the crowd.',
  dangerLevel: 2, recommendedCharacterIds: ['char_paul', 'char_jerome', 'char_jett'], requiredRescueRoles: ['traffic-control', 'evacuation', 'scan'],
  npcSlotCount: 2, objectSlotCount: 1, obstacleSlotCount: 0, deviceSlotCount: 0, enemyGroupSlotCount: 0,
  defaultObjectives: [
    step({ label: 'Reach the junction', objectiveType: 'reach-area', targetId: AREA, targetType: 'area', completionConditions: [reach()] }),
    step({ label: 'Direct the traffic', objectiveType: 'protect-area', targetId: AREA, targetType: 'area', requiredRoleTags: ['traffic-control'], completionConditions: [{ type: 'support-used', supportAbilityId: 'support_paul_shield' }] }),
    step({ label: 'Evacuate the bystanders', objectiveType: 'evacuate-npc', targetId: NPC0, targetType: 'npc', requiredRoleTags: ['evacuation'], completionConditions: [{ type: 'npc-state', npcId: NPC0, state: 'safe' }] }),
  ],
  defaultInitialStateChanges: [npcChange(NPC0, 'set-panicked'), npcChange(NPC1, 'set-panicked'), objectChange(OBJ0, 'set-blocking-path'), envChange(AREA, 'set-danger-zone')],
  defaultSolutions: [trafficControlSolution(AREA), protectSolution(AREA), rescueSolution(NPC0, [npcChange(NPC0, 'set-safe')])],
  defaultPostSuccessStateChanges: [envChange(AREA, 'clear-danger-zone'), npcChange(NPC1, 'set-safe'), objectChange(OBJ0, 'set-active')],
  defaultEscalationEffects: [[npcChange(NPC1, 'set-injured')]],
  timeLimitSeconds: 150, aiControlParameters: aiFull, editorMeta: { tags: ['traffic'], difficulty: 'easy' }, enabled: true,
};

const HIGH_PLACE_RESCUE: IncidentTemplate = {
  id: 'tmpl_high_place_rescue', incidentType: 'high-place-rescue',
  title: 'Stranded Up High', description: 'Someone is stranded at height and needs an air rescue down to safety.',
  dangerLevel: 3, recommendedCharacterIds: ['char_jett', 'char_flip', 'char_bello'], requiredRescueRoles: ['air-rescue', 'medical', 'evacuation'],
  npcSlotCount: 1, objectSlotCount: 0, obstacleSlotCount: 0, deviceSlotCount: 0, enemyGroupSlotCount: 0,
  defaultObjectives: [
    step({ label: 'Reach below the ledge', objectiveType: 'reach-area', targetId: AREA, targetType: 'area', completionConditions: [reach()] }),
    step({ label: 'Air-lift to safety', objectiveType: 'evacuate-npc', targetId: NPC0, targetType: 'npc', requiredRoleTags: ['air-rescue', 'evacuation'], completionConditions: [{ type: 'npc-state', npcId: NPC0, state: 'safe' }] }),
  ],
  defaultInitialStateChanges: [npcChange(NPC0, 'set-trapped'), envChange(AREA, 'set-danger-zone')],
  defaultSolutions: [rescueSolution(NPC0, [npcChange(NPC0, 'set-safe')]), medicalSolution(NPC0, [npcChange(NPC0, 'set-waiting-rescue')])],
  defaultPostSuccessStateChanges: [envChange(AREA, 'clear-danger-zone')],
  defaultEscalationEffects: [[npcChange(NPC0, 'set-panicked')], [npcChange(NPC0, 'set-injured')]],
  timeLimitSeconds: 140, aiControlParameters: aiFull, editorMeta: { tags: ['air-rescue'], difficulty: 'normal' }, enabled: true,
};

const MEDICAL_RESCUE: IncidentTemplate = {
  id: 'tmpl_medical_rescue', incidentType: 'medical-rescue',
  title: 'Injured Bystander', description: 'An injured NPC must be stabilized and then evacuated to safety.',
  dangerLevel: 3, recommendedCharacterIds: ['char_bello', 'char_paul', 'char_jett'], requiredRescueRoles: ['medical', 'evacuation', 'scan'],
  npcSlotCount: 1, objectSlotCount: 0, obstacleSlotCount: 0, deviceSlotCount: 0, enemyGroupSlotCount: 0,
  defaultObjectives: [
    step({ label: 'Reach the casualty', objectiveType: 'reach-area', targetId: AREA, targetType: 'area', completionConditions: [reach()] }),
    step({ label: 'Stabilize the casualty', objectiveType: 'stabilize-npc', targetId: NPC0, targetType: 'npc', requiredRoleTags: ['medical'], completionConditions: [{ type: 'npc-state', npcId: NPC0, state: 'waiting-rescue' }] }),
    step({ label: 'Evacuate the casualty', objectiveType: 'evacuate-npc', targetId: NPC0, targetType: 'npc', requiredRoleTags: ['evacuation'], completionConditions: [{ type: 'npc-state', npcId: NPC0, state: 'safe' }] }),
  ],
  defaultInitialStateChanges: [npcChange(NPC0, 'set-injured'), envChange(AREA, 'set-danger-zone')],
  defaultSolutions: [medicalSolution(NPC0, [npcChange(NPC0, 'set-waiting-rescue')]), rescueSolution(NPC0, [npcChange(NPC0, 'set-safe')]), scanRevealSolution(NPC0, [])],
  defaultPostSuccessStateChanges: [envChange(AREA, 'clear-danger-zone')],
  defaultEscalationEffects: [[envChange(AREA, 'spawn-smoke')], [npcChange(NPC0, 'set-injured')]],
  timeLimitSeconds: 150, aiControlParameters: aiFull, editorMeta: { tags: ['medical', 'rescue'], difficulty: 'normal' }, enabled: true,
};

export const SEED_INCIDENT_TEMPLATES: IncidentTemplate[] = [
  ROAD_ACCIDENT, FIRE_EVENT, MECHANICAL_FAILURE, NPC_TRAPPED, MULTI_STAGE,
  BUILDING_DAMAGED, BRIDGE_COLLAPSE, FLOOD_OR_LEAK, POWER_OUTAGE, TRAFFIC_CHAOS, HIGH_PLACE_RESCUE, MEDICAL_RESCUE,
];

export function getIncidentTemplate(id: string | undefined): IncidentTemplate | undefined {
  return id ? SEED_INCIDENT_TEMPLATES.find((t) => t.id === id) : undefined;
}
