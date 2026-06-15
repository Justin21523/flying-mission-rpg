import type {
  SupportCombatAbilityDefinition,
  SupportTargetingDefinition,
  SupportCombatEffectDefinition,
  PartnerSynergyPlaceholderDefinition,
  SupportCombatValidationResult,
} from '../../types/game/supportCombat';
import {
  SUPPORT_COMBAT_TYPES,
  SUPPORT_TRIGGER_MODES,
  SUPPORT_TARGET_TYPES,
  SUPPORT_RANGE_SHAPES,
  SUPPORT_EFFECT_TYPES,
  SUPPORT_SYNERGY_TRIGGERS,
} from '../../types/game/supportCombat';

// Pure validators for support-combat abilities / targeting / effects / synergies (Batch E, spec §18).
// `effectVisualExists` / `skillOrEffectExists` let the validators confirm referenced ids resolve.

const REQUIRED_STATUSES = new Set(['active-at-scene', 'standby-at-scene', 'remote-support', 'any']);
const EFFECTS_ALLOWING_ZERO_AMOUNT = new Set(['scan', 'taunt', 'debug-log', 'condition-progress', 'spawn-cover', 'slow']);

export function validateTargeting(t: SupportTargetingDefinition, triggerMode?: string): SupportCombatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!SUPPORT_TARGET_TYPES.includes(t.targetType)) errors.push(`unknown targetType "${t.targetType}".`);
  if (!SUPPORT_RANGE_SHAPES.includes(t.rangeShape)) errors.push(`unknown rangeShape "${t.rangeShape}".`);
  for (const [k, v] of Object.entries({ maxRange: t.maxRange, radius: t.radius, width: t.width, length: t.length })) {
    if (v !== undefined && v < 0) errors.push(`targeting.${k} must not be negative.`);
  }
  if (triggerMode === 'manual-target' && t.targetType === 'none') errors.push('manual-target ability cannot have targetType "none".');
  return { ok: errors.length === 0, errors, warnings };
}

export function validateEffect(e: SupportCombatEffectDefinition, effectVisualExists: (id: string) => boolean): SupportCombatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!e.id?.trim()) errors.push('effect id must not be empty.');
  if (!SUPPORT_EFFECT_TYPES.includes(e.effectType)) errors.push(`unknown effectType "${e.effectType}".`);
  if (e.amount !== undefined && e.amount < 0 && !EFFECTS_ALLOWING_ZERO_AMOUNT.has(e.effectType)) errors.push(`effect ${e.id} amount must not be negative.`);
  if ((e.effectType === 'damage' || e.effectType === 'shield-break')) {
    if (!e.damageType) errors.push(`damage effect ${e.id} must have a damageType.`);
    if (!e.attackTags || e.attackTags.length === 0) errors.push(`damage effect ${e.id} must have attackTags.`);
  }
  if (e.modelFirstEffect && !effectVisualExists(e.modelFirstEffect.effectDefinitionId)) {
    warnings.push(`effect ${e.id} references unknown visual "${e.modelFirstEffect.effectDefinitionId}".`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function validateAbility(
  a: SupportCombatAbilityDefinition,
  effectVisualExists: (id: string) => boolean = () => true,
): SupportCombatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!a.id?.trim()) errors.push('ability id must not be empty.');
  if (!a.supportCharacterId?.trim()) errors.push('ability supportCharacterId must not be empty.');
  if (!SUPPORT_COMBAT_TYPES.includes(a.supportType)) errors.push(`unknown supportType "${a.supportType}".`);
  if (!SUPPORT_TRIGGER_MODES.includes(a.triggerMode)) errors.push(`unknown triggerMode "${a.triggerMode}".`);
  if (a.cooldownSeconds < 0) errors.push('cooldownSeconds must be >= 0.');
  if ((a.castDelaySeconds ?? 0) < 0) errors.push('castDelaySeconds must be >= 0.');
  if ((a.durationSeconds ?? 0) < 0) errors.push('durationSeconds must be >= 0.');
  for (const [k, v] of Object.entries(a.resourceCost ?? {})) if ((v ?? 0) < 0) errors.push(`resourceCost.${k} must be >= 0.`);
  if (a.requiresSupportStatus && !REQUIRED_STATUSES.has(a.requiresSupportStatus)) errors.push(`unknown requiresSupportStatus "${a.requiresSupportStatus}".`);

  const tr = validateTargeting(a.targeting, a.triggerMode);
  errors.push(...tr.errors); warnings.push(...tr.warnings);

  if (!a.effects || a.effects.length === 0) errors.push('ability must have at least one effect.');
  for (const e of a.effects ?? []) {
    const er = validateEffect(e, effectVisualExists);
    errors.push(...er.errors.map((m) => `effect ${e.id}: ${m}`));
    warnings.push(...er.warnings);
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function validateSynergy(
  s: PartnerSynergyPlaceholderDefinition,
  characterExists: (id: string) => boolean = () => true,
  resultExists: (id: string) => boolean = () => true,
): SupportCombatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!s.primaryCharacterId?.trim() || !characterExists(s.primaryCharacterId)) errors.push('synergy primaryCharacterId missing or unknown.');
  if (!s.supportCharacterId?.trim() || !characterExists(s.supportCharacterId)) errors.push('synergy supportCharacterId missing or unknown.');
  if (!SUPPORT_SYNERGY_TRIGGERS.includes(s.triggerCondition)) errors.push(`unknown triggerCondition "${s.triggerCondition}".`);
  if (!s.resultEffectIds || s.resultEffectIds.length === 0) errors.push('synergy must have at least one resultEffectId.');
  for (const id of s.resultEffectIds ?? []) if (!resultExists(id)) warnings.push(`synergy result "${id}" does not resolve.`);
  if (s.cooldownSeconds < 0) errors.push('synergy cooldownSeconds must be >= 0.');
  return { ok: errors.length === 0, errors, warnings };
}
