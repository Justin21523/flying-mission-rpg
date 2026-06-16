import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { PartnerFusionDefinition } from '../../types/game/supportCombat';
import { SEED_PARTNER_FUSIONS } from '../../data/support-combat/partnerFusions';

// Editable Partner Fusion definitions (Batch I, 🤝 Fusion editor tab). Seed-merged at boot.
export const useFusionEditorStore = createEditorCollection<PartnerFusionDefinition>({
  storageKey: 'aero-rescue-editor-fusion-v1',
  seed: SEED_PARTNER_FUSIONS,
  makeId: () => `fusion_${nanoid(6)}`,
  seedVersion: 'i-fusion',
});

export function allFusions(): PartnerFusionDefinition[] {
  const items = useFusionEditorStore.getState().items;
  return items.length ? items : SEED_PARTNER_FUSIONS;
}
export function fusionsForPrimary(primaryCharacterId: string | undefined): PartnerFusionDefinition[] {
  if (!primaryCharacterId) return [];
  return allFusions().filter((f) => f.primaryCharacterId === primaryCharacterId && f.enabled !== false);
}
