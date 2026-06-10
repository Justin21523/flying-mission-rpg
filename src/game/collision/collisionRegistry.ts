import type { CollisionMetadata } from '../../types/collision';

// Phase C — the central CollisionMetadata resolver. Every collidable registers its semantic metadata here on
// mount and unregisters on unmount; Rapier colliders carry ONLY the object id (a back-pointer in userData),
// never the full metadata. Gameplay (the reaction engine) resolves an id → metadata through this registry, so
// no code reads arbitrary userData. A plain module Map — no React, no per-frame allocation.
const registry = new Map<string, CollisionMetadata>();

export function registerCollision(meta: CollisionMetadata): void {
  registry.set(meta.objectId, meta);
}

export function unregisterCollision(objectId: string): void {
  registry.delete(objectId);
}

export function resolveCollision(objectId: string): CollisionMetadata | undefined {
  return registry.get(objectId);
}
