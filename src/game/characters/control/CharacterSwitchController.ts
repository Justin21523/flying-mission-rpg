import { switchControlToCharacter } from './ControlOwnershipService';
import type { CharacterPresence } from '../../../types/game/support';

export function nextSwitchTarget(presences: readonly CharacterPresence[], controlledCharacterId: string | null): string | null {
  const active = presences.filter((p) => p.tier !== 'remote').map((p) => p.characterId);
  if (active.length === 0) return null;
  const idx = controlledCharacterId ? active.indexOf(controlledCharacterId) : -1;
  return active[(idx + 1 + active.length) % active.length] ?? null;
}

export function switchToNextCharacter(presences: readonly CharacterPresence[], controlledCharacterId: string | null): boolean {
  const target = nextSwitchTarget(presences, controlledCharacterId);
  return target ? switchControlToCharacter(target) : false;
}
