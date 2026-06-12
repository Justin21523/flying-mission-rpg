// Batch 13 — central asset reference shapes for the GLTF replacement pipeline. Keeps model paths out of
// scattered hardcodes; missing refs resolve to a placeholder so the build never fails for not-yet-shipped art.
export interface CharacterAssetRefs {
  characterId: string;
  planeModelAssetId?: string;
  robotModelAssetId?: string;
  transformAnimationClips?: string[];
}

export interface AssetRegistry {
  placeholderModelId: string;
  characters: CharacterAssetRefs[];
}
