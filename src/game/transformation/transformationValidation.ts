import type { TransformationDefinition } from '../../types/game/transformation';
import { TRANSFORMATION_PART_KEYS } from '../../types/game/transformation';

// Pure validation (no zod, matches the repo). Returns human-readable errors ([] = valid). Surfaced in the
// editor; the runtime/director skip invalid timelines rather than crashing. `knownCharacterIds` is optional
// so callers that have the character store can also check the binding.
const PARTS = new Set<string>(TRANSFORMATION_PART_KEYS);
const FORM_STAGE_TYPES = new Set(['model-visibility', 'model-swap', 'animation-clip', 'part-transform']);

export function validateTimeline(def: TransformationDefinition, knownCharacterIds?: ReadonlySet<string>): string[] {
  const e: string[] = [];
  const EPS = 0.001;
  if (!def.id?.trim()) e.push('Timeline id is empty.');
  if (def.characterId && knownCharacterIds && !knownCharacterIds.has(def.characterId)) e.push(`Unknown characterId "${def.characterId}".`);
  if (!(def.totalDurationSec > 0)) e.push('Total duration must be > 0.');
  if (!(def.quickDurationSec > 0)) e.push('Quick duration must be > 0.');
  if (def.quickDurationSec > def.totalDurationSec + EPS) e.push('Quick duration must be <= total duration.');

  const total = def.totalDurationSec;
  const stages = def.stages ?? [];
  if (stages.length === 0) e.push('Timeline needs at least one stage.');
  for (const s of stages) {
    if (s.startTime < 0) e.push(`Stage ${s.id}: startTime must be >= 0.`);
    if (s.duration < 0) e.push(`Stage ${s.id}: duration must be >= 0.`);
    if (s.startTime + s.duration > total + EPS) e.push(`Stage ${s.id}: extends past total duration.`);
    if (s.params.partKey && !PARTS.has(s.params.partKey)) e.push(`Stage ${s.id}: unknown partKey "${s.params.partKey}".`);
  }
  if (!stages.some((s) => FORM_STAGE_TYPES.has(s.type))) e.push('Needs at least one form/part/animation stage (model-visibility / model-swap / animation-clip / part-transform).');
  const exit = stages.find((s) => s.type === 'exit-stage');
  if (!stages.some((s) => s.type === 'finish-pose') && !exit) e.push('Needs a finish-pose or exit-stage.');
  if (exit && (exit.params.targetPhase ?? 'DESCENT') !== 'DESCENT') e.push('exit-stage must target DESCENT.');

  for (const sh of def.cameraShots ?? []) {
    if (sh.startTime + sh.duration > total + EPS) e.push(`Camera shot ${sh.id}: extends past total duration.`);
    if (sh.targetPart && !PARTS.has(sh.targetPart)) e.push(`Camera shot ${sh.id}: unknown targetPart "${sh.targetPart}".`);
  }
  for (const fx of def.effectTracks ?? []) {
    if (fx.startTime + fx.duration > total + EPS) e.push(`Effect ${fx.id}: extends past total duration.`);
    if (fx.followTargetPart && !PARTS.has(fx.followTargetPart)) e.push(`Effect ${fx.id}: unknown followTargetPart "${fx.followTargetPart}".`);
  }

  // controller / collider switch safety
  const cs = def.controllerSwitchConfig;
  if (cs && cs.planeControllerDisableTime > cs.robotControllerEnableTime + EPS) e.push('Plane controller must disable before the robot controller enables.');
  const ps = def.physicsSwitchConfig;
  if (ps && !ps.transitionalCollider && ps.planeColliderDisableTime > ps.robotColliderEnableTime + EPS) e.push('Plane collider must disable before the robot collider enables (or set a transitional collider).');

  // strategy compatibility (lenient)
  if (def.formStrategy === 'dual-model-swap' && !def.robotModelRef) e.push('dual-model-swap needs a robotModelRef.');
  if (def.formStrategy === 'single-model-multi-animation' && !def.sharedModelRef) e.push('single-model-multi-animation needs a sharedModelRef.');
  if (def.formStrategy === 'modular-parts-procedural' && (def.parts ?? []).length === 0) e.push('modular-parts-procedural needs at least one part.');
  return e;
}
