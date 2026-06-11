// The real-time vehicle⇄robot transformation (a core pillar, Batch 6). A data-driven, Edit-Mode-editable
// timeline of stages drives the backdrop, procedural part-unfold, model/animation switching, multi-shot
// camera and effects, then an interactive showcase, then the controller/collider switch into DESCENT.
// All four form strategies are supported; the default seeds use procedural primitive parts + a real robot
// model reveal at the finish (no dependency on unknown GLB clip names).

export type TransformationMode = 'full' | 'interactive' | 'quick';
export const TRANSFORMATION_MODES: readonly TransformationMode[] = ['full', 'interactive', 'quick'];

export type FormStrategy = 'dual-model-swap' | 'single-model-multi-animation' | 'modular-parts-procedural' | 'hybrid';
export const FORM_STRATEGIES: readonly FormStrategy[] = ['dual-model-swap', 'single-model-multi-animation', 'modular-parts-procedural', 'hybrid'];

// The character's transformable body parts (placeholder primitives now; real GLTF sockets later).
export type TransformationPartKey =
  | 'body' | 'wing_left' | 'wing_right' | 'arm_left' | 'arm_right' | 'leg_left' | 'leg_right' | 'head' | 'thruster_back';
export const TRANSFORMATION_PART_KEYS: readonly TransformationPartKey[] = [
  'body', 'wing_left', 'wing_right', 'arm_left', 'arm_right', 'leg_left', 'leg_right', 'head', 'thruster_back',
];

export type PartGeometryKind = 'core' | 'wing' | 'limb' | 'head' | 'thruster';
export const PART_GEOMETRY_KINDS: readonly PartGeometryKind[] = ['core', 'wing', 'limb', 'head', 'thruster'];

export interface TransformationPart {
  key: TransformationPartKey;
  geometry: PartGeometryKind;
  basePosition: [number, number, number];
  baseRotation: [number, number, number]; // degrees
  baseScale: number;
  color?: string;
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

export type TransformationStageType =
  | 'enter-stage' | 'backdrop-shift' | 'speed-line-burst' | 'camera-shot' | 'part-transform' | 'animation-clip'
  | 'model-visibility' | 'model-swap' | 'model-move' | 'effect-burst' | 'energy-ring' | 'voice-cue' | 'finish-pose'
  | 'interactive-showcase' | 'exit-stage';
export const TRANSFORMATION_STAGE_TYPES: readonly TransformationStageType[] = [
  'enter-stage', 'backdrop-shift', 'speed-line-burst', 'camera-shot', 'part-transform', 'animation-clip',
  'model-visibility', 'model-swap', 'model-move', 'effect-burst', 'energy-ring', 'voice-cue', 'finish-pose',
  'interactive-showcase', 'exit-stage',
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
}

export type EffectType = 'particle-burst' | 'energy-ring' | 'glow-pulse' | 'white-flash' | 'outline' | 'speed-line-burst' | 'thruster-flare' | 'sparkle' | 'ghost-burst';
export const EFFECT_TYPES: readonly EffectType[] = ['particle-burst', 'energy-ring', 'glow-pulse', 'white-flash', 'outline', 'speed-line-burst', 'thruster-flare', 'sparkle', 'ghost-burst'];

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
  // ── ghost-burst (clone) authoring — how the translucent clones spawn at the finale ──
  ghostCount?: number; // number of clone copies (default 5)
  ghostSpread?: number; // how far they fly out from the centre (world units, default 14)
  ghostPersist?: boolean; // keep them visible until the track ends (default true)
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
  modelScale?: number; // overall presenter scale (parts + models) — editable size of the whole performance
  baseYawDeg?: number; // the whole performance's facing (Y°) — applied to the root; the showcase spins on top
  modelSlotOffsets?: Partial<Record<ModelSlot, TransformationTransformOffset>>;
  backdropColor: string; // hex — echoes (but contrasts) the character colour
  particleColor: string; // hex
  parts: TransformationPart[];
  stages: TransformationStage[];
  cameraShots: TransformationCameraShot[];
  effectTracks: TransformationEffectTrack[];
  audioCues: TransformationAudioCue[];
  interactionShowcase: TransformationInteractionShowcase;
  controllerSwitchConfig: ControllerSwitchConfig;
  physicsSwitchConfig: PhysicsSwitchConfig;
  momentumTransferConfig: MomentumTransferConfig;
  videoCue?: TransformationVideoCue;
  editorMeta?: { thumbnailColor?: string; authorNotes?: string; tags?: string[] };
}
