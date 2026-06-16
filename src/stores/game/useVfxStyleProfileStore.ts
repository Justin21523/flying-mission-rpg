import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { CharacterVfxStyleProfile } from '../../types/characterVfxStyleTypes';
import { SEED_VFX_STYLE_PROFILES } from '../../data/cinematic-vfx/characterVfxStyleProfiles';

// Editable character VFX style profiles (🎨 VFX Quality tab · Style). id === characterId so the visual
// language for each hero is one tunable record (shapes / signature objects / motion / material / camera).
export type EditableVfxStyleProfile = CharacterVfxStyleProfile & { id: string };

export const useVfxStyleProfileStore = createEditorCollection<EditableVfxStyleProfile>({
  storageKey: 'aero-rescue-editor-vfx-style-v2', // v2 (F.6c): drop stale persisted profiles
  seed: SEED_VFX_STYLE_PROFILES.map((p) => ({ ...p, id: p.characterId })),
  makeId: () => `vfxstyle_${nanoid(6)}`,
  seedVersion: 'f7-16-skills', // signatureObjects extended with the per-hero clone signature keys
});

export function getEditableStyleProfile(characterId: string | undefined): EditableVfxStyleProfile | undefined {
  if (!characterId) return undefined;
  return useVfxStyleProfileStore.getState().items.find((p) => p.characterId === characterId);
}
