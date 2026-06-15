import type { SkillSlotName } from '../../types/game/characterKit';
import type { AbilitySlot } from '../../types/abilityArsenalTypes';

// Maps keys to kit named slots. Z/X/Y/H/B/N = the 6 keyed slots; Batch F.5 adds U for the ultimate. The kit
// director resolves the slot → loadout/kit skill id. (attack-6, defense-2/3, ultimate-2 are alternates with no
// dedicated key — swap them onto a keyed slot via the 🎛 Ability Loadout tab, or cast from the debug panel.)
export const KEY_TO_SLOT: Record<string, SkillSlotName> = {
  KeyZ: 'basic', KeyX: 'special1', KeyY: 'special2', KeyH: 'aoe', KeyB: 'defense', KeyN: 'utility', KeyU: 'ultimatePlaceholder',
};

export function routeKeyToSlot(code: string): SkillSlotName | undefined {
  return KEY_TO_SLOT[code];
}

// Batch F.5 — the 4 alternate arsenal abilities (not in the kit named slots) bound to extra keys, so all 11
// abilities per hero are directly castable: J = 6th attack, K/L = 2nd/3rd defense, I = 2nd ultimate.
export const EXTRA_KEY_TO_ABILITY_SLOT: Record<string, AbilitySlot> = {
  KeyJ: 'attack-6', KeyK: 'defense-2', KeyL: 'defense-3', KeyI: 'ultimate-2',
};

export function routeKeyToAbilitySlot(code: string): AbilitySlot | undefined {
  return EXTRA_KEY_TO_ABILITY_SLOT[code];
}
