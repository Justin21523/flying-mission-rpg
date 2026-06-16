import type { IncidentPlan } from '../../types/aiIncidentTypes';
import type { IncidentTemplate } from '../../types/incidentTemplateTypes';
import type { IncidentCondition, IncidentObjectiveStep, IncidentSolutionDefinition, IncidentStateChange } from '../../types/incidentTypes';
import { SEED_INCIDENT_TEMPLATES, getIncidentTemplate } from './incidentTemplates';
import { ensureStateChangeIds } from './incidentStateChangePresets';

// Pure template → IncidentPlan instantiation (Batch G). Substitutes template slot ids ('npc#0', 'obstacle#0',
// 'device#0', 'enemy#0', 'object#0', 'area#main') with real/placeholder world ids from a binding. Used by both
// the static seed mock plans below AND the AIIncidentMockProvider (runtime) — one source of truth, no game-layer
// dependency. Never mutates state.

export interface TemplateBinding {
  incidentId: string;
  locationId: string;
  zoneId?: string;
  segmentId?: string;
  slots: Record<string, string>; // slotId → real id
  areaId: string;
  center: [number, number, number];
  generatedBy?: 'llm' | 'mock' | 'manual' | 'template';
}

const sub = (b: TemplateBinding, id: string | undefined): string | undefined => (id == null ? id : (b.slots[id] ?? (id === 'area#main' ? b.areaId : id)));

function subCondition(c: IncidentCondition, b: TemplateBinding): IncidentCondition {
  switch (c.type) {
    case 'npc-state': return { ...c, npcId: sub(b, c.npcId)! };
    case 'object-state': return { ...c, objectId: sub(b, c.objectId)! };
    case 'obstacle-state': return { ...c, obstacleId: sub(b, c.obstacleId)! };
    case 'device-repaired': return { ...c, deviceId: sub(b, c.deviceId)! };
    case 'enemy-group-cleared': return { ...c, enemyGroupId: sub(b, c.enemyGroupId)! };
    case 'player-reached-area': return { ...c, areaId: sub(b, c.areaId)! };
    case 'character-skill-used': return { ...c, targetId: sub(b, c.targetId) };
    default: return c;
  }
}
function subStateChange(s: IncidentStateChange, b: TemplateBinding): IncidentStateChange {
  return { ...s, targetId: sub(b, s.targetId)! } as IncidentStateChange;
}
function subObjective(o: IncidentObjectiveStep, b: TemplateBinding): IncidentObjectiveStep {
  return { ...o, targetId: sub(b, o.targetId), completionConditions: o.completionConditions.map((c) => subCondition(c, b)) };
}
function subSolution(s: IncidentSolutionDefinition, b: TemplateBinding): IncidentSolutionDefinition {
  return { ...s, targetIds: s.targetIds.map((t) => sub(b, t)!), expectedStateChanges: s.expectedStateChanges.map((c) => subStateChange(c, b)) };
}

