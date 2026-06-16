import type { CloneAbilityDefinition } from '../../types/cloneAbilityTypes';
import type { AbilityValidationResult } from '../../types/abilityArsenalTypes';
import type { CinematicLayerType } from '../../types/cinematicVfxTypes';
import { CLONE_TYPES, CLONE_MATERIAL_MODES } from '../../types/cloneAbilityTypes';
import { timelineHasRequiredStates } from './CloneStateTimelineRuntime';
import { buildCloneEffect } from './CloneEffectDirector';
import { poseSetResolves } from './ClonePoseModelRuntime';

// Clone ability validators (Batch F.7, spec §27). Pure — checks the clone definition + its BUILT effect's layer
// completeness (model + particle + geometry/fog), so a clone can never be a particle-only or model-only ghost.

const MODEL: ReadonlySet<CinematicLayerType> = new Set(['model-component', 'model-fragment', 'object-assembly']);
const PARTICLE: ReadonlySet<CinematicLayerType> = new Set(['particle-burst', 'particle-trail']);
const GEOM_OR_FOG: ReadonlySet<CinematicLayerType> = new Set([
  'geometry-mesh', 'shield-panel', 'scan-overlay', 'lock-line', 'ground-marker', 'energy-field',
  'fog-cloud', 'smoke-ring', 'dust-cloud',
]);

export function validateCloneAbility(def: CloneAbilityDefinition): AbilityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!def.id?.trim()) errors.push('clone ability id must not be empty.');
  if (!def.characterId?.trim()) errors.push('clone ability characterId must not be empty.');
  if (!CLONE_TYPES.includes(def.cloneType)) errors.push(`unknown cloneType "${def.cloneType}".`);
  if (!def.poseModelSet) errors.push('clone ability must have a poseModelSet.');
  else {
    if (!def.poseModelSet.actionPoseModelId && !def.poseModelSet.fallbackModelId) errors.push('poseModelSet needs an actionPoseModelId or fallbackModelId.');
    if (!poseSetResolves(def.poseModelSet)) warnings.push('pose models do not resolve to a real GLB (will use fallback).');
  }
  if (!def.stateTimeline || def.stateTimeline.length === 0) errors.push('clone ability must have a stateTimeline.');
  else if (!timelineHasRequiredStates(def.stateTimeline)) errors.push('stateTimeline must include spawn / pose-switch / an action beat / dissolve / cleanup.');
  if (def.durationSeconds <= 0) errors.push('clone durationSeconds must be > 0.');
  if (def.maxCloneCount <= 0) errors.push('maxCloneCount must be > 0.');
  if (!def.gameplayEffect || Object.keys(def.gameplayEffect).length === 0) errors.push('clone ability must have a gameplayEffect.');
  if (!def.visualConfig) errors.push('clone ability must have a visualConfig.');
  else {
    if (def.visualConfig.modelScaleMultiplier <= 0) errors.push('visualConfig.modelScaleMultiplier must be > 0.');
    if (!CLONE_MATERIAL_MODES.includes(def.visualConfig.materialMode)) errors.push(`unknown materialMode "${def.visualConfig.materialMode}".`);
  }

  // Layer completeness of the built effect — model + particle + geometry/fog + cleanup.
  if (def.poseModelSet && def.stateTimeline?.length) {
    const effect = buildCloneEffect(def, def.visualConfig?.particleEffectId ? '#88ccff' : '#88ccff');
    const types = effect.layers.map((l) => l.layerType);
    if (!types.some((t) => MODEL.has(t))) errors.push('built clone effect has no model layer.');
    if (!types.some((t) => PARTICLE.has(t))) errors.push('built clone effect has no particle layer.');
    if (!types.some((t) => GEOM_OR_FOG.has(t))) errors.push('built clone effect has no geometry/fog layer.');
    if (!effect.cleanup.autoCleanup) errors.push('built clone effect must auto-cleanup.');
  }

  return { ok: errors.length === 0, errors, warnings };
}
