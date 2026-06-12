import { getModelAsset, type ModelAsset } from '../../data/modelLibrary';
import type { CharacterPoseModel } from '../../types/game/character';

export type ModelAssetLookup = (assetId: string | undefined) => ModelAsset | undefined;

export function poseModelPreloadPaths(
  poseModels: readonly CharacterPoseModel[] | undefined,
  lookup: ModelAssetLookup = getModelAsset,
): string[] {
  const seen = new Set<string>();
  const paths: string[] = [];
  for (const pose of poseModels ?? []) {
    const asset = lookup(pose.assetId);
    if (!asset || seen.has(asset.path)) continue;
    seen.add(asset.path);
    paths.push(encodeURI(asset.path));
  }
  return paths;
}
