import type { ClonePoseModelSet } from '../../types/cloneAbilityTypes';
import { getModelAsset } from '../../data/modelLibrary';
import { resolveClonePose } from './ClonePoseModelPresets';

// Clone pose model runtime (Batch F.7). Resolves a clone's pose model to a real GLB, falling back gracefully so
// a missing pose NEVER throws (returns the set's fallbackModelId). The actual GLB loading / pooling / material
// handling is done by ModelParticleRenderer (reused) when the clone effect plays — this module is the
// resolution + fallback layer used by the effect builder, validation, and the debug pose preview.

export type CloneposeState = 'idle' | 'action' | 'defense' | 'support' | 'ultimate' | 'dissolve';

export function poseModelExists(modelId: string | undefined): boolean {
  return !!modelId && !!getModelAsset(modelId);
}

// Resolve a pose for a given state to an EXISTING model id, falling back to action → fallback when missing.
export function resolvePoseOrFallback(set: ClonePoseModelSet, state: CloneposeState): string {
  const wanted = resolveClonePose(set, state);
  if (poseModelExists(wanted)) return wanted;
  if (poseModelExists(set.actionPoseModelId)) return set.actionPoseModelId;
  return set.fallbackModelId;
}

// True if a pose set can render at all (action OR fallback resolves to a real GLB).
export function poseSetResolves(set: ClonePoseModelSet): boolean {
  return poseModelExists(set.actionPoseModelId) || poseModelExists(set.fallbackModelId);
}

// The distinct pose model ids a set will actually use (deduped, only resolvable) — for the debug pose preview.
export function resolvedPoseList(set: ClonePoseModelSet): string[] {
  const states: CloneposeState[] = ['idle', 'action', 'defense', 'support', 'ultimate', 'dissolve'];
  const seen = new Set<string>();
  for (const s of states) seen.add(resolvePoseOrFallback(set, s));
  return [...seen];
}
