import type { TransformationDefinition, TransformationStage, TransformationCameraShot, TransformationEffectTrack, TransformationPart } from '../../types/game/transformation';
import { heroPoseAssetIds } from './superWingsModels';

// Seed transformation timelines — one per roster character (id matches CharacterDefinition.transformationId).
// Default strategy = modular-parts-procedural: primitive parts unfold, then the character's real robot model
// is revealed at the finish (no dependency on unknown GLB clip names). 3 characters get a distinct flavour.
// Everything here is editable in the ✨ Transform tab.

type Flavour = 'speed' | 'copter' | 'engineer' | 'default';

const STD_PARTS: TransformationPart[] = [
  { key: 'body', geometry: 'core', basePosition: [0, 0, 0], baseRotation: [0, 0, 0], baseScale: 1 },
  { key: 'wing_left', geometry: 'wing', basePosition: [-1.2, 0, 0], baseRotation: [0, 0, 0], baseScale: 1 },
  { key: 'wing_right', geometry: 'wing', basePosition: [1.2, 0, 0], baseRotation: [0, 0, 0], baseScale: 1 },
  { key: 'arm_left', geometry: 'limb', basePosition: [-0.6, 0, 0], baseRotation: [0, 0, 0], baseScale: 1 },
  { key: 'arm_right', geometry: 'limb', basePosition: [0.6, 0, 0], baseRotation: [0, 0, 0], baseScale: 1 },
  { key: 'leg_left', geometry: 'limb', basePosition: [-0.4, -0.4, 0], baseRotation: [0, 0, 0], baseScale: 1 },
  { key: 'leg_right', geometry: 'limb', basePosition: [0.4, -0.4, 0], baseRotation: [0, 0, 0], baseScale: 1 },
  { key: 'head', geometry: 'head', basePosition: [0, 0.3, 0], baseRotation: [0, 0, 0], baseScale: 1 },
  { key: 'thruster_back', geometry: 'thruster', basePosition: [0, 0, -0.6], baseRotation: [0, 0, 0], baseScale: 1 },
];

// ~22s cinematic choreography: 0–9 slow per-part close-up tour → 9–15 unfold → 15–18 BIG transform moment
// (white flash + robot reveal + translucent same-colour ghost clones bursting from the body centre) →
// 18–19.5 hero finish → 19.5–22 slow descent while the backdrop fades to open sky (still airborne).
const STD_STAGES: TransformationStage[] = [
  { id: 'g_enter', type: 'enter-stage', startTime: 0, duration: 0.3, enabled: true, label: 'enter', params: {} },
  { id: 'g_backdrop', type: 'backdrop-shift', startTime: 0.3, duration: 0.3, enabled: true, label: 'backdrop on', params: { backdropIntensity: 1 } },
  { id: 'g_speed', type: 'speed-line-burst', startTime: 0.6, duration: 15, enabled: true, label: 'speed lines', params: { intensity: 1 } },
  // ── part tour shimmers (the camera shots do the focusing; the focused part stirs gently) ──
  { id: 't_wl', type: 'part-transform', startTime: 1.0, duration: 1.2, enabled: true, easing: 'easeInOut', label: 'wing L stir', params: { partKey: 'wing_left', toRotation: [0, 0, 10] } },
  { id: 't_body', type: 'part-transform', startTime: 3.0, duration: 1.2, enabled: true, easing: 'easeInOut', label: 'body hum', params: { partKey: 'body', toScale: 1.06 } },
  { id: 't_head', type: 'part-transform', startTime: 5.0, duration: 1.0, enabled: true, easing: 'easeInOut', label: 'head peek', params: { partKey: 'head', toPosition: [0, 0.45, 0] } },
  { id: 't_arm', type: 'part-transform', startTime: 6.6, duration: 1.0, enabled: true, easing: 'easeInOut', label: 'arm stir', params: { partKey: 'arm_left', toRotation: [0, 0, 12] } },
  // ── unfold ──
  { id: 'g_wl', type: 'part-transform', startTime: 9.0, duration: 1.4, enabled: true, easing: 'easeInOut', label: 'wing L fold', params: { partKey: 'wing_left', toPosition: [-2, 0.3, 0.2], toRotation: [0, 0, 70] } },
  { id: 'g_wr', type: 'part-transform', startTime: 9.0, duration: 1.4, enabled: true, easing: 'easeInOut', label: 'wing R fold', params: { partKey: 'wing_right', toPosition: [2, 0.3, 0.2], toRotation: [0, 0, -70] } },
  { id: 'g_al', type: 'part-transform', startTime: 10.6, duration: 1.2, enabled: true, easing: 'easeOut', label: 'arm L', params: { partKey: 'arm_left', toPosition: [-1.4, -0.2, 0.2], toRotation: [0, 0, 20] } },
  { id: 'g_ar', type: 'part-transform', startTime: 10.6, duration: 1.2, enabled: true, easing: 'easeOut', label: 'arm R', params: { partKey: 'arm_right', toPosition: [1.4, -0.2, 0.2], toRotation: [0, 0, -20] } },
  { id: 'g_ll', type: 'part-transform', startTime: 11.9, duration: 1.1, enabled: true, easing: 'easeOut', label: 'leg L', params: { partKey: 'leg_left', toPosition: [-0.5, -1.4, 0] } },
  { id: 'g_lr', type: 'part-transform', startTime: 11.9, duration: 1.1, enabled: true, easing: 'easeOut', label: 'leg R', params: { partKey: 'leg_right', toPosition: [0.5, -1.4, 0] } },
  { id: 'g_head', type: 'part-transform', startTime: 13.1, duration: 0.9, enabled: true, easing: 'easeOut', label: 'head reveal', params: { partKey: 'head', toPosition: [0, 0.9, 0] } },
  { id: 'g_thr', type: 'part-transform', startTime: 14.0, duration: 0.8, enabled: true, easing: 'easeOut', label: 'thrusters', params: { partKey: 'thruster_back', toPosition: [0, 0.6, -0.7], toRotation: [20, 0, 0] } },
  // ── BIG transform moment ── (the white flash covers the cut: parts vanish, only the REAL model remains)
  { id: 'g_hideparts', type: 'part-transform', startTime: 15.45, duration: 0.05, enabled: true, essential: true, label: 'hide all parts', params: { visible: false } },
  { id: 'g_robot', type: 'model-visibility', startTime: 15.5, duration: 0.1, enabled: true, essential: true, label: 'robot reveal', params: { modelSlot: 'robot', visible: true } },
  { id: 'g_finish', type: 'finish-pose', startTime: 18.0, duration: 1.0, enabled: true, essential: true, label: 'finish pose', params: {} },
  { id: 'g_show', type: 'interactive-showcase', startTime: 19.0, duration: 0.5, enabled: true, label: 'showcase', params: {} },
  // ── slow descent + backdrop fade-out (still airborne) ──
  { id: 'g_fade', type: 'backdrop-shift', startTime: 19.5, duration: 2.4, enabled: true, essential: true, easing: 'easeInOut', label: 'backdrop fade to sky', params: { backdropIntensity: 0 } },
  { id: 'g_exit', type: 'exit-stage', startTime: 19.5, duration: 2.5, enabled: true, essential: true, easing: 'easeInOut', label: 'slow descent → DESCENT', params: { targetPhase: 'DESCENT', intensity: 8 } },
];

