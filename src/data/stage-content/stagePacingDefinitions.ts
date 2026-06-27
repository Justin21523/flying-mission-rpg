import type { StagePacingBeatType, StagePacingDefinition, StagePrimarySystem } from '../../types/stageContentTypes';
import { SEED_STAGES } from '../campaigns/stageDefinitions';
import { SEED_LEVEL_LAYOUTS } from '../levels/levelLayouts';

const intensity = (index: number): 1 | 2 | 3 | 4 | 5 => Math.min(5, Math.max(1, index)) as 1 | 2 | 3 | 4 | 5;

export const FIRST_THREE_STAGE_PACING: Record<string, StagePacingDefinition> = {
  stage_sunny_harbor_emergency: {
    expectedDurationMinutes: 7,
    pacingType: 'tutorial',
    beats: [
      { id: 'stage1_beat_landing_intro', segmentId: 'seg_landing_dock', beatType: 'intro', purpose: 'Teach movement and show the safe harbor route.', primarySystem: 'navigation', targetIntensity: 1, expectedDurationSeconds: 60 },
      { id: 'stage1_beat_road_incident', segmentId: 'seg_cargo_street', beatType: 'incident', purpose: 'Resolve the road accident and identify the blocked path.', primarySystem: 'incident', targetIntensity: 1, expectedDurationSeconds: 90 },
      { id: 'stage1_beat_wall_obstacle', segmentId: 'seg_cargo_street', beatType: 'obstacle', purpose: 'Prompt heavy-break or Donnie support on the cracked wall.', primarySystem: 'obstacle', targetIntensity: 1, expectedDurationSeconds: 60 },
      { id: 'stage1_beat_basic_combat', segmentId: 'seg_signal_yard', beatType: 'combat', purpose: 'Fight one Crusher Drone and read basic hit feedback.', primarySystem: 'combat', targetIntensity: 2, expectedDurationSeconds: 90 },
      { id: 'stage1_beat_repair_terminal', segmentId: 'seg_repair_plaza', beatType: 'final-objective', purpose: 'Repair the harbor terminal and clear the stage.', primarySystem: 'repair', targetIntensity: 1, expectedDurationSeconds: 90 },
    ],
    restPoints: [{ segmentId: 'seg_repair_plaza', type: 'supply' }],
    intensityCurve: [
      { segmentId: 'seg_landing_dock', intensity: 1 },
      { segmentId: 'seg_cargo_street', intensity: 1 },
      { segmentId: 'seg_signal_yard', intensity: 2 },
      { segmentId: 'seg_repair_plaza', intensity: 1 },
    ],
  },
  stage_downtown_traffic_collapse: {
    expectedDurationMinutes: 9,
    pacingType: 'mixed',
    beats: [
      { id: 'stage2_beat_arrival', segmentId: 'seg_downtown_arrival', beatType: 'intro', purpose: 'Establish blocked streets and evacuation stakes.', primarySystem: 'navigation', targetIntensity: 1, expectedDurationSeconds: 70 },
      { id: 'stage2_beat_traffic_incident', segmentId: 'seg_downtown_intersection', beatType: 'incident', purpose: 'Stabilize the traffic chaos and learn shield pressure.', primarySystem: 'incident', targetIntensity: 2, expectedDurationSeconds: 130 },
      { id: 'stage2_beat_shield_blockade', segmentId: 'seg_downtown_intersection', beatType: 'support-tutorial', purpose: 'Use Paul or Shield Support against Shield Carrier and turret pressure.', primarySystem: 'defense', targetIntensity: 2, expectedDurationSeconds: 110 },
      { id: 'stage2_beat_evac_control', segmentId: 'seg_downtown_evac', beatType: 'combat', purpose: 'Protect evacuation markers while clearing a small swarm.', primarySystem: 'support', targetIntensity: 3, expectedDurationSeconds: 140 },
      { id: 'stage2_beat_command_core', segmentId: 'seg_downtown_command', beatType: 'final-objective', purpose: 'Repair the traffic command core and clear the route.', primarySystem: 'repair', targetIntensity: 2, expectedDurationSeconds: 100 },
    ],
    restPoints: [{ segmentId: 'seg_downtown_command', type: 'support-beacon' }],
    intensityCurve: [
      { segmentId: 'seg_downtown_arrival', intensity: 1 },
      { segmentId: 'seg_downtown_intersection', intensity: 2 },
      { segmentId: 'seg_downtown_evac', intensity: 3 },
      { segmentId: 'seg_downtown_command', intensity: 2 },
    ],
  },
  stage_factory_core_breakdown: {
    expectedDurationMinutes: 11,
    pacingType: 'incident-heavy',
    beats: [
      { id: 'stage3_beat_factory_entry', segmentId: 'seg_factory_entry', beatType: 'intro', purpose: 'Establish smoke, broken machinery, and scan/repair goals.', primarySystem: 'navigation', targetIntensity: 1, expectedDurationSeconds: 70 },
      { id: 'stage3_beat_scan_fault', segmentId: 'seg_factory_assembly', beatType: 'incident', purpose: 'Use Chase scan or scan support to reveal the fault.', primarySystem: 'scan', targetIntensity: 2, expectedDurationSeconds: 120 },
      { id: 'stage3_beat_repair_line', segmentId: 'seg_factory_assembly', beatType: 'obstacle', purpose: 'Use Donnie repair or repair support on the first device.', primarySystem: 'repair', targetIntensity: 2, expectedDurationSeconds: 110 },
      { id: 'stage3_beat_support_enemies', segmentId: 'seg_factory_hazard', beatType: 'combat', purpose: 'Prioritize Repair Wisp and Spawner Bug before they sustain the hazard.', primarySystem: 'combat', targetIntensity: 3, expectedDurationSeconds: 150 },
      { id: 'stage3_beat_core_stabilize', segmentId: 'seg_factory_control', beatType: 'elite', purpose: 'Clear the mini elite and stabilize the factory core.', primarySystem: 'repair', targetIntensity: 3, expectedDurationSeconds: 150 },
      { id: 'stage3_beat_factory_clear', segmentId: 'seg_factory_control', beatType: 'final-objective', purpose: 'Confirm Factory Core Stabilized stage clear.', primarySystem: 'incident', targetIntensity: 3, expectedDurationSeconds: 60 },
    ],
    restPoints: [{ segmentId: 'seg_factory_control', type: 'supply' }],
    intensityCurve: [
      { segmentId: 'seg_factory_entry', intensity: 1 },
      { segmentId: 'seg_factory_assembly', intensity: 2 },
      { segmentId: 'seg_factory_hazard', intensity: 3 },
      { segmentId: 'seg_factory_control', intensity: 3 },
    ],
  },
};

