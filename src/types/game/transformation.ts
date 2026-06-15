// The real-time vehicle⇄robot transformation (a core pillar, Batch 6). A data-driven, Edit-Mode-editable
// timeline of stages drives the backdrop, procedural part-unfold, model/animation switching, multi-shot
// camera and effects, then an interactive showcase, then the controller/collider switch into DESCENT.
// All four form strategies are supported; the default seeds use procedural primitive parts + a real robot
// model reveal at the finish (no dependency on unknown GLB clip names).

export type TransformationMode = 'full' | 'interactive' | 'quick';
export const TRANSFORMATION_MODES: readonly TransformationMode[] = ['full', 'interactive', 'quick'];

export type FormStrategy = 'dual-model-swap' | 'single-model-multi-animation' | 'modular-parts-procedural' | 'hybrid';
export const FORM_STRATEGIES: readonly FormStrategy[] = ['dual-model-swap', 'single-model-multi-animation', 'modular-parts-procedural', 'hybrid'];

// A transformable body part. `key` is now an ARBITRARY id (any string) — parts are fully user-defined: add any
// number of them, each with its own name, geometry/primitive or GLB model. TRANSFORMATION_PART_KEYS are only
// suggested defaults used by the seeds; stage/camera/effect part-pickers read the definition's own parts list.
export type TransformationPartKey = string;
export const TRANSFORMATION_PART_KEYS: readonly string[] = [
  'body', 'wing_left', 'wing_right', 'arm_left', 'arm_right', 'leg_left', 'leg_right', 'head', 'thruster_back',
];

export type PartGeometryKind = 'core' | 'wing' | 'limb' | 'head' | 'thruster' | 'box' | 'sphere' | 'cylinder';
export const PART_GEOMETRY_KINDS: readonly PartGeometryKind[] = ['core', 'wing', 'limb', 'head', 'thruster', 'box', 'sphere', 'cylinder'];

export interface TransformationPart {
  key: TransformationPartKey;
  name?: string; // display label (key stays the stable id referenced by stages)
  geometry: PartGeometryKind;
  basePosition: [number, number, number];
  baseRotation: [number, number, number]; // degrees
  baseScale: number;
  color?: string;
  assetId?: string; // optional GLB model for this part (empty = the procedural primitive `geometry`)
  modelTarget?: number; // normalized model size when assetId set (default 1.2)
}

export type Easing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
export const EASINGS: readonly Easing[] = ['linear', 'easeIn', 'easeOut', 'easeInOut'];

export type ModelSlot = 'plane' | 'robot' | 'shared';
export const MODEL_SLOTS: readonly ModelSlot[] = ['plane', 'robot', 'shared'];

export type TransformationVec3 = [number, number, number];

export interface TransformationTransformOffset {
  position: TransformationVec3;
  rotation: TransformationVec3; // degrees
  scale: number;
}

export type CameraRotationMode = 'auto' | 'locked' | 'stage-controlled' | 'inherit';
export const CAMERA_ROTATION_MODES: readonly CameraRotationMode[] = ['auto', 'locked', 'stage-controlled', 'inherit'];

export type TransformationStageType =
  | 'enter-stage' | 'backdrop-shift' | 'speed-line-burst' | 'camera-shot' | 'part-transform' | 'animation-clip'
  | 'model-visibility' | 'model-swap' | 'model-move' | 'effect-burst' | 'energy-ring' | 'clone-hero-burst'
  | 'cloud-ripple-burst' | 'voice-cue' | 'finish-pose' | 'interactive-showcase' | 'exit-stage';
export const TRANSFORMATION_STAGE_TYPES: readonly TransformationStageType[] = [
  'enter-stage', 'backdrop-shift', 'speed-line-burst', 'camera-shot', 'part-transform', 'animation-clip',
  'model-visibility', 'model-swap', 'model-move', 'effect-burst', 'energy-ring', 'clone-hero-burst',
  'cloud-ripple-burst', 'voice-cue', 'finish-pose', 'interactive-showcase', 'exit-stage',
];

