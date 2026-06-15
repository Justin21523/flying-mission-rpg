import type { CinematicEffectDefinition, CinematicEffectLayerDefinition, CinematicLayerType } from '../../types/cinematicVfxTypes';
import type { CharacterVfxStyleProfile, CinematicVfxQualityChecks, CinematicVfxQualityScore } from '../../types/characterVfxStyleTypes';
import { isShowcaseAbility } from '../../data/cinematic-vfx/showcaseAbilities';

// Quality scorer (Batch F.6) — deterministic, content-based grading so every authored effect is verifiably
// character-distinct + model/geometry/physics-driven (particles only as accents). Showcase abilities must
// score >= 85; every other ability >= 65; particle-only effects always fail.

const SHOWCASE_THRESHOLD = 85;
const BASE_THRESHOLD = 65;
const OVERLAP_THRESHOLD = 0.6;

const GEOMETRY_LAYER_TYPES: ReadonlySet<CinematicLayerType> = new Set([
  'geometry-mesh', 'shield-panel', 'scan-overlay', 'lock-line', 'ground-marker', 'energy-field',
]);
const MODEL_LAYER_TYPES: ReadonlySet<CinematicLayerType> = new Set([
  'model-component', 'model-fragment', 'object-assembly',
]);
const PARTICLE_LAYER_TYPES: ReadonlySet<CinematicLayerType> = new Set([
  'particle-burst', 'particle-trail',
]);

// Weighted points per passed check (positives capped at 100). Particle-only short-circuits to a fail.
const WEIGHTS = {
  hasCharacterStyleProfile: 12,
  hasSignatureObject: 20,
  hasDistinctGeometry: 14,
  hasModelOrPhysicsObject: 18,
  hasImpactFeedback: 10,
  hasMotionLanguage: 12,
  hasCleanup: 6,
  notOverUsesGenericParticles: 8,
  notOverlapsWithOtherCharacter: 10,
} as const;

function layerIsParticle(l: CinematicEffectLayerDefinition): boolean {
  return PARTICLE_LAYER_TYPES.has(l.layerType);
}

// A stable "fingerprint" of an effect's distinctive features for cross-character overlap detection.
export function effectFingerprint(effect: CinematicEffectDefinition): Set<string> {
  const fp = new Set<string>();
  for (const id of effect.signatureObjectIds ?? []) fp.add(`sig:${id}`);
  if (effect.motionLanguage) fp.add(`motion:${effect.motionLanguage}`);
  for (const l of effect.layers) {
    if (GEOMETRY_LAYER_TYPES.has(l.layerType) || MODEL_LAYER_TYPES.has(l.layerType) || l.layerType === 'physics-object') {
      fp.add(`shape:${l.layerType}`);
    }
  }
  return fp;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function scoreAbilityVfx(
  abilityId: string,
  effect: CinematicEffectDefinition,
  styleProfile: CharacterVfxStyleProfile | undefined,
  allEffects: CinematicEffectDefinition[],
): CinematicVfxQualityScore {
  const characterId = effect.characterId ?? styleProfile?.characterId ?? 'unknown';
  const isShowcase = isShowcaseAbility(abilityId);
  const warnings: string[] = [];

  const sigIds = effect.signatureObjectIds ?? [];
  const profileSig = new Set(styleProfile?.signatureObjects ?? []);
  const particleCount = effect.layers.filter(layerIsParticle).length;
  const nonParticleCount = effect.layers.length - particleCount;
  const particleOnly = effect.layers.length > 0 && nonParticleCount === 0;

  // Cross-character overlap: highest fingerprint similarity to any OTHER character's effect.
  const fp = effectFingerprint(effect);
  let maxOverlap = 0;
  let overlapWith = '';
  for (const other of allEffects) {
    if (other.id === effect.id) continue;
    if ((other.characterId ?? '') === characterId) continue;
    const sim = jaccard(fp, effectFingerprint(other));
    if (sim > maxOverlap) { maxOverlap = sim; overlapWith = other.id; }
  }

  const checks: CinematicVfxQualityChecks = {
    hasCharacterStyleProfile: styleProfile != null,
    hasSignatureObject: sigIds.length > 0 && sigIds.some((s) => profileSig.has(s)),
    hasDistinctGeometry: effect.layers.some((l) => GEOMETRY_LAYER_TYPES.has(l.layerType) && l.geometry != null),
    hasModelOrPhysicsObject: effect.layers.some((l) => MODEL_LAYER_TYPES.has(l.layerType) || l.layerType === 'physics-object'),
    hasImpactFeedback: effect.layers.some((l) => l.layerType === 'camera-feedback'),
    hasMotionLanguage: effect.motionLanguage != null,
    hasCleanup: effect.cleanup.autoCleanup === true,
    overUsesGenericParticles: particleOnly || (effect.layers.length > 0 && particleCount / effect.layers.length > 0.5),
    overlapsWithOtherCharacter: maxOverlap >= OVERLAP_THRESHOLD,
  };

  let score = 0;
  if (checks.hasCharacterStyleProfile) score += WEIGHTS.hasCharacterStyleProfile; else warnings.push('No character style profile.');
  if (checks.hasSignatureObject) score += WEIGHTS.hasSignatureObject; else warnings.push('No signature object from this hero.');
  if (checks.hasDistinctGeometry) score += WEIGHTS.hasDistinctGeometry; else warnings.push('No distinct geometry layer.');
  if (checks.hasModelOrPhysicsObject) score += WEIGHTS.hasModelOrPhysicsObject; else warnings.push('No model or physics-object layer.');
  if (checks.hasImpactFeedback) score += WEIGHTS.hasImpactFeedback; else warnings.push('No camera/impact feedback.');
  if (checks.hasMotionLanguage) score += WEIGHTS.hasMotionLanguage; else warnings.push('No motion language tag.');
  if (checks.hasCleanup) score += WEIGHTS.hasCleanup; else warnings.push('Effect does not auto-cleanup.');
  if (!checks.overUsesGenericParticles) score += WEIGHTS.notOverUsesGenericParticles; else warnings.push('Over-relies on generic particles.');
  if (!checks.overlapsWithOtherCharacter) score += WEIGHTS.notOverlapsWithOtherCharacter; else warnings.push(`Overlaps with ${overlapWith} (${maxOverlap.toFixed(2)}).`);

  score = Math.min(100, score);
  // Particle-only effects can never pass — they are exactly the generic look this batch removes.
  if (particleOnly) score = Math.min(score, 40);

  const threshold = isShowcase ? SHOWCASE_THRESHOLD : BASE_THRESHOLD;
  return { abilityId, characterId, isShowcase, score, passed: score >= threshold, checks, warnings };
}

export function thresholdFor(abilityId: string): number {
  return isShowcaseAbility(abilityId) ? SHOWCASE_THRESHOLD : BASE_THRESHOLD;
}