export function bindTemplate(template: IncidentTemplate, b: TemplateBinding): IncidentPlan {
  const objectiveSteps = template.defaultObjectives.map((o) => subObjective(o, b));
  // success = every NON-optional step's completion conditions; failure = the time limit.
  const successConditions: IncidentCondition[] = objectiveSteps.filter((o) => !o.optional).flatMap((o) => o.completionConditions);
  const failureConditions: IncidentCondition[] = template.timeLimitSeconds ? [{ type: 'timer-expired', seconds: template.timeLimitSeconds }] : [];
  return {
    incidentId: b.incidentId,
    templateId: template.id,
    incidentType: template.incidentType,
    locationId: b.locationId,
    zoneId: b.zoneId,
    segmentId: b.segmentId,
    title: template.title,
    description: template.description,
    involvedNPCIds: Object.entries(b.slots).filter(([k]) => k.startsWith('npc#')).map(([, v]) => v),
    involvedObjectIds: Object.entries(b.slots).filter(([k]) => k.startsWith('object#')).map(([, v]) => v),
    involvedObstacleIds: Object.entries(b.slots).filter(([k]) => k.startsWith('obstacle#')).map(([, v]) => v),
    involvedDeviceIds: Object.entries(b.slots).filter(([k]) => k.startsWith('device#')).map(([, v]) => v),
    involvedEnemyGroupIds: Object.entries(b.slots).filter(([k]) => k.startsWith('enemy#')).map(([, v]) => v),
    affectedArea: { areaId: b.areaId, center: b.center, radius: 10 },
    dangerLevel: template.dangerLevel,
    recommendedCharacterIds: template.recommendedCharacterIds,
    requiredRescueRoles: template.requiredRescueRoles,
    initialStateChanges: ensureStateChangeIds(template.defaultInitialStateChanges.map((s) => subStateChange(s, b))),
    objectiveSteps,
    successConditions,
    failureConditions,
    timeLimitSeconds: template.timeLimitSeconds,
    availableSolutions: template.defaultSolutions.map((s) => subSolution(s, b)),
    aiControlParameters: template.aiControlParameters,
    escalationEffects: template.defaultEscalationEffects?.map((level) => ensureStateChangeIds(level.map((s) => subStateChange(s, b)))),
    postSuccessStateChanges: template.defaultPostSuccessStateChanges ? ensureStateChangeIds(template.defaultPostSuccessStateChanges.map((s) => subStateChange(s, b))) : undefined,
    editorMeta: { generatedBy: b.generatedBy ?? 'mock', tags: template.editorMeta?.tags, difficulty: template.editorMeta?.difficulty },
  };
}

// 3 seed AI-generated mock incidents bound to the real Sunny Harbor zone (Batch G §0.15). Placeholder npc/object
// /area ids are incident-owned virtual entities; obstacle/device ids are real zone entities.
const ZONE = 'zone_sunny_harbor_advanced_foundation';
const LOC = 'loc_sunny_harbor';

export const SEED_INCIDENT_MOCK_PLANS: IncidentPlan[] = [
  bindTemplate(SEED_INCIDENT_TEMPLATES[0], { incidentId: 'inc_mock_road_accident', locationId: LOC, zoneId: ZONE, segmentId: 'seg_cargo_street', areaId: 'incident_area_main', center: [0, 1, 22], slots: { 'npc#0': 'incident_npc_0', 'npc#1': 'incident_npc_1', 'object#0': 'incident_object_0', 'obstacle#0': 'cracked_wall_01' } }),
  bindTemplate(SEED_INCIDENT_TEMPLATES[2], { incidentId: 'inc_mock_mechanical', locationId: LOC, zoneId: ZONE, segmentId: 'seg_repair_plaza', areaId: 'incident_area_main', center: [-6, 1, -28], slots: { 'npc#0': 'incident_npc_0', 'device#0': 'corrupted_device_01', 'obstacle#0': 'incident_obstacle_0' } }),
  bindTemplate(SEED_INCIDENT_TEMPLATES[3], { incidentId: 'inc_mock_trapped', locationId: LOC, zoneId: ZONE, segmentId: 'seg_cargo_street', areaId: 'incident_area_main', center: [0, 1, 24], slots: { 'npc#0': 'incident_npc_0', 'obstacle#0': 'cracked_wall_01' } }),
  bindTemplate(getIncidentTemplate('tmpl_flood_or_leak')!, { incidentId: 'inc_mock_flood', locationId: LOC, zoneId: ZONE, segmentId: 'seg_repair_plaza', areaId: 'incident_area_main', center: [-6, 1, -28], slots: { 'npc#0': 'incident_npc_0', 'device#0': 'corrupted_device_01' } }),
  bindTemplate(getIncidentTemplate('tmpl_medical_rescue')!, { incidentId: 'inc_mock_medical', locationId: LOC, zoneId: ZONE, segmentId: 'seg_cargo_street', areaId: 'incident_area_main', center: [0, 1, 22], slots: { 'npc#0': 'incident_npc_0' } }),
];

export { getIncidentTemplate };