export const SEED_STAGE_PACING_DEFINITIONS: Record<string, StagePacingDefinition> = Object.fromEntries(
  SEED_STAGES.map((stage) => {
    const authored = FIRST_THREE_STAGE_PACING[stage.id];
    if (authored) return [stage.id, authored];
    const layout = SEED_LEVEL_LAYOUTS.find((item) => item.id === stage.levelLayoutId);
    const segments = layout?.segmentIds ?? [];
    const difficulty = stage.editorMeta?.difficultyRating ?? 1;
    const pacingType: StagePacingDefinition['pacingType'] = stage.stageType === 'tutorial' ? 'tutorial' : stage.requiredSystems.boss ? 'boss-focused' : stage.stageType === 'incident' ? 'incident-heavy' : stage.stageType === 'combat' ? 'combat-heavy' : 'mixed';
    const beats = segments.map((segmentId, index) => {
      const beatType: StagePacingBeatType = index === 0 ? 'intro' : index === segments.length - 1 ? (stage.requiredSystems.boss ? 'boss' : 'final-objective') : index === 1 ? 'incident' : 'combat';
      const primarySystem: StagePrimarySystem = index === 0 ? 'navigation' : index === 1 ? (stage.requiredSystems.incidents ? 'incident' : 'combat') : stage.requiredSystems.boss && index === segments.length - 1 ? 'boss' : stage.requiredSystems.support ? 'support' : 'combat';
      return ({
      id: `${stage.id}_beat_${index + 1}`,
      segmentId,
      beatType,
      purpose: index === 0 ? 'Establish the stage theme and first route.' : index === segments.length - 1 ? 'Resolve the final objective and clear the stage.' : 'Escalate the active gameplay system.',
      primarySystem,
      targetIntensity: intensity(Math.min(5, Math.max(1, difficulty + index - 1))),
      expectedDurationSeconds: Math.max(75, Math.round(((stage.editorMeta?.targetDurationMinutes ?? 10) * 60) / Math.max(1, segments.length))),
    });
    });
    return [stage.id, {
      expectedDurationMinutes: stage.editorMeta?.targetDurationMinutes ?? 10,
      pacingType,
      beats,
      restPoints: segments.length > 2 ? [{ segmentId: segments[Math.max(1, segments.length - 2)], type: stage.requiredSystems.boss ? 'support-beacon' : 'supply' }] : [],
      intensityCurve: segments.map((segmentId, index) => ({ segmentId, intensity: intensity(Math.min(5, Math.max(1, difficulty + index - 1))) })),
    }];
  }),
) as Record<string, StagePacingDefinition>;
