import type { ClonePoseModelSet, CloneType } from '../../types/cloneAbilityTypes';
import { HERO_MODELS } from '../../data/cinematic-vfx/vfxModelCatalog';

// Clone pose model presets (Batch F.7). Each hero's clone abilities render the hero in DIFFERENT poses — we
// resolve real pose GLBs from the hero's own super-wings/ set (HERO_MODELS[char].poses) so every clone reads as
// that character in a distinct stance. Heroes with many poses (Jerome 11, Bello 10…) get rich variety; Jett has
// only 1 pose, so we fall back to airplane/transformer/base-pose variants (the renderer + transform make them
// read distinct). NEVER throws — always returns a set with a resolvable fallbackModelId.

// Pick the n-th available pose, wrapping; falls back to base pose → airplane → transformer.
function poseAt(characterId: string, n: number): string | undefined {
  const h = HERO_MODELS[characterId as keyof typeof HERO_MODELS];
  if (!h) return undefined;
  if (h.poses.length > 0) return h.poses[n % h.poses.length];
  return h.pose ?? h.airplane ?? h.transformer;
}

function fallbackModel(characterId: string): string {
  const h = HERO_MODELS[characterId as keyof typeof HERO_MODELS];
  return (h?.pose ?? h?.airplane ?? h?.transformer ?? h?.all[0] ?? '') as string;
}

// A pose index seed per clone type so the 4 clones of a hero don't all start on the same pose.
const TYPE_SEED: Record<CloneType, number> = {
  'attack-double': 1,
  'defense-double': 2,
  'support-double': 3,
  'ultimate-double': 4,
};

export function clonePoseModelSet(characterId: string, cloneType: CloneType): ClonePoseModelSet {
  const seed = TYPE_SEED[cloneType];
  const fallbackModelId = fallbackModel(characterId);
  const get = (n: number) => poseAt(characterId, seed + n) ?? fallbackModelId;
  const h = HERO_MODELS[characterId as keyof typeof HERO_MODELS];
  return {
    idlePoseModelId: get(0),
    actionPoseModelId: get(1),
    defensePoseModelId: get(2),
    supportPoseModelId: get(3),
    ultimatePoseModelId: h?.transformer ?? get(4),
    dissolvePoseModelId: get(0),
    fallbackModelId,
  };
}

// The action pose for a clone, with a guaranteed fallback (used by the effect builder + validation).
export function resolveClonePose(set: ClonePoseModelSet, state: 'idle' | 'action' | 'defense' | 'support' | 'ultimate' | 'dissolve'): string {
  const byState: Record<typeof state, string | undefined> = {
    idle: set.idlePoseModelId,
    action: set.actionPoseModelId,
    defense: set.defensePoseModelId,
    support: set.supportPoseModelId,
    ultimate: set.ultimatePoseModelId,
    dissolve: set.dissolvePoseModelId,
  };
  return byState[state] || set.actionPoseModelId || set.fallbackModelId;
}
