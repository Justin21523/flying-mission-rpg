import type { CinematicAbilityDefinition, AbilityLoadoutDefinition, AbilityValidationResult } from '../../types/abilityArsenalTypes';
import { ABILITY_CATEGORIES, ABILITY_SLOTS } from '../../types/abilityArsenalTypes';

// Pure validators for cinematic abilities + loadouts (Batch F.5, spec §16). Existence checks injected.
export function validateAbility(
  a: CinematicAbilityDefinition,
  effectExists: (id: string) => boolean = () => true,
  skillExists: (id: string) => boolean = () => true,
): AbilityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!a.id?.trim()) errors.push('ability id must not be empty.');
  if (!a.characterId?.trim()) errors.push('ability characterId must not be empty.');
  if (!ABILITY_CATEGORIES.includes(a.abilityCategory)) errors.push(`unknown abilityCategory "${a.abilityCategory}".`);
  if (!ABILITY_SLOTS.includes(a.abilitySlot)) errors.push(`unknown abilitySlot "${a.abilitySlot}".`);
  if (a.combat.energyCost < 0) errors.push('energyCost must be >= 0.');
  if (a.combat.cooldownSeconds < 0) errors.push('cooldownSeconds must be >= 0.');
  if (!a.combat.skillDefinitionId || !skillExists(a.combat.skillDefinitionId)) errors.push(`skillDefinitionId "${a.combat.skillDefinitionId}" does not resolve.`);
  if (!a.vfx.cinematicEffectId || !effectExists(a.vfx.cinematicEffectId)) errors.push(`cinematicEffectId "${a.vfx.cinematicEffectId}" does not resolve.`);
  if (a.abilityCategory === 'attack' && !a.combat.hitVolume) errors.push('attack ability must have a hitVolume.');
  if (a.abilityCategory === 'attack' && !a.combat.targetRules) errors.push('attack ability must have targetRules.');
  if (a.abilityCategory === 'ultimate' && a.combat.cooldownSeconds < 10) warnings.push('ultimate should have a high cooldown (>= 10s).');
  // category ↔ slot consistency
  if (a.abilityCategory === 'ultimate' && !a.abilitySlot.startsWith('ultimate')) errors.push('ultimate ability must use an ultimate-* slot.');
  if (a.abilityCategory === 'defense' && !a.abilitySlot.startsWith('defense')) errors.push('defense ability must use a defense-* slot.');
  if (a.abilityCategory === 'attack' && !a.abilitySlot.startsWith('attack')) errors.push('attack ability must use an attack-* slot.');
  if (a.abilityCategory === 'signature' && !a.abilitySlot.startsWith('signature')) errors.push('signature ability must use a signature-* slot.');
  if (a.abilityCategory === 'clone' && !a.abilitySlot.startsWith('clone')) errors.push('clone ability must use a clone-* slot.');
  return { ok: errors.length === 0, errors, warnings };
}

export function validateLoadout(
  lo: AbilityLoadoutDefinition,
  abilityCategory: (id: string) => 'attack' | 'defense' | 'signature' | 'ultimate' | 'clone' | undefined,
): AbilityValidationResult {
  const errors: string[] = [];
  const slots: { key: keyof AbilityLoadoutDefinition; expect: 'attack' | 'defense' | 'ultimate' }[] = [
    { key: 'basic', expect: 'attack' }, { key: 'special1', expect: 'attack' }, { key: 'special2', expect: 'attack' },
    { key: 'aoe', expect: 'attack' }, { key: 'utility', expect: 'attack' }, { key: 'defense', expect: 'defense' }, { key: 'ultimate', expect: 'ultimate' },
  ];
  for (const s of slots) {
    const id = lo[s.key] as string;
    if (!id) { errors.push(`loadout slot "${s.key}" is empty.`); continue; }
    const cat = abilityCategory(id);
    if (!cat) errors.push(`loadout "${s.key}" → unknown ability "${id}".`);
    else if (cat !== s.expect) errors.push(`loadout "${s.key}" must be a ${s.expect} ability (got ${cat}).`);
  }
  return { ok: errors.length === 0, errors, warnings: [] };
}
