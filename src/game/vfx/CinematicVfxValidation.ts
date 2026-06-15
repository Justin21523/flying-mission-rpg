import type { CinematicEffectDefinition, CinematicVfxValidationResult } from '../../types/cinematicVfxTypes';
import { CINEMATIC_LAYER_TYPES, CINEMATIC_ATTACH_TO } from '../../types/cinematicVfxTypes';
import { PARTICLE_LAYER_MAX_COUNT } from '../../types/particleEffectTypes';
import { FOG_CLOUD_LAYER_MAX_PUFFS } from '../../types/fogCloudEffectTypes';

// Pure validator for cinematic effect definitions (Batch F.5, spec §16). `modelExists` lets the validator
// confirm a model layer's GLB resolves (else it must fall back — a warning, not an error).
export function validateCinematicEffect(
  def: CinematicEffectDefinition,
  modelExists: (id: string) => boolean = () => true,
): CinematicVfxValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!def.id?.trim()) errors.push('effect id must not be empty.');
  if (!def.layers || def.layers.length === 0) errors.push('effect must have at least one layer.');
  if (def.timeline.totalDurationSeconds <= 0) errors.push('timeline.totalDurationSeconds must be > 0.');
  if (!def.pooling) errors.push('effect must set pooling.');
  if (!def.cleanup) errors.push('effect must set cleanup.');

  let hasNonParticle = false;
  for (const l of def.layers ?? []) {
    if (!CINEMATIC_LAYER_TYPES.includes(l.layerType)) errors.push(`layer ${l.id}: unknown layerType "${l.layerType}".`);
    if (!CINEMATIC_ATTACH_TO.includes(l.attachTo)) errors.push(`layer ${l.id}: unknown attachTo "${l.attachTo}".`);
    if (l.durationSeconds < 0) errors.push(`layer ${l.id}: durationSeconds must be >= 0.`);
    if (l.startTimeSeconds < 0) errors.push(`layer ${l.id}: startTimeSeconds must be >= 0.`);
    if (l.particle && l.particle.count > PARTICLE_LAYER_MAX_COUNT) warnings.push(`layer ${l.id}: particle count ${l.particle.count} exceeds cap ${PARTICLE_LAYER_MAX_COUNT} (clamped).`);
    if (l.fogCloud && l.fogCloud.puffCount > FOG_CLOUD_LAYER_MAX_PUFFS) warnings.push(`layer ${l.id}: fog puffCount ${l.fogCloud.puffCount} exceeds cap ${FOG_CLOUD_LAYER_MAX_PUFFS} (clamped).`);
    if (l.model?.modelAssetId && !modelExists(l.model.modelAssetId)) warnings.push(`layer ${l.id}: model "${l.model.modelAssetId}" missing → geometry fallback.`);
    if (l.layerType !== 'particle-burst' && l.layerType !== 'particle-trail' && l.layerType !== 'fog-cloud' && l.layerType !== 'smoke-ring' && l.layerType !== 'dust-cloud' && l.layerType !== 'camera-feedback' && l.layerType !== 'ui-feedback') hasNonParticle = true;
  }
  // §15 — particles are never the WHOLE effect; require at least one model/geometry/object/energy layer.
  const onlyParticles = (def.layers ?? []).length > 0 && !hasNonParticle;
  if (onlyParticles) warnings.push('effect is particle-only — add a model/geometry/object layer (model-first §15).');

  return { ok: errors.length === 0, errors, warnings };
}