function shots(flavour: Flavour): TransformationCameraShot[] {
  const fast = flavour === 'speed';
  const heavy = flavour === 'engineer';
  return [
    // slow per-part tour — wing → body → head → arm → low sweep
    { id: 'c_wing', type: 'close-up', startTime: 0.0, duration: 2.6, targetPart: 'wing_left', distance: 3, height: 0.8, angle: 40, fov: 38, easing: 'easeInOut' },
    { id: 'c_body', type: 'close-up', startTime: 2.6, duration: 2.2, targetPart: 'body', distance: 3.2, height: 0.6, angle: 110, fov: 40, easing: 'easeInOut' },
    { id: 'c_head', type: 'close-up', startTime: 4.8, duration: 1.8, targetPart: 'head', distance: 2.6, height: 1.2, angle: 200, fov: 36, easing: 'easeInOut' },
    { id: 'c_arm', type: 'close-up', startTime: 6.6, duration: 1.6, targetPart: 'arm_left', distance: 2.8, height: 0.4, angle: 290, fov: 38, easing: 'easeInOut' },
    { id: 'c_sweep', type: 'low-angle', startTime: 8.2, duration: 1.6, distance: heavy ? 7 : 6, height: -1.2, angle: 180, fov: 48, easing: 'easeInOut' },
    // unfold — orbiting medium shot
    { id: 'c_orbit', type: 'orbit', startTime: 9.8, duration: 5.2, distance: 7.5, height: 2, angle: 0, fov: fast ? 58 : 52, easing: 'easeInOut', shakeIntensity: fast ? 0.06 : 0 },
    // big moment + hero
    { id: 'c_burst', type: 'pull-back', startTime: 15.0, duration: 2.6, distance: 9, height: 2.4, angle: 30, fov: 55, shakeIntensity: 0.12, easing: 'easeOut' },
    { id: 'c_hero', type: 'finish-hero-shot', startTime: 17.6, duration: 4.4, distance: 6.5, height: 1.6, angle: 20, fov: 45, shakeIntensity: 0.06, easing: 'easeOut' },
  ];
}

function effects(particle: string, ring: string): TransformationEffectTrack[] {
  return [
    { id: 'fx_flash', type: 'white-flash', startTime: 15.2, duration: 0.6, color: '#ffffff', intensity: 1 },
    { id: 'fx_ring', type: 'energy-ring', startTime: 15.4, duration: 1.4, color: ring, scale: 2.4 },
    // the beauty shot — translucent CHARACTER-MODEL clones bursting outward from the body centre, constant
    // opacity (no fade), spreading until they reach the view edge
    { id: 'fx_ghost', type: 'ghost-burst', startTime: 15.5, duration: 4.0, color: particle, intensity: 1, scale: 1.6, repeat: 6 },
    { id: 'fx_glow', type: 'glow-pulse', startTime: 15.6, duration: 1.8, color: particle, intensity: 1 },
    { id: 'fx_ring2', type: 'energy-ring', startTime: 16.4, duration: 1.2, color: ring, scale: 3.2 },
    { id: 'fx_spark', type: 'sparkle', startTime: 17.0, duration: 1.4, color: particle, followTargetPart: 'head' },
  ];
}

