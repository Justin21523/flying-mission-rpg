import type { CharacterPresence } from '../../../types/game/support';

export class CharacterRuntimeRegistry {
  private readonly presences = new Map<string, CharacterPresence>();

  upsert(presence: CharacterPresence): void {
    this.presences.set(presence.characterId, presence);
  }

  get(characterId: string): CharacterPresence | undefined {
    return this.presences.get(characterId);
  }

  remove(characterId: string): void {
    this.presences.delete(characterId);
  }

  list(): CharacterPresence[] {
    return [...this.presences.values()];
  }

  clear(): void {
    this.presences.clear();
  }
}
