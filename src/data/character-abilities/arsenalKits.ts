import type { CharacterCombatKitDefinition, CharacterCombatRoleType } from '../../types/game/characterKit';
import type { AbilityLoadoutDefinition } from '../../types/abilityArsenalTypes';
import { abilitiesForCharacter, ARSENAL_CHARACTER_IDS } from './allCharacterAbilities';

// Arsenal-derived kits + loadouts (Batch F.5). Each character's default loadout maps the keyed slots
// (Z/X/Y/H/B/N + ultimate) to chosen arsenal abilities; the kit's defaultSkillIds are derived from it so the
// existing CharacterSkillKitDirector keyed casting drives the new cinematic abilities. The 4 Batch-D MVP kits
// stay as-is (synergy/test backward-compat); this adds kits for the 4 new heroes + loadouts for all 8.

const ROLES: Record<string, CharacterCombatRoleType[]> = {
  char_jett: ['speed', 'rescue'],
  char_jerome: ['control'],
  char_paul: ['defense', 'control'],
  char_donnie: ['engineering', 'repair'],
  char_todd: ['engineering', 'shield-break'],
  char_flip: ['speed', 'control'],
  char_bello: ['scanner', 'control'],
  char_chase: ['scanner', 'precision', 'stealth'],
};
const COLORS: Record<string, string> = {
  char_jett: '#e8442c', char_jerome: '#2f6fd6', char_paul: '#2b4c8c', char_donnie: '#f5b21e',
  char_todd: '#b5793a', char_flip: '#e23b2e', char_bello: '#8a6240', char_chase: '#3b4a78',
};
const NAMES: Record<string, string> = {
  char_jett: 'Jett', char_jerome: 'Jerome', char_paul: 'Paul', char_donnie: 'Donnie',
  char_todd: 'Todd', char_flip: 'Flip', char_bello: 'Bello', char_chase: 'Chase',
};

// Pick the arsenal ability filling a given abilitySlot for a character.
function pick(characterId: string, slot: string): string {
  const a = abilitiesForCharacter(characterId).find((x) => x.abilitySlot === slot);
  return a?.id ?? '';
}

export function buildLoadout(characterId: string): AbilityLoadoutDefinition {
  return {
    id: characterId,
    characterId,
    basic: pick(characterId, 'attack-1'),
    special1: pick(characterId, 'attack-2'),
    special2: pick(characterId, 'attack-3'),
    aoe: pick(characterId, 'attack-4'),
    defense: pick(characterId, 'defense-1'),
    utility: pick(characterId, 'attack-5'),
    ultimate: pick(characterId, 'ultimate-1'),
  };
}

function buildKit(characterId: string): CharacterCombatKitDefinition {
  const lo = buildLoadout(characterId);
  return {
    id: characterId,
    characterId,
    displayName: NAMES[characterId] ?? characterId,
    roleTypes: ROLES[characterId] ?? ['utility'],
    defaultSkillIds: {
      basic: lo.basic, special1: lo.special1, special2: lo.special2,
      aoe: lo.aoe, defense: lo.defense, utility: lo.utility, ultimatePlaceholder: lo.ultimate,
    },
    comboSkillIds: [],
    combos: [],
    stageUtilityRules: [],
    modelSocketConfig: { characterId, sockets: [{ socketName: 'root', fallbackOffset: [0, 0, 0] }, { socketName: 'chest-core', fallbackOffset: [0, 1.2, 0.3] }] },
    recommendedAgainst: {},
    editorMeta: { themeColor: COLORS[characterId], difficulty: 'normal' },
  };
}

// Kits for the 4 NEW heroes (the 4 Batch-D MVP kits remain in characterCombatKits.ts).
export const NEW_CHARACTER_KITS: CharacterCombatKitDefinition[] = ['char_jerome', 'char_todd', 'char_flip', 'char_bello'].map(buildKit);

// Loadouts for all 8 heroes, arsenal-derived.
export const SEED_ABILITY_LOADOUTS: AbilityLoadoutDefinition[] = ARSENAL_CHARACTER_IDS.map(buildLoadout);
