// Phase C — a generic game-event bus for reaction actions that do not (yet) map to a dedicated system
// (spawnEffect / changeState / triggerNpcReaction / emitGameEvent) and for the reaction FX overlay's animation
// markers. Plain listener array; consumers (CollisionReactionFx) subscribe. Never a silent no-op — every such
// action surfaces here and (in dev) on console.debug, so behaviour is observable, not swallowed.
export interface GameEvent {
  kind: 'reaction' | 'gameEvent' | 'changeState' | 'npcReaction' | 'spawnEffect';
  payload: string;          // event/effect/state/reaction name
  on?: 'source' | 'target'; // which side of the collision, when relevant
  x?: number; y?: number; z?: number; // optional world anchor (e.g. player pos) for FX
}

type Listener = (e: GameEvent) => void;
const listeners: Listener[] = [];

export function subscribeGameEvent(cb: Listener): () => void {
  listeners.push(cb);
  return () => { const i = listeners.indexOf(cb); if (i >= 0) listeners.splice(i, 1); };
}

export function emitGameEvent(e: GameEvent): void {
  for (const cb of listeners) cb(e);
  if (import.meta.env.DEV) console.debug('[gameEvent]', e.kind, e.payload, e.on ?? '');
}
