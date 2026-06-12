import type { CharacterDefinition, GroundAbilityDefinition, GroundAbilityLibraryKind } from '../../types/game/character';
import { GROUND_ABILITY_LIBRARY_KINDS } from '../../types/game/character';
import { getGroundAbilityConfig } from './groundAbilityConfig';

const EXTRA_KIND_MAP: Record<string, GroundAbilityLibraryKind> = {
  scan_pulse: 'scan-wave',
  hover_pop: 'air-dash',
  rescue_magnet: 'rescue-field',
};

export function getGroundAbilityLibrary(character: CharacterDefinition | undefined): GroundAbilityDefinition[] {
  if (character?.groundAbilityLibrary && character.groundAbilityLibrary.length > 0) {
    return character.groundAbilityLibrary.map((ability) => ({ ...ability, animationPool: ability.animationPool ? [...ability.animationPool] : undefined }));
  }
  const config = getGroundAbilityConfig(character);
  return [
    {
      id: 'ability_cloud_rally',
      name: config.cloudRally.name,
      kind: 'cloud-rally-shockwave',
      keyCode: config.cloudRally.keyCode,
      durationSec: config.cloudRally.durationSec,
      cooldownSec: config.cloudRally.cooldownSec,
      color: config.cloudRally.cloudColor,
      radius: config.cloudRally.radius,
      strength: config.cloudRally.energizedSpeedMultiplier,
      animationPool: [...config.cloudRally.energizedAnimationClips],
      aiUsable: true,
    },
    {
      id: 'ability_rescue_surge',
      name: config.rescueSurge.name,
      kind: 'forward-dash-afterimage',
      keyCode: config.rescueSurge.keyCode,
      durationSec: config.rescueSurge.durationSec,
      cooldownSec: config.rescueSurge.cooldownSec,
      color: config.rescueSurge.afterimageColor,
      radius: 0,
      strength: 1,
      speed: config.rescueSurge.speed,
      afterimageCount: config.rescueSurge.afterimageCount,
      afterimageIntervalSec: config.rescueSurge.afterimageIntervalSec,
      afterimageLifeSec: config.rescueSurge.afterimageLifeSec,
      afterimageOpacity: config.rescueSurge.afterimageOpacity,
      lockDirection: config.rescueSurge.lockDirection,
      aiUsable: false,
    },
    ...config.extraSlots.map((slot) => ({
      id: slot.id,
      name: slot.name,
      kind: EXTRA_KIND_MAP[slot.kind] ?? 'rescue-field',
      keyCode: slot.keyCode,
      durationSec: slot.durationSec,
      cooldownSec: slot.cooldownSec,
      color: slot.color,
      radius: slot.radius,
      strength: slot.strength,
      aiUsable: slot.kind !== 'hover_pop',
    })),
  ];
}

export function findGroundAbilityByKey(character: CharacterDefinition | undefined, keyCode: string): GroundAbilityDefinition | undefined {
  return getGroundAbilityLibrary(character).find((ability) => ability.keyCode === keyCode);
}

export function validateGroundAbilityLibrary(library: readonly GroundAbilityDefinition[]): string[] {
  const errors: string[] = [];
  const keys = new Set<string>();
  for (const ability of library) {
    if (!GROUND_ABILITY_LIBRARY_KINDS.includes(ability.kind)) errors.push(`${ability.id}: invalid kind`);
    if (!ability.keyCode) errors.push(`${ability.id}: keyCode is required`);
    if (keys.has(ability.keyCode)) errors.push(`${ability.id}: duplicate keyCode ${ability.keyCode}`);
    keys.add(ability.keyCode);
    if (ability.durationSec <= 0) errors.push(`${ability.id}: duration must be greater than 0`);
    if (ability.cooldownSec < 0) errors.push(`${ability.id}: cooldown cannot be negative`);
    if (ability.radius < 0) errors.push(`${ability.id}: radius cannot be negative`);
    if (ability.strength < 0) errors.push(`${ability.id}: strength cannot be negative`);
    if (ability.speed !== undefined && ability.speed < 0) errors.push(`${ability.id}: speed cannot be negative`);
  }
  return errors;
}
