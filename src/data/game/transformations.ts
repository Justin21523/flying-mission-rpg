import type { TransformationDefinition, TransformationStage, TransformationCameraShot, TransformationEffectTrack, TransformationPart } from '../../types/game/transformation';

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

const STD_STAGES: TransformationStage[] = [
  { id: 'g_enter', type: 'enter-stage', startTime: 0, duration: 0.4, enabled: true, label: 'enter', params: {} },
  { id: 'g_backdrop', type: 'backdrop-shift', startTime: 0.4, duration: 0.2, enabled: true, label: 'backdrop', params: { backdropIntensity: 1 } },
  { id: 'g_speed', type: 'speed-line-burst', startTime: 0.6, duration: 2.0, enabled: true, label: 'speed lines', params: { intensity: 1 } },
  { id: 'g_wl', type: 'part-transform', startTime: 0.8, duration: 0.4, enabled: true, easing: 'easeInOut', label: 'wing L fold', params: { partKey: 'wing_left', toPosition: [-2, 0.3, 0.2], toRotation: [0, 0, 70] } },
  { id: 'g_wr', type: 'part-transform', startTime: 0.8, duration: 0.4, enabled: true, easing: 'easeInOut', label: 'wing R fold', params: { partKey: 'wing_right', toPosition: [2, 0.3, 0.2], toRotation: [0, 0, -70] } },
  { id: 'g_al', type: 'part-transform', startTime: 1.2, duration: 0.4, enabled: true, easing: 'easeOut', label: 'arm L', params: { partKey: 'arm_left', toPosition: [-1.4, -0.2, 0.2], toRotation: [0, 0, 20] } },
  { id: 'g_ar', type: 'part-transform', startTime: 1.2, duration: 0.4, enabled: true, easing: 'easeOut', label: 'arm R', params: { partKey: 'arm_right', toPosition: [1.4, -0.2, 0.2], toRotation: [0, 0, -20] } },
  { id: 'g_ll', type: 'part-transform', startTime: 1.6, duration: 0.4, enabled: true, easing: 'easeOut', label: 'leg L', params: { partKey: 'leg_left', toPosition: [-0.5, -1.4, 0] } },
  { id: 'g_lr', type: 'part-transform', startTime: 1.6, duration: 0.4, enabled: true, easing: 'easeOut', label: 'leg R', params: { partKey: 'leg_right', toPosition: [0.5, -1.4, 0] } },
  { id: 'g_head', type: 'part-transform', startTime: 2.0, duration: 0.3, enabled: true, easing: 'easeOut', label: 'head reveal', params: { partKey: 'head', toPosition: [0, 0.9, 0] } },
  { id: 'g_thr', type: 'part-transform', startTime: 2.3, duration: 0.3, enabled: true, easing: 'easeOut', label: 'thrusters', params: { partKey: 'thruster_back', toPosition: [0, 0.6, -0.7], toRotation: [20, 0, 0] } },
  { id: 'g_robot', type: 'model-visibility', startTime: 2.7, duration: 0.1, enabled: true, essential: true, label: 'robot reveal', params: { modelSlot: 'robot', visible: true } },
  { id: 'g_finish', type: 'finish-pose', startTime: 3.0, duration: 0.5, enabled: true, essential: true, label: 'finish pose', params: {} },
  { id: 'g_show', type: 'interactive-showcase', startTime: 3.5, duration: 0.4, enabled: true, label: 'showcase', params: {} },
  { id: 'g_exit', type: 'exit-stage', startTime: 3.8, duration: 0.2, enabled: true, essential: true, label: 'exit → descent', params: { targetPhase: 'DESCENT' } },
];

function shots(flavour: Flavour): TransformationCameraShot[] {
  const fast = flavour === 'speed';
  const heavy = flavour === 'engineer';
  return [
    { id: 'c_orbit', type: 'orbit', startTime: 0, duration: 1.5, distance: 7, height: 2, angle: 0, fov: fast ? 60 : 55, easing: 'easeInOut', shakeIntensity: fast ? 0.08 : 0 },
    { id: 'c_wing', type: 'close-up', startTime: 0.8, duration: 0.8, targetPart: 'wing_left', distance: 3, height: 1, angle: 40, fov: 40, easing: 'easeOut' },
    { id: 'c_low', type: 'low-angle', startTime: 1.6, duration: 1.0, distance: heavy ? 6 : 5, height: -1.2, angle: 200, fov: 50 },
    { id: 'c_hero', type: 'finish-hero-shot', startTime: 2.7, duration: 1.3, distance: 6, height: 1.5, angle: 20, fov: 45, shakeIntensity: 0.1, easing: 'easeOut' },
  ];
}

function effects(particle: string, ring: string, speedColor = '#ffffff'): TransformationEffectTrack[] {
  return [
    { id: 'fx_speed', type: 'speed-line-burst', startTime: 0.6, duration: 2.0, color: speedColor, intensity: 1 },
    { id: 'fx_flash', type: 'white-flash', startTime: 2.6, duration: 0.4, color: '#ffffff', intensity: 1 },
    { id: 'fx_ring', type: 'energy-ring', startTime: 2.6, duration: 0.9, color: ring, scale: 2 },
    { id: 'fx_glow', type: 'glow-pulse', startTime: 2.7, duration: 1.0, color: particle, intensity: 1 },
    { id: 'fx_spark', type: 'sparkle', startTime: 3.0, duration: 0.6, color: particle, followTargetPart: 'head' },
  ];
}

interface Knobs { id: string; characterId: string; name: string; backdrop: string; particle: string; ring: string; flavour: Flavour; poses: string[]; }
function build(k: Knobs): TransformationDefinition {
  return {
    id: k.id,
    characterId: k.characterId,
    name: k.name,
    formStrategy: 'modular-parts-procedural',
    modeAvailability: { full: true, interactive: true, quick: true },
    totalDurationSec: 4,
    quickDurationSec: 1.6,
    backdropColor: k.backdrop,
    particleColor: k.particle,
    parts: STD_PARTS.map((p) => ({ ...p })),
    stages: STD_STAGES.map((s) => ({ ...s, params: { ...s.params } })),
    cameraShots: shots(k.flavour),
    effectTracks: effects(k.particle, k.ring),
    audioCues: [{ id: 'a_finish', startTime: 3.0, text: `${k.name.split(' ')[0]}: transform complete!` }],
    interactionShowcase: { enabled: true, rotateSpeedDeg: 90, poses: k.poses, promptText: 'A/D rotate · 1/2/3 pose · Enter continue · Esc skip' },
    controllerSwitchConfig: { planeControllerDisableTime: 0, robotControllerEnableTime: 2.7 },
    physicsSwitchConfig: { planeColliderDisableTime: 2.6, robotColliderEnableTime: 2.7 },
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
