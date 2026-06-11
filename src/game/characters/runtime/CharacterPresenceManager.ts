import type { CharacterPresence, MultiCharacterLimitConfig } from '../../../types/game/support';
import { rebalanceTiers } from './CharacterTierManager';

export function upsertPresence(list: readonly CharacterPresence[], presence: CharacterPresence): CharacterPresence[] {
  return list.some((p) => p.characterId === presence.characterId)
    ? list.map((p) => (p.characterId === presence.characterId ? presence : p))
    : [...list, presence];
}

export function applyTierLimits(
  list: readonly CharacterPresence[],
  limits: MultiCharacterLimitConfig,
  controlledCharacterId: string | null,
): CharacterPresence[] {
  return rebalanceTiers(list, limits, controlledCharacterId);
}
