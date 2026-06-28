import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { EquipmentFusionRecipe } from '../../data/progression/equipmentFusionRecipes';
import { SEED_FUSION_RECIPES } from '../../data/progression/equipmentFusionRecipes';

// Wave 5 — editable equipment-mod fusion recipes (⬆ Progression tab).
export const useEquipmentFusionRecipeStore = createEditorCollection<EquipmentFusionRecipe>({
  storageKey: 'aero-rescue-equipment-fusion-recipes-v1',
  seed: SEED_FUSION_RECIPES,
  makeId: () => `fuse_${nanoid(6)}`,
});
