import type { GameplayCollisionEvent } from '../../types/collision';

// Phase C — the GameplayCollisionEvent bus. Collision sources (CollisionTestLayer sensors; later NPC/vehicle
// colliders) call emitCollision(); the reaction engine subscribes once and matches rules. `lastEvent` is kept
// for the debug HUD. A plain listener array mutated outside React (mirrors the dashImpulse/pathFollow buses).
type Listener = (e: GameplayCollisionEvent) => void;

const listeners: Listener[] = [];

export const collisionState: { lastEvent: GameplayCollisionEvent | null } = { lastEvent: null };

export function subscribeCollision(cb: Listener): () => void {
  listeners.push(cb);
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function emitCollision(e: GameplayCollisionEvent): void {
  collisionState.lastEvent = e;
  for (const cb of listeners) cb(e);
}
