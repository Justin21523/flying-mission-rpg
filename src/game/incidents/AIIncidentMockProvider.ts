import type { IncidentPlan } from '../../types/aiIncidentTypes';
import type { IncidentTemplate } from '../../types/incidentTemplateTypes';
import type { IncidentWorldStateSnapshot } from '../../types/incidentWorldStateTypes';
import { bindTemplate, type TemplateBinding } from '../../data/incidents/incidentMockPlans';
import { allIncidentTemplates } from '../../stores/useIncidentEditorStore';
import { pickVariedTemplate } from './IncidentVarietyDirector';
import { activeSegment } from '../advanced-mission-zone/AdvancedMissionZoneDirector';
import { INCIDENT_AREA_ID, INCIDENT_NPC_SLOTS, INCIDENT_OBJECT_SLOTS, INCIDENT_OBSTACLE_FALLBACK, INCIDENT_DEVICE_FALLBACK } from './IncidentWorldStateReader';

// Schema-driven mock provider (Batch G §7.3). Picks a seed template and fills its slots with VALID live world
// ids → a ready-to-validate IncidentPlan. Deterministic (no randomness unless asked). Never mutates state.
let seq = 0;

function pickN<T>(pool: T[], n: number, fallback: T): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(pool[i] ?? fallback);
  return out;
}

function areaCenter(): [number, number, number] {
  const seg = activeSegment();
  if (seg?.markers?.[0]) { const p = seg.markers[0].position; return [p[0], 1, p[2]]; }
  if (seg?.bounds) { const c = seg.bounds.center; return [c[0], 1, c[2]]; }
  return [0, 1, 0];
}

export function generateMockPlan(world: IncidentWorldStateSnapshot, opts?: { templateId?: string; incidentId?: string; random?: boolean }): IncidentPlan {
  const templates = allIncidentTemplates().filter((t) => t.enabled !== false);
  const template: IncidentTemplate = (opts?.templateId && templates.find((t) => t.id === opts.templateId))
    || (opts?.random ? pickVariedTemplate(world) : templates[0]);

  // Prefer authored/real obstacle+device ids over the synthetic fallback.
  const realObstacles = world.obstacleIds.filter((id) => id !== INCIDENT_OBSTACLE_FALLBACK);
  const realDevices = world.deviceIds.filter((id) => id !== INCIDENT_DEVICE_FALLBACK);

  const slots: Record<string, string> = {};
  pickN(INCIDENT_NPC_SLOTS, template.npcSlotCount, INCIDENT_NPC_SLOTS[0]).forEach((id, i) => { slots[`npc#${i}`] = id; });
  pickN(INCIDENT_OBJECT_SLOTS, template.objectSlotCount, INCIDENT_OBJECT_SLOTS[0]).forEach((id, i) => { slots[`object#${i}`] = id; });
  pickN(realObstacles, template.obstacleSlotCount, INCIDENT_OBSTACLE_FALLBACK).forEach((id, i) => { slots[`obstacle#${i}`] = id; });
  pickN(realDevices, template.deviceSlotCount, INCIDENT_DEVICE_FALLBACK).forEach((id, i) => { slots[`device#${i}`] = id; });
  pickN(world.enemyGroupIds, template.enemyGroupSlotCount, world.enemyGroupIds[0] ?? 'incident_enemy_0').forEach((id, i) => { slots[`enemy#${i}`] = id; });

  const binding: TemplateBinding = {
    incidentId: opts?.incidentId ?? `inc_${template.incidentType}_${Date.now().toString(36)}_${seq++}`,
    locationId: world.locationId,
    zoneId: world.zoneId,
    segmentId: world.segmentId,
    slots,
    areaId: INCIDENT_AREA_ID,
    center: areaCenter(),
    generatedBy: 'mock',
  };
  return bindTemplate(template, binding);
}
