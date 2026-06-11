import type { CharacterPresence, MultiCharacterLimitConfig } from '../../../types/game/support';
import { applyTierLimits, upsertPresence } from './CharacterPresenceManager';

export function addCharacterPresence(
  presences: readonly CharacterPresence[],
  presence: CharacterPresence,
  limits: MultiCharacterLimitConfig,
  controlledCharacterId: string | null,
): CharacterPresence[] {
  return applyTierLimits(upsertPresence(presences, presence), limits, controlledCharacterId);
}
