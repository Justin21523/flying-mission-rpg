import { SEED_SUPPORT_ABILITIES, MVP_SUPPORT_CHARACTER_IDS } from './supportCombatAbilities';

// Combat-side support profile = which support-combat ability ids each support character owns. This does NOT
// duplicate the dispatch `SupportDispatchProfile` (in data/game/support.ts) — it hangs off it by characterId
// and is consumed by SupportCombatDirector.registerSupportCharacter. Default support energy per character.
export interface SupportCombatProfile {
  supportCharacterId: string;
  abilityIds: string[];
  maxSupportEnergy: number;
  supportEnergyRegenPerSecond: number;
}

export const SEED_SUPPORT_COMBAT_PROFILES: SupportCombatProfile[] = MVP_SUPPORT_CHARACTER_IDS.map((cid) => ({
  supportCharacterId: cid,
  abilityIds: SEED_SUPPORT_ABILITIES.filter((a) => a.supportCharacterId === cid).map((a) => a.id),
  maxSupportEnergy: 100,
  supportEnergyRegenPerSecond: 4,
}));

export function getSupportCombatProfile(characterId: string | undefined): SupportCombatProfile | undefined {
  if (!characterId) return undefined;
  return SEED_SUPPORT_COMBAT_PROFILES.find((p) => p.supportCharacterId === characterId);
}