interface Knobs { id: string; characterId: string; name: string; backdrop: string; particle: string; ring: string; flavour: Flavour; poses: string[]; }
// Optional finish-pose MODEL swap (non-essential late stage): after the robot reveal, swap to a signature
// pose GLB so the hero lands on a distinct pose. Non-essential → quick mode + the core reveal are untouched;
// editable in ✨ Transform. Uses the existing model-swap `modelRef`.
function finishPoseStages(characterId: string): TransformationDefinition['stages'] {
  const pose = heroPoseAssetIds(characterId)[0];
  if (!pose) return [];
  return [{ id: 'g_pose_model', type: 'model-swap', startTime: 19.5, duration: 0.5, enabled: true, essential: false, label: 'finish pose model', params: { modelRef: pose } }];
}
function build(k: Knobs): TransformationDefinition {
  return {
    id: k.id,
    characterId: k.characterId,
    name: k.name,
    formStrategy: 'modular-parts-procedural',
    modeAvailability: { full: true, interactive: true, quick: true },
    totalDurationSec: 22,
    quickDurationSec: 3,
    backdropColor: k.backdrop,
    particleColor: k.particle,
    parts: STD_PARTS.map((p) => ({ ...p })),
    stages: [...STD_STAGES.map((s) => ({ ...s, params: { ...s.params } })), ...finishPoseStages(k.characterId)],
    cameraShots: shots(k.flavour),
    effectTracks: effects(k.particle, k.ring),
    audioCues: [{ id: 'a_finish', startTime: 3.0, text: `${k.name.split(' ')[0]}: transform complete!` }],
    interactionShowcase: { enabled: true, rotateSpeedDeg: 90, poses: k.poses, promptText: 'A/D rotate · 1/2/3 pose · Enter continue · Esc skip' },
    controllerSwitchConfig: { planeControllerDisableTime: 0, robotControllerEnableTime: 15.5 },
    physicsSwitchConfig: { planeColliderDisableTime: 15.4, robotColliderEnableTime: 15.5 },
    momentumTransferConfig: { preserveHorizontalVelocity: true, horizontalVelocityMultiplier: 0.4, initialDescentVelocity: 10, clampMaxDescentSpeed: 30, faceCameraOnExit: true },
    editorMeta: { thumbnailColor: k.particle, tags: [k.flavour] },
  };
}

// Backdrop colours echo the character hue but stay darker/contrasting for readability.
export const SEED_TRANSFORMATIONS: TransformationDefinition[] = [
  build({ id: 'xf_jett', characterId: 'char_jett', name: 'Jett Transform', backdrop: '#2a0b07', particle: '#e8442c', ring: '#4ea3ff', flavour: 'speed', poses: ['Hero', 'Wave', 'Dash'] }),
  build({ id: 'xf_jerome', characterId: 'char_jerome', name: 'Jerome Transform', backdrop: '#0a1428', particle: '#2f6fd6', ring: '#7fd0ff', flavour: 'copter', poses: ['Salute', 'Wave', 'Hover'] }),
  build({ id: 'xf_todd', characterId: 'char_todd', name: 'Todd Transform', backdrop: '#1c1206', particle: '#b5793a', ring: '#ffd27f', flavour: 'engineer', poses: ['Flex', 'Tool', 'Bow'] }),
  build({ id: 'xf_donnie', characterId: 'char_donnie', name: 'Donnie Transform', backdrop: '#1c1505', particle: '#f5b21e', ring: '#fff0a0', flavour: 'default', poses: ['Hero', 'Wave', 'Spin'] }),
  build({ id: 'xf_paul', characterId: 'char_paul', name: 'Paul Transform', backdrop: '#0a1020', particle: '#2b4c8c', ring: '#9fc0ff', flavour: 'default', poses: ['Salute', 'Wave', 'Guard'] }),
  build({ id: 'xf_bello', characterId: 'char_bello', name: 'Bello Transform', backdrop: '#15100a', particle: '#8a6240', ring: '#d8b890', flavour: 'default', poses: ['Hero', 'Wave', 'Roar'] }),
  build({ id: 'xf_chase', characterId: 'char_chase', name: 'Chase Transform', backdrop: '#0b1020', particle: '#3b4a78', ring: '#aab6e8', flavour: 'default', poses: ['Salute', 'Wave', 'Dash'] }),
  build({ id: 'xf_flip', characterId: 'char_flip', name: 'Flip Transform', backdrop: '#2a0b07', particle: '#e23b2e', ring: '#7fd0ff', flavour: 'default', poses: ['Hero', 'Wave', 'Flip'] }),
];
