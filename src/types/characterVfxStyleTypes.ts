// Character VFX visual language (Batch F.6) — each hero gets a distinct style profile so abilities read as
// THAT character (not generic sci-fi). Drives the quality scorer + the editor.

export type VfxPrimaryShape =
  | 'line' | 'arc' | 'cone' | 'ring' | 'spiral' | 'grid' | 'panel' | 'fragment'
  | 'shockwave' | 'trail' | 'dome' | 'beam' | 'sphere';

export type VfxMotionLanguage =
  | 'fast-linear' | 'rhythmic-circular' | 'defensive-grid' | 'mechanical-assembly'
  | 'heavy-ground-impact' | 'bouncy-ricochet' | 'organic-wave' | 'stealth-scan';

export const VFX_MOTION_LANGUAGES: readonly VfxMotionLanguage[] = [
  'fast-linear', 'rhythmic-circular', 'defensive-grid', 'mechanical-assembly',
  'heavy-ground-impact', 'bouncy-ricochet', 'organic-wave', 'stealth-scan',
];

export interface CharacterVfxStyleProfile {
  characterId: string;
  visualKeywords: string[];
  primaryShapes: VfxPrimaryShape[];
  forbiddenOverusedShapes?: string[];
  signatureObjects: string[];
  motionLanguage: VfxMotionLanguage;
  materialLanguage: {
    transparent?: boolean;
    metallic?: boolean;
    holographic?: boolean;
    dusty?: boolean;
    smoky?: boolean;
    energy?: boolean;
    physicalDebris?: boolean;
  };
  particleLanguage: {
    allowedParticleFamilies: string[];
    maxParticleReliance: 'low' | 'medium' | 'high-but-secondary';
  };
  physicsObjectLanguage: {
    preferredObjects: string[];
    collisionBehavior: 'none' | 'debris' | 'bounce' | 'assemble' | 'orbit' | 'scatter' | 'shield-panels' | 'ground-fracture';
  };
  cameraFeedbackStyle: {
    screenShakeIntensity: 'none' | 'small' | 'medium' | 'heavy';
    fovPulse: boolean;
    hitStop: boolean;
    slowMotionWindow: boolean;
  };
  readabilityRules: {
    silhouetteMustBeDistinct: boolean;
    avoidSameAsCharacterIds: string[];
    maxSimultaneousMajorLayers: number;
  };
}

// ---- Quality scoring ----

export interface CinematicVfxQualityChecks {
  hasCharacterStyleProfile: boolean;
  hasSignatureObject: boolean;
  hasDistinctGeometry: boolean;
  hasModelOrPhysicsObject: boolean;
  hasImpactFeedback: boolean;
  hasMotionLanguage: boolean;
  hasCleanup: boolean;
  overUsesGenericParticles: boolean;
  overlapsWithOtherCharacter: boolean;
}

export interface CinematicVfxQualityScore {
  abilityId: string;
  characterId: string;
  isShowcase: boolean;
  score: number;
  passed: boolean;
  checks: CinematicVfxQualityChecks;
  warnings: string[];
}