// One typed params bag used per stage type (only the relevant fields are read). Typed, no `any`.
export interface StageParams {
  partKey?: TransformationPartKey;
  toPosition?: [number, number, number];
  toRotation?: [number, number, number]; // degrees
  toScale?: number;
  visible?: boolean;
  modelSlot?: ModelSlot;
  modelRef?: string; // model-swap: arbitrary model-library id (overrides the slot — chain any number of swaps)
  modelOffset?: TransformationTransformOffset; // model-swap arbitrary model placement/size offset
  clipName?: string;
  clipSpeed?: number;
  loop?: boolean;
  holdFinal?: boolean;
  color?: string;
  intensity?: number;
  scale?: number;
  ringRadius?: number;
  cameraShotType?: CameraShotType;
  distance?: number;
  height?: number;
  angle?: number;
  fov?: number;
  shakeIntensity?: number;
  lookAtOffset?: [number, number, number];
  rotationMode?: CameraRotationMode;
  rotateSpeedDeg?: number;
  followTargetPart?: TransformationPartKey;
  spawnOffset?: [number, number, number];
  repeat?: number;
  ringCount?: number;
  particleCount?: number;
  ghostCount?: number;
  ghostSpread?: number;
  ghostPersist?: boolean;
  fromPosition?: [number, number, number];
  fromRotation?: [number, number, number];
  fromScale?: number;
  text?: string;
  backdropIntensity?: number; // backdrop-shift
  targetPhase?: string; // exit-stage → 'DESCENT'
}

export interface TransformationStage {
  id: string;
  type: TransformationStageType;
  startTime: number; // sec
  duration: number; // sec
  label?: string;
  enabled: boolean;
  essential?: boolean; // kept in quick mode (model-swap / finish / exit / a key effect)
  easing?: Easing;
  params: StageParams;
}

export type CameraShotType = 'orbit' | 'close-up' | 'low-angle' | 'top-down' | 'side-pan' | 'pull-back' | 'finish-hero-shot';
export const CAMERA_SHOT_TYPES: readonly CameraShotType[] = ['orbit', 'close-up', 'low-angle', 'top-down', 'side-pan', 'pull-back', 'finish-hero-shot'];

export interface TransformationCameraShot {
  id: string;
  type: CameraShotType;
  startTime: number;
  duration: number;
  targetPart?: TransformationPartKey;
  distance: number;
  height: number;
  angle: number; // degrees around the character
  fov: number;
  easing?: Easing;
  shakeIntensity?: number;
  lookAtOffset?: [number, number, number];
  rotationMode?: CameraRotationMode;
  rotateSpeedDeg?: number;
}

export type EffectType = 'particle-burst' | 'energy-ring' | 'glow-pulse' | 'white-flash' | 'outline' | 'speed-line-burst' | 'thruster-flare' | 'sparkle' | 'ghost-burst' | 'cloud-ripple-burst';
export const EFFECT_TYPES: readonly EffectType[] = ['particle-burst', 'energy-ring', 'glow-pulse', 'white-flash', 'outline', 'speed-line-burst', 'thruster-flare', 'sparkle', 'ghost-burst', 'cloud-ripple-burst'];

export interface TransformationEffectTrack {
  id: string;
  type: EffectType;
  startTime: number;
  duration: number;
  color?: string;
  intensity?: number;
  scale?: number;
  followTargetPart?: TransformationPartKey;
  spawnOffset?: [number, number, number];
  repeat?: number;
  easing?: Easing;
  modelSlot?: ModelSlot; // clone effects: which visible actor slot to overlay
  modelRef?: string; // clone effects: overlay the active arbitrary model when it matches
  // ── ghost-burst clone-overlay authoring ──
  ghostCount?: number; // legacy field; clone-hero-burst now renders one full-model overlay
  ghostSpread?: number; // star burst radius (world units, default 14)
  ghostPersist?: boolean; // keep the overlay visible until the final fade window (default true)
  ringCount?: number; // cloud-ripple-burst rings (default 5)
  particleCount?: number; // cloud-ripple-burst smoke count (default 170)
}

