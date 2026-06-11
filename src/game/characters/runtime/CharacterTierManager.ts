import type { CharacterPresence, MultiCharacterLimitConfig } from '../../../types/game/support';

export function rebalanceTiers(
  presences: readonly CharacterPresence[],
  limits: MultiCharacterLimitConfig,
  controlledCharacterId: string | null,
): CharacterPresence[] {
  const ordered = [...presences].sort((a, b) => {
    if (a.characterId === controlledCharacterId) return -1;
    if (b.characterId === controlledCharacterId) return 1;
    if (a.aiState === 'assist-objective' && b.aiState !== 'assist-objective') return -1;
    if (b.aiState === 'assist-objective' && a.aiState !== 'assist-objective') return 1;
    return 0;
  });
  let active = 0;
  let standby = 0;
  return ordered.map((presence) => {
    if (presence.characterId === controlledCharacterId) {
      active += 1;
      return { ...presence, tier: 'active', controllerActive: true, colliderActive: true };
    }
    if (active < limits.maxActiveCharacters) {
      active += 1;
      return { ...presence, tier: 'active', controllerActive: false, colliderActive: true };
    }
    if (standby < limits.maxStandbyCharacters) {
      standby += 1;
      return { ...presence, tier: 'standby', controllerActive: false, colliderActive: true };
    }
    return { ...presence, tier: 'remote', controllerActive: false, colliderActive: false };
  });
}
