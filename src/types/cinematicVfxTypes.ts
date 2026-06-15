// Cinematic VFX runtime — layered effect definitions (Batch F.5). A CinematicEffectDefinition is a stack of
// timed LAYERS; each layer bridges to ONE unified V2 effect (EffectTypeV2 + EffectParameters) so the existing
// pooled transformation renderers draw it — combat and transformations share one runtime. Camera layers write
// the combat camera-fx global. Particles are never the whole effect (model/geometry/fog mixed per §15).

import type { EffectTypeV2, EffectParameters } from './game/transformationEffects';
import type { GeometryEffectDefinition } from './game/combat';
import type { ParticleLayerSettings } from './particleEffectTypes';
import type { FogCloudLayerSettings } from './fogCloudEffectTypes';
import type { ModelLayerSettings } from './modelEffectTypes';
import type { PhysicsVfxObjectDefinition } from './physicsVfxTypes';
import type { VfxMotionLanguage } from './characterVfxStyleTypes';

export type CinematicEffectFamily =
  | 'speed' | 'dance' | 'police' | 'engineering' | 'drill' | 'sport' | 'wild' | 'stealth' | 'generic';
export const CINEMATIC_EFFECT_FAMILIES: readonly CinematicEffectFamily[] = [
  'speed', 'dance', 'police', 'engineering', 'drill', 'sport', 'wild', 'stealth', 'generic',
];

export type CinematicLayerType =
  | 'particle-burst' | 'particle-trail' | 'fog-cloud' | 'smoke-ring' | 'dust-cloud'
  | 'geometry-mesh' | 'model-component' | 'model-fragment' | 'object-assembly'
  | 'energy-field' | 'shield-panel' | 'scan-overlay' | 'lock-line' | 'ground-marker'
  | 'physics-object'
  | 'camera-feedback' | 'ui-feedback';
export const CINEMATIC_LAYER_TYPES: readonly CinematicLayerType[] = [
  'particle-burst', 'particle-trail', 'fog-cloud', 'smoke-ring', 'dust-cloud',
  'geometry-mesh', 'model-component', 'model-fragment', 'object-assembly',
  'energy-field', 'shield-panel', 'scan-overlay', 'lock-line', 'ground-marker',
  'physics-object',
  'camera-feedback', 'ui-feedback',
];

export type CinematicAttachTo =
  | 'character-root' | 'character-socket' | 'target' | 'world-position' | 'hit-point' | 'arena-center' | 'screen-ui';
export const CINEMATIC_ATTACH_TO: readonly CinematicAttachTo[] = [
  'character-root', 'character-socket', 'target', 'world-position', 'hit-point', 'arena-center', 'screen-ui',
];

export interface CinematicCameraFeedbackSettings {
  screenShake?: { enabled: boolean; intensity: number; durationSeconds: number };
  fovPulse?: { enabled: boolean; amount: number; durationSeconds: number };
  hitStop?: { enabled: boolean; durationSeconds: number; onlyOnHit: boolean };
  focusHint?: { enabled: boolean; target: 'caster' | 'target' | 'hit-point' | 'arena-center'; durationSeconds: number };
}

export interface CinematicMaterialSettings {
  color?: string;
  emissive?: string;
  opacity?: number;
  blendMode?: 'normal' | 'additive' | 'multiply';
}

export interface CinematicEffectLayerDefinition {
  id: string;
  layerType: CinematicLayerType;
  // Bridge to the unified V2 engine — the effect type the registry renderer actually draws.
  v2EffectType: EffectTypeV2;
  startTimeSeconds: number;
  durationSeconds: number;
  attachTo: CinematicAttachTo;
  socketName?: string;
  transform?: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  };
  // High-level authoring settings (translated into V2 EffectParameters by the director).
  particle?: ParticleLayerSettings;
  fogCloud?: FogCloudLayerSettings;
  geometry?: GeometryEffectDefinition;
  model?: ModelLayerSettings;
  camera?: CinematicCameraFeedbackSettings;
  material?: CinematicMaterialSettings;
  // Batch F.6 — a physics-object layer spawns lightweight kinematic VFX objects (debris/panels/balls/rubble).
  physicsObject?: PhysicsVfxObjectDefinition;
  // Direct V2 parameter overrides (advanced authoring) merged on top of the translation.
  paramsOverride?: EffectParameters;
  color?: string;
  editorMeta?: { notes?: string; previewColor?: string };
}

export type CinematicTimelineEvent =
  | 'spawn-layer' | 'scale-layer' | 'move-layer' | 'fade-layer' | 'trigger-hit'
  | 'camera-shake' | 'fov-pulse' | 'hit-stop' | 'cleanup-layer';

export interface CinematicEffectDefinition {
  id: string;
  name: string;
  effectFamily: CinematicEffectFamily;
  // Batch F.6 — authoring metadata for the quality scorer + cross-character overlap detector.
  characterId?: string;
  signatureObjectIds?: string[];
  motionLanguage?: VfxMotionLanguage;
  layers: CinematicEffectLayerDefinition[];
  timeline: {
    totalDurationSeconds: number;
    keyframes?: { time: number; event: CinematicTimelineEvent; targetLayerId?: string; value?: number }[];
  };
  pooling: { poolId: string; reusable: boolean };
  cleanup: { autoCleanup: boolean; cleanupDelaySeconds?: number };
  debug?: { showBounds?: boolean; showTimeline?: boolean; showLayerNames?: boolean };
}

export interface CinematicVfxValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}
