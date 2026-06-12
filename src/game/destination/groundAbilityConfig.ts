import type {
  CharacterDefinition,
  GroundAbilityDefinition,
  GroundAbilityConfig,
  GroundCloudRallyConfig,
  GroundExtraAbilitySlot,
  GroundRescueSurgeConfig,
} from '../../types/game/character';

export const DEFAULT_CLOUD_RALLY: GroundCloudRallyConfig = {
  name: 'Cloud Rally',
  keyCode: 'KeyQ',
  durationSec: 1.25,
  cooldownSec: 4,
  radius: 7.5,
  strength: 1,
  cloudColor: '#ffffff',
  rippleColor: '#dbeafe',
  energizedDurationSec: 4,
  energizedSpeedMultiplier: 1.35,
  randomAnimationIntervalSec: 0.45,
  energizedAnimationClips: [],
};

export const DEFAULT_RESCUE_SURGE: GroundRescueSurgeConfig = {
  name: 'Rescue Surge',
  keyCode: 'KeyR',
  durationSec: 1.6,
  cooldownSec: 4,
  speed: 30,
  afterimageCount: 18,
  afterimageIntervalSec: 0.045,
  afterimageLifeSec: 0.85,
  afterimageOpacity: 0.55,
  afterimageColor: '#38bdf8',
  lockDirection: true,
};

export const DEFAULT_EXTRA_ABILITY_SLOTS: GroundExtraAbilitySlot[] = [
  {
    id: 'extra_scan_pulse',
    name: 'Rescue Scan',
    kind: 'scan_pulse',
    keyCode: 'Digit1',
    color: '#22d3ee',
    durationSec: 0.9,
    cooldownSec: 3,
    radius: 9,
    strength: 1,
  },
  {
    id: 'extra_hover_pop',
    name: 'Hover Pop',
    kind: 'hover_pop',
    keyCode: 'Digit2',
    color: '#a7f3d0',
    durationSec: 0.75,
    cooldownSec: 3.5,
    radius: 5,
    strength: 1,
  },
  {
    id: 'extra_rescue_magnet',
    name: 'Rescue Magnet',
    kind: 'rescue_magnet',
    keyCode: 'Digit3',
    color: '#facc15',
    durationSec: 1.2,
    cooldownSec: 5,
    radius: 8,
    strength: 1,
  },
];

export const DEFAULT_GROUND_ABILITY_CONFIG: GroundAbilityConfig = {
  cloudRally: DEFAULT_CLOUD_RALLY,
  rescueSurge: DEFAULT_RESCUE_SURGE,
  extraSlots: DEFAULT_EXTRA_ABILITY_SLOTS,
};

function definitionToCloud(def: GroundAbilityDefinition, base: GroundCloudRallyConfig): GroundCloudRallyConfig {
  return {
    ...base,
    name: def.name,
    keyCode: def.keyCode,
    durationSec: def.durationSec,
    cooldownSec: def.cooldownSec,
    radius: def.radius,
    strength: def.strength,
    cloudColor: def.color,
    rippleColor: def.color,
    energizedDurationSec: def.durationSec,
    energizedSpeedMultiplier: Math.max(1, def.strength),
    energizedAnimationClips: def.animationPool ?? base.energizedAnimationClips,
  };
}

function definitionToSurge(def: GroundAbilityDefinition, base: GroundRescueSurgeConfig): GroundRescueSurgeConfig {
  return {
    ...base,
    name: def.name,
    keyCode: def.keyCode,
    durationSec: def.durationSec,
    cooldownSec: def.cooldownSec,
    speed: def.speed ?? base.speed,
    afterimageCount: def.afterimageCount ?? base.afterimageCount,
    afterimageIntervalSec: def.afterimageIntervalSec ?? base.afterimageIntervalSec,
    afterimageLifeSec: def.afterimageLifeSec ?? base.afterimageLifeSec,
    afterimageOpacity: def.afterimageOpacity ?? base.afterimageOpacity,
    afterimageColor: def.color,
    lockDirection: def.lockDirection ?? base.lockDirection,
  };
}

function definitionToExtra(def: GroundAbilityDefinition): GroundExtraAbilitySlot {
  return {
    id: def.id,
    name: def.name,
    kind: def.kind === 'air-dash' ? 'hover_pop' : def.kind === 'scan-wave' ? 'scan_pulse' : 'rescue_magnet',
    keyCode: def.keyCode,
    color: def.color,
    durationSec: def.durationSec,
    cooldownSec: def.cooldownSec,
    radius: def.radius,
    strength: def.strength,
  };
}

export function getGroundAbilityConfig(character: CharacterDefinition | undefined): GroundAbilityConfig {
  const authored = character?.groundAbility;
  const color = character?.color ?? DEFAULT_RESCUE_SURGE.afterimageColor;
  const library = character?.groundAbilityLibrary ?? [];
  const cloudDef = library.find((def) => def.kind === 'cloud-rally-shockwave');
  const surgeDef = library.find((def) => def.kind === 'forward-dash-afterimage');
  const base: GroundAbilityConfig = {
    cloudRally: {
      ...DEFAULT_CLOUD_RALLY,
      ...(authored?.cloudRally ?? {}),
    },
    rescueSurge: {
      ...DEFAULT_RESCUE_SURGE,
      afterimageColor: color,
      ...(authored?.rescueSurge ?? {}),
    },
    extraSlots: authored?.extraSlots && authored.extraSlots.length > 0 ? authored.extraSlots : DEFAULT_EXTRA_ABILITY_SLOTS,
  };
  return {
    cloudRally: cloudDef ? definitionToCloud(cloudDef, base.cloudRally) : base.cloudRally,
    rescueSurge: surgeDef ? definitionToSurge(surgeDef, base.rescueSurge) : base.rescueSurge,
    extraSlots: library.length > 0
      ? library.filter((def) => def.kind !== 'cloud-rally-shockwave' && def.kind !== 'forward-dash-afterimage').map(definitionToExtra)
      : base.extraSlots,
  };
}

export function cloneGroundAbilityConfig(config: GroundAbilityConfig): GroundAbilityConfig {
  return {
    cloudRally: { ...config.cloudRally, energizedAnimationClips: [...config.cloudRally.energizedAnimationClips] },
    rescueSurge: { ...config.rescueSurge },
    extraSlots: config.extraSlots.map((slot) => ({ ...slot })),
  };
}