export type TransformationTimeTrackInterpolation = 'linear' | 'hold';

export type TransformationTimeTrackTarget =
  | { kind: 'root' }
  | { kind: 'model-slot'; slot: ModelSlot }
  | { kind: 'part'; partKey: TransformationPartKey }
  | { kind: 'stage-model'; stageId: string }
  | { kind: 'stage-move'; stageId: string }
  | { kind: 'stage-part-move'; stageId: string }
  | { kind: 'effect'; effectId: string }
  | { kind: 'camera-shot'; shotId: string }
  | { kind: 'camera-look'; shotId: string };

export interface TransformationTimeKeyframe {
  time: number;
  position?: TransformationVec3;
  rotation?: TransformationVec3; // degrees
  scale?: number;
}

export interface TransformationTimeTrack {
  id: string;
  target: TransformationTimeTrackTarget;
  interpolation?: TransformationTimeTrackInterpolation;
  keyframes: TransformationTimeKeyframe[];
}

export interface TransformationAudioCue {
  id: string;
  startTime: number;
  text?: string;
  voiceAssetId?: string;
}

export interface TransformationInteractionShowcase {
  enabled: boolean;
  rotateSpeedDeg: number;
  poses: string[]; // labels for keys 1/2/3
  promptText?: string;
}

export interface ControllerSwitchConfig {
  planeControllerDisableTime: number; // sec — must be before robotControllerEnableTime
  robotControllerEnableTime: number; // sec — at/after the form switch
}
export interface PhysicsSwitchConfig {
  planeColliderDisableTime: number;
  robotColliderEnableTime: number;
  transitionalCollider?: boolean; // allow brief overlap only if explicitly set
}
export interface MomentumTransferConfig {
  preserveHorizontalVelocity: boolean;
  horizontalVelocityMultiplier: number;
  initialDescentVelocity: number;
  clampMaxDescentSpeed: number;
  faceCameraOnExit: boolean;
}

// Interface only — the transform must complete on the 3D timeline even without any video asset.
export interface TransformationVideoCue {
  videoAssetId: string;
  startTime: number;
  duration: number;
  blendMode: 'overlay' | 'full-screen' | 'mask-transition';
  skippable: boolean;
}

export interface TransformationDefinition {
  id: string;
  characterId?: string;
  name: string;
  description?: string;
  formStrategy: FormStrategy;
  modeAvailability: { full: boolean; interactive: boolean; quick: boolean };
  totalDurationSec: number;
  quickDurationSec: number;
  planeModelRef?: string; // model-library id
  robotModelRef?: string;
  sharedModelRef?: string;
  rootPosition?: TransformationVec3; // whole performance/root placement in the transformation showcase
  rootRotation?: TransformationVec3; // whole performance/root rotation in degrees
  modelScale?: number; // overall presenter scale (parts + models) — editable size of the whole performance
  baseYawDeg?: number; // the whole performance's facing (Y°) — applied to the root; the showcase spins on top
  cameraRotationMode?: Exclude<CameraRotationMode, 'inherit'>;
  cameraRotateSpeedDeg?: number;
  modelSlotOffsets?: Partial<Record<ModelSlot, TransformationTransformOffset>>;
  backdropColor: string; // hex — echoes (but contrasts) the character colour
  particleColor: string; // hex
  parts: TransformationPart[];
  stages: TransformationStage[];
  cameraShots: TransformationCameraShot[];
  effectTracks: TransformationEffectTrack[];
  effects?: import('./transformationEffects').TransformationEffectConfig[]; // v2 registry-driven effects (additive)
  timeTracks?: TransformationTimeTrack[];
  audioCues: TransformationAudioCue[];
  interactionShowcase: TransformationInteractionShowcase;
  controllerSwitchConfig: ControllerSwitchConfig;
  physicsSwitchConfig: PhysicsSwitchConfig;
  momentumTransferConfig: MomentumTransferConfig;
  videoCue?: TransformationVideoCue;
  editorMeta?: { thumbnailColor?: string; authorNotes?: string; tags?: string[] };
}
