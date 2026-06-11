import type {
  CharacterDefinition,
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

export function getGroundAbilityConfig(character: CharacterDefinition | undefined): GroundAbilityConfig {
  const authored = character?.groundAbility;
  const color = character?.color ?? DEFAULT_RESCUE_SURGE.afterimageColor;
  return {
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
}

export function cloneGroundAbilityConfig(config: GroundAbilityConfig): GroundAbilityConfig {
  return {
    cloudRally: { ...config.cloudRally, energizedAnimationClips: [...config.cloudRally.energizedAnimationClips] },
    rescueSurge: { ...config.rescueSurge },
    extraSlots: config.extraSlots.map((slot) => ({ ...slot })),
  };
}
