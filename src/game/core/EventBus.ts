import type { GamePhase } from '../../types/game/state';
import type { SupportDispatchMode, SupportDispatchStatus } from '../../types/game/support';

// Typed game-wide pub/sub. Decouples systems (Director ↔ stores ↔ UI) without prop-drilling. Every
// `on` returns a disposer so subscribers clean up. Payloads are typed per event name.
export interface GameEventMap {
  'phase:changed': { from: GamePhase | null; to: GamePhase };
  'phase:blocked': { from: GamePhase; to: GamePhase; reason: string };
  'mission:selected': { missionId: string };
  'character:selected': { characterId: string };
  'support:requested': { characterId: string; mode: SupportDispatchMode };
  'support:stage-changed': { characterId: string; status: SupportDispatchStatus };
  'support:eta-updated': { characterId: string; etaSeconds: number };
  'support:arrived': { characterId: string };
  'support:cancelled': { characterId: string; reason?: string };
  'support:tier-changed': { characterId: string; tier: 'active' | 'standby' | 'remote' };
  'control:switched': { fromCharacterId: string; toCharacterId: string };
}

export type GameEventName = keyof GameEventMap;

// `never` (not `any`) keeps the internal map type-safe: a concrete handler is assignable to it via
// parameter contravariance, and `emit` casts back to the precise payload type.
type AnyHandler = (payload: never) => void;

class EventBus {
  private handlers = new Map<GameEventName, Set<AnyHandler>>();

  on<K extends GameEventName>(name: K, handler: (payload: GameEventMap[K]) => void): () => void {
    let set = this.handlers.get(name);
    if (!set) {
      set = new Set();
      this.handlers.set(name, set);
    }
    set.add(handler as AnyHandler);
    return () => this.off(name, handler);
  }

  off<K extends GameEventName>(name: K, handler: (payload: GameEventMap[K]) => void): void {
    this.handlers.get(name)?.delete(handler as AnyHandler);
  }

  emit<K extends GameEventName>(name: K, payload: GameEventMap[K]): void {
    this.handlers.get(name)?.forEach((h) => (h as (p: GameEventMap[K]) => void)(payload));
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const gameEventBus = new EventBus();
