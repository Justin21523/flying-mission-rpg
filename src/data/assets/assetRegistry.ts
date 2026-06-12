import type { AssetRegistry, CharacterAssetRefs } from '../../types/assetTypes';
import { getEditorCharacters } from '../../stores/game/editorCharacterStore';

// Batch 13 — single place to resolve character model/animation assets (built from the authored character
// store). Replacing art = drop a GLB into public/models/** and point the character's modelAssetId at it (in
// the 🛩 Characters tab) — no code change. Missing refs fall back to the placeholder so build/runtime survive.
export const PLACEHOLDER_MODEL_ID = '__placeholder_box__';

export function buildAssetRegistry(): AssetRegistry {
  return {
    placeholderModelId: PLACEHOLDER_MODEL_ID,
    characters: getEditorCharacters().map<CharacterAssetRefs>((c) => ({
      characterId: c.id,
      robotModelAssetId: c.modelAssetId,
      planeModelAssetId: c.planeModelAssetId,
      transformAnimationClips: c.transformAnimation ? [c.transformAnimation] : undefined,
    })),
  };
}

/** Resolve a character's model asset id for a form, falling back to the placeholder when not yet provided. */
export function resolveCharacterModel(characterId: string, form: 'plane' | 'robot'): string {
  const c = getEditorCharacters().find((x) => x.id === characterId);
  if (!c) return PLACEHOLDER_MODEL_ID;
  const id = form === 'plane' ? (c.planeModelAssetId ?? c.modelAssetId) : c.modelAssetId;
  return id ?? PLACEHOLDER_MODEL_ID;
}
