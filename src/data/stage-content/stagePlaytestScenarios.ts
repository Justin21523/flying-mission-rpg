import type { StagePlaytestScenario } from '../../types/stagePlaytestTypes';
import { SEED_STAGES } from '../campaigns/stageDefinitions';
import { SEED_LEVEL_LAYOUTS } from '../levels/levelLayouts';

export const FIRST_THREE_STAGE_PLAYTEST_SCENARIOS: StagePlaytestScenario[] = [
  {
    id: 'scenario_stage_sunny_harbor_emergency_clear',
    stageId: 'stage_sunny_harbor_emergency',
    name: 'Sunny Harbor Emergency Authored Clear',
    steps: [
      { type: 'start-stage', stageId: 'stage_sunny_harbor_emergency' },
      { type: 'jump-segment', segmentId: 'seg_landing_dock' },
      { type: 'complete-objective', objectiveId: 'obj_stage1_reach' },
      { type: 'jump-segment', segmentId: 'seg_cargo_street' },
      { type: 'complete-incident', incidentId: 'incident_seg_cargo_street' },
      { type: 'complete-objective', objectiveId: 'break_wall' },
      { type: 'jump-segment', segmentId: 'seg_signal_yard' },
      { type: 'spawn-encounter', encounterId: 'enc_sunny_signal_yard' },
      { type: 'clear-encounter', encounterId: 'enc_sunny_signal_yard' },
      { type: 'complete-objective', objectiveId: 'enc_stage1_signal_yard' },
      { type: 'jump-segment', segmentId: 'seg_repair_plaza' },
      { type: 'complete-objective', objectiveId: 'repair_device' },
      { type: 'complete-stage', stageId: 'stage_sunny_harbor_emergency' },
    ],
    editorMeta: { notes: 'Batch N deterministic tutorial route: incident, cracked wall, single Crusher Drone, repair terminal.' },
  },
  {
    id: 'scenario_stage_downtown_traffic_collapse_clear',
    stageId: 'stage_downtown_traffic_collapse',
    name: 'Downtown Traffic Collapse Authored Clear',
    steps: [
      { type: 'start-stage', stageId: 'stage_downtown_traffic_collapse' },
      { type: 'jump-segment', segmentId: 'seg_downtown_arrival' },
      { type: 'jump-segment', segmentId: 'seg_downtown_intersection' },
      { type: 'complete-incident', incidentId: 'incident_seg_downtown_intersection' },
      { type: 'spawn-encounter', encounterId: 'enc_downtown_shield_blockade' },
      { type: 'clear-encounter', encounterId: 'enc_downtown_shield_blockade' },
      { type: 'complete-objective', objectiveId: 'obj_stage2_traffic_control' },
      { type: 'jump-segment', segmentId: 'seg_downtown_evac' },
      { type: 'spawn-encounter', encounterId: 'enc_downtown_swarm_evac' },
      { type: 'clear-encounter', encounterId: 'enc_downtown_swarm_evac' },
      { type: 'complete-objective', objectiveId: 'obj_stage2_evacuate' },
      { type: 'complete-objective', objectiveId: 'enc_stage2_shield_group' },
      { type: 'jump-segment', segmentId: 'seg_downtown_command' },
      { type: 'complete-stage', stageId: 'stage_downtown_traffic_collapse' },
    ],
    editorMeta: { notes: 'Batch N deterministic defense/control route: traffic incident, shield blockade, evacuation wave, command clear.' },
  },
  {
    id: 'scenario_stage_factory_core_breakdown_clear',
    stageId: 'stage_factory_core_breakdown',
    name: 'Factory Core Breakdown Authored Clear',
    steps: [
      { type: 'start-stage', stageId: 'stage_factory_core_breakdown' },
      { type: 'jump-segment', segmentId: 'seg_factory_entry' },
      { type: 'jump-segment', segmentId: 'seg_factory_assembly' },
      { type: 'complete-incident', incidentId: 'incident_seg_factory_assembly' },
      { type: 'complete-objective', objectiveId: 'obj_stage3_scan' },
      { type: 'spawn-encounter', encounterId: 'enc_factory_support_units' },
      { type: 'clear-encounter', encounterId: 'enc_factory_support_units' },
      { type: 'complete-objective', objectiveId: 'obj_stage3_repair' },
      { type: 'jump-segment', segmentId: 'seg_factory_hazard' },
      { type: 'spawn-encounter', encounterId: 'enc_factory_hazard_core' },
      { type: 'clear-encounter', encounterId: 'enc_factory_hazard_core' },
      { type: 'jump-segment', segmentId: 'seg_factory_control' },
      { type: 'spawn-encounter', encounterId: 'enc_factory_elite' },
      { type: 'clear-encounter', encounterId: 'enc_factory_elite' },
      { type: 'complete-objective', objectiveId: 'enc_stage3_elite' },
      { type: 'complete-stage', stageId: 'stage_factory_core_breakdown' },
    ],
    editorMeta: { notes: 'Batch N deterministic scan/repair route: assembly fault, support units, hazard core, mini elite.' },
  },
];

export const SEED_STAGE_PLAYTEST_SCENARIOS: StagePlaytestScenario[] = SEED_STAGES.map((stage) => {
  const authored = FIRST_THREE_STAGE_PLAYTEST_SCENARIOS.find((scenario) => scenario.stageId === stage.id);
  if (authored) return authored;
  const layout = SEED_LEVEL_LAYOUTS.find((item) => item.id === stage.levelLayoutId);
  const firstEncounterId = stage.encounterPackIds[0]?.replace('pack_', 'enc_');
  const middleSegment = layout?.segmentIds[Math.min(1, Math.max(0, layout.segmentIds.length - 1))] ?? layout?.startSegmentId ?? '';
  const finalSegment = layout?.finalSegmentIds[0] ?? middleSegment;
  return {
    id: `scenario_${stage.id}_clear`,
    stageId: stage.id,
    name: `${stage.name} Clear Scenario`,
    steps: [
      { type: 'start-stage', stageId: stage.id },
      { type: 'jump-segment', segmentId: middleSegment },
      ...(stage.objectiveIds[0] ? [{ type: 'complete-objective', objectiveId: stage.objectiveIds[0] } as const] : []),
      ...(firstEncounterId ? [{ type: 'spawn-encounter', encounterId: firstEncounterId } as const, { type: 'clear-encounter', encounterId: firstEncounterId } as const] : []),
      ...(stage.incidentTemplateIds[0] ? [{ type: 'complete-incident', incidentId: `incident_${middleSegment}` } as const] : []),
      { type: 'jump-segment', segmentId: finalSegment },
      ...stage.objectiveIds.slice(1).map((objectiveId) => ({ type: 'complete-objective', objectiveId } as const)),
      { type: 'complete-stage', stageId: stage.id },
    ],
    editorMeta: { notes: 'Deterministic data-driven smoke scenario for Batch I validation.' },
  };
});
