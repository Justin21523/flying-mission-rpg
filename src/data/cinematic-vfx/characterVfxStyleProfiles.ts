import type { CharacterVfxStyleProfile } from '../../types/characterVfxStyleTypes';

// Per-hero visual language (Batch F.6) — drives the quality scorer + the editor so every ability reads as
// THAT character, not generic sci-fi. signatureObjects match the keys in signatureEffectLibrary.ts.
export const SEED_VFX_STYLE_PROFILES: CharacterVfxStyleProfile[] = [
  {
    characterId: 'char_jett', visualKeywords: ['speed', 'jet-trails', 'afterimage', 'wind', 'rescue-routes'],
    primaryShapes: ['line', 'trail', 'arc', 'beam', 'spiral'], forbiddenOverusedShapes: ['panel', 'grid'],
    signatureObjects: ['speedSplineRoute', 'afterimageBurst', 'windTunnelFog', 'rescueLockMarker', 'thrusterStreak'],
    motionLanguage: 'fast-linear',
    materialLanguage: { transparent: true, energy: true, smoky: true },
    particleLanguage: { allowedParticleFamilies: ['trail', 'sparks'], maxParticleReliance: 'medium' },
    physicsObjectLanguage: { preferredObjects: ['debris'], collisionBehavior: 'scatter' },
    cameraFeedbackStyle: { screenShakeIntensity: 'small', fovPulse: true, hitStop: false, slowMotionWindow: false },
    readabilityRules: { silhouetteMustBeDistinct: true, avoidSameAsCharacterIds: ['char_chase'], maxSimultaneousMajorLayers: 4 },
  },
  {
    characterId: 'char_jerome', visualKeywords: ['stage', 'spotlight', 'rhythm', 'dance', 'performance'],
    primaryShapes: ['ring', 'spiral', 'cone', 'panel'], forbiddenOverusedShapes: ['grid', 'fragment'],
    signatureObjects: ['stageRing', 'spotlightCone', 'rhythmPulseBar', 'dancerAfterimage', 'sparkleMotes'],
    motionLanguage: 'rhythmic-circular',
    materialLanguage: { transparent: true, energy: true, holographic: true },
    particleLanguage: { allowedParticleFamilies: ['motes', 'sparks'], maxParticleReliance: 'medium' },
    physicsObjectLanguage: { preferredObjects: ['shield-tile'], collisionBehavior: 'orbit' },
    cameraFeedbackStyle: { screenShakeIntensity: 'small', fovPulse: true, hitStop: false, slowMotionWindow: false },
    readabilityRules: { silhouetteMustBeDistinct: true, avoidSameAsCharacterIds: ['char_paul'], maxSimultaneousMajorLayers: 4 },
  },
  {
    characterId: 'char_paul', visualKeywords: ['police', 'shield', 'barrier', 'lockdown', 'order'],
    primaryShapes: ['panel', 'grid', 'ring', 'shockwave'], forbiddenOverusedShapes: ['spiral', 'sphere'],
    signatureObjects: ['policeShieldPanel', 'roadBarrierWall', 'lockdownGrid', 'containmentCuff', 'signalLights'],
    motionLanguage: 'defensive-grid',
    materialLanguage: { transparent: true, metallic: true, energy: true },
    particleLanguage: { allowedParticleFamilies: ['sparks'], maxParticleReliance: 'low' },
    physicsObjectLanguage: { preferredObjects: ['metal-panel', 'shield-tile'], collisionBehavior: 'shield-panels' },
    cameraFeedbackStyle: { screenShakeIntensity: 'medium', fovPulse: false, hitStop: true, slowMotionWindow: false },
    readabilityRules: { silhouetteMustBeDistinct: true, avoidSameAsCharacterIds: ['char_donnie'], maxSimultaneousMajorLayers: 4 },
  },
  {
    characterId: 'char_donnie', visualKeywords: ['tools', 'build', 'repair', 'panels', 'mechanical'],
    primaryShapes: ['panel', 'fragment', 'grid', 'arc'], forbiddenOverusedShapes: ['ring', 'beam'],
    signatureObjects: ['toolArmSwarm', 'metalPanelAssembly', 'repairNode', 'magneticScrap', 'constructionGrid'],
    motionLanguage: 'mechanical-assembly',
    materialLanguage: { metallic: true, physicalDebris: true, energy: true },
    particleLanguage: { allowedParticleFamilies: ['sparks'], maxParticleReliance: 'low' },
    physicsObjectLanguage: { preferredObjects: ['metal-panel', 'repair-tool', 'energy-fragment'], collisionBehavior: 'assemble' },
    cameraFeedbackStyle: { screenShakeIntensity: 'medium', fovPulse: false, hitStop: true, slowMotionWindow: false },
    readabilityRules: { silhouetteMustBeDistinct: true, avoidSameAsCharacterIds: ['char_paul'], maxSimultaneousMajorLayers: 4 },
  },
  {
    characterId: 'char_todd', visualKeywords: ['drill', 'ground-crack', 'rubble', 'underground', 'impact'],
    primaryShapes: ['shockwave', 'fragment', 'cone', 'ring'], forbiddenOverusedShapes: ['grid', 'beam'],
    signatureObjects: ['spinningDrill', 'groundCrack', 'rockRubble', 'dirtCloud', 'craterRing'],
    motionLanguage: 'heavy-ground-impact',
    materialLanguage: { dusty: true, physicalDebris: true, metallic: true },
    particleLanguage: { allowedParticleFamilies: ['debris', 'dust'], maxParticleReliance: 'medium' },
    physicsObjectLanguage: { preferredObjects: ['rubble', 'drill-fragment'], collisionBehavior: 'ground-fracture' },
    cameraFeedbackStyle: { screenShakeIntensity: 'heavy', fovPulse: false, hitStop: true, slowMotionWindow: false },
    readabilityRules: { silhouetteMustBeDistinct: true, avoidSameAsCharacterIds: ['char_donnie'], maxSimultaneousMajorLayers: 4 },
  },
  {
    characterId: 'char_flip', visualKeywords: ['sport', 'ball', 'bounce', 'court', 'ricochet'],
    primaryShapes: ['sphere', 'arc', 'panel', 'trail'], forbiddenOverusedShapes: ['grid', 'fragment'],
    signatureObjects: ['sportBall', 'bounceTrajectory', 'stadiumBoundary', 'reboundPanel', 'scoreFlash'],
    motionLanguage: 'bouncy-ricochet',
    materialLanguage: { energy: true, transparent: true, physicalDebris: true },
    particleLanguage: { allowedParticleFamilies: ['sparks'], maxParticleReliance: 'low' },
    physicsObjectLanguage: { preferredObjects: ['sport-ball'], collisionBehavior: 'bounce' },
    cameraFeedbackStyle: { screenShakeIntensity: 'small', fovPulse: true, hitStop: false, slowMotionWindow: true },
    readabilityRules: { silhouetteMustBeDistinct: true, avoidSameAsCharacterIds: ['char_jerome'], maxSimultaneousMajorLayers: 4 },
  },
  {
    characterId: 'char_bello', visualKeywords: ['animal', 'sound', 'nature', 'wild', 'instinct'],
    primaryShapes: ['cone', 'ring', 'arc', 'sphere'], forbiddenOverusedShapes: ['grid', 'panel'],
    signatureObjects: ['animalSpirit', 'soundCone', 'natureFog', 'pawMark', 'echoRing'],
    motionLanguage: 'organic-wave',
    materialLanguage: { smoky: true, energy: true, transparent: true },
    particleLanguage: { allowedParticleFamilies: ['motes', 'dust'], maxParticleReliance: 'medium' },
    physicsObjectLanguage: { preferredObjects: ['animal-spirit-placeholder'], collisionBehavior: 'none' },
    cameraFeedbackStyle: { screenShakeIntensity: 'small', fovPulse: false, hitStop: false, slowMotionWindow: false },
    readabilityRules: { silhouetteMustBeDistinct: true, avoidSameAsCharacterIds: ['char_chase'], maxSimultaneousMajorLayers: 4 },
  },
  {
    characterId: 'char_chase', visualKeywords: ['scan', 'stealth', 'weakpoint', 'data', 'targeting'],
    primaryShapes: ['grid', 'cone', 'ring', 'line'], forbiddenOverusedShapes: ['sphere', 'shockwave'],
    signatureObjects: ['scanCone', 'dataGrid', 'weakpointRing', 'hologramDecoy', 'dataFragment'],
    motionLanguage: 'stealth-scan',
    materialLanguage: { holographic: true, energy: true, transparent: true },
    particleLanguage: { allowedParticleFamilies: ['electric'], maxParticleReliance: 'low' },
    physicsObjectLanguage: { preferredObjects: ['hologram-decoy', 'energy-fragment'], collisionBehavior: 'orbit' },
    cameraFeedbackStyle: { screenShakeIntensity: 'none', fovPulse: false, hitStop: true, slowMotionWindow: true },
    readabilityRules: { silhouetteMustBeDistinct: true, avoidSameAsCharacterIds: ['char_jett'], maxSimultaneousMajorLayers: 4 },
  },
];

export function getStyleProfile(characterId: string | undefined): CharacterVfxStyleProfile | undefined {
  if (!characterId) return undefined;
  return SEED_VFX_STYLE_PROFILES.find((p) => p.characterId === characterId);
}
