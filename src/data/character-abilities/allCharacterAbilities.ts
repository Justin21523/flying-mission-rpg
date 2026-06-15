import type { CombatSkillDefinition } from '../../types/game/combat';
import type { CinematicAbilityDefinition } from '../../types/abilityArsenalTypes';
import type { CinematicEffectDefinition } from '../../types/cinematicVfxTypes';
import { JETT_ABILITIES } from './jettAbilities';
import { JEROME_ABILITIES } from './jeromeAbilities';
import { PAUL_ABILITIES } from './paulAbilities';
import { DONNIE_ABILITIES } from './donnieAbilities';
import { TODD_ABILITIES } from './toddAbilities';
import { FLIP_ABILITIES } from './flipAbilities';
import { BELLO_ABILITIES } from './belloAbilities';
import { CHASE_ABILITIES } from './chaseAbilities';

// Aggregated 8-hero cinematic ability arsenal (Batch F.5) — the single source of truth that feeds the skill
// registry, the cinematic effect registry, and the regenerated kits/loadouts.
const ALL = [
  ...JETT_ABILITIES, ...JEROME_ABILITIES, ...PAUL_ABILITIES, ...DONNIE_ABILITIES,
  ...TODD_ABILITIES, ...FLIP_ABILITIES, ...BELLO_ABILITIES, ...CHASE_ABILITIES,
];

export const ARSENAL_CHARACTER_IDS = [
  'char_jett', 'char_jerome', 'char_paul', 'char_donnie', 'char_todd', 'char_flip', 'char_bello', 'char_chase',
] as const;

export const SEED_ARSENAL_SKILLS: CombatSkillDefinition[] = ALL.map((b) => b.skill);
export const SEED_ARSENAL_ABILITIES: CinematicAbilityDefinition[] = ALL.map((b) => b.ability);
export const SEED_CINEMATIC_EFFECTS: CinematicEffectDefinition[] = ALL.map((b) => b.effect);

export function abilitiesForCharacter(characterId: string): CinematicAbilityDefinition[] {
  return SEED_ARSENAL_ABILITIES.filter((a) => a.characterId === characterId);
}
export function getArsenalAbility(id: string | undefined): CinematicAbilityDefinition | undefined {
  return id ? SEED_ARSENAL_ABILITIES.find((a) => a.id === id) : undefined;
}
