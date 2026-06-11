import type { MultiCharacterLimitConfig, SupportAiProfile, SupportDispatchProfile } from '../../types/game/support';
import { SUPPORT_ABILITY_TAGS, SUPPORT_DISPATCH_MODES } from '../../types/game/support';

export interface SupportValidationContext {
  characterIds: ReadonlySet<string>;
  aiProfileIds: ReadonlySet<string>;
  objectiveTypes: ReadonlySet<string>;
}

export function validateSupportProfile(profile: SupportDispatchProfile, ctx: SupportValidationContext): string[] {
  const errors: string[] = [];
  if (!ctx.characterIds.has(profile.characterId)) errors.push(`Character does not exist: ${profile.characterId}`);
  if (!SUPPORT_DISPATCH_MODES.includes(profile.defaultDispatchMode)) errors.push(`Invalid dispatch mode: ${profile.defaultDispatchMode}`);
  if (!ctx.aiProfileIds.has(profile.aiProfileId)) errors.push(`AI profile does not exist: ${profile.aiProfileId}`);
  for (const ability of profile.abilities) if (!SUPPORT_ABILITY_TAGS.includes(ability)) errors.push(`Invalid ability: ${ability}`);
  for (const type of profile.recommendedObjectiveTypes) if (!ctx.objectiveTypes.has(type)) errors.push(`Unknown recommended objective type: ${type}`);
  for (const type of profile.unsuitableObjectiveTypes ?? []) if (!ctx.objectiveTypes.has(type)) errors.push(`Unknown unsuitable objective type: ${type}`);
  for (const type of profile.recommendedObjectiveTypes) {
    if ((profile.unsuitableObjectiveTypes ?? []).includes(type)) errors.push(`Objective type cannot be both recommended and unsuitable: ${type}`);
  }
  if (profile.quickModeTotalSeconds <= 0) errors.push('Quick mode total seconds must be greater than 0');
  if (profile.baseDispatchDelaySeconds < 0) errors.push('Base dispatch delay cannot be negative');
  if (profile.launchDurationSeconds < 0) errors.push('Launch duration cannot be negative');
  if (profile.flightDurationSeconds < 0) errors.push('Flight duration cannot be negative');
  if (profile.transformDurationSeconds < 0) errors.push('Transform duration cannot be negative');
  if (profile.arrivalDurationSeconds < 0) errors.push('Arrival duration cannot be negative');
  if (profile.activeTierCost < 0) errors.push('Active tier cost cannot be negative');
  if (profile.standbyTierCost < 0) errors.push('Standby tier cost cannot be negative');
  if (profile.maxSimultaneousInstances != null && profile.maxSimultaneousInstances < 1) errors.push('Max simultaneous instances must be at least 1');
  return errors;
}

export function validateSupportAiProfile(profile: SupportAiProfile): string[] {
  const errors: string[] = [];
  if (profile.followDistance <= 0) errors.push('Follow distance must be greater than 0');
  if (profile.avoidanceRadius < 0) errors.push('Avoidance radius cannot be negative');
  if (profile.moveSpeed <= 0) errors.push('Move speed must be greater than 0');
  if (profile.standbyDistance < 0) errors.push('Standby distance cannot be negative');
  if (profile.stuckTimeoutSeconds <= 0) errors.push('Stuck timeout must be greater than 0');
  return errors;
}

export function validateLimitConfig(config: MultiCharacterLimitConfig): string[] {
  const errors: string[] = [];
  if (config.maxActiveCharacters < 1) errors.push('Max active characters must be at least 1');
  if (config.maxStandbyCharacters < 0) errors.push('Max standby characters cannot be negative');
  if (config.aiTickRateActive <= 0) errors.push('Active AI tick rate must be greater than 0');
  if (config.aiTickRateStandby <= 0) errors.push('Standby AI tick rate must be greater than 0');
  if (config.remoteUpdateIntervalSeconds <= 0) errors.push('Remote update interval must be greater than 0');
  return errors;
}
