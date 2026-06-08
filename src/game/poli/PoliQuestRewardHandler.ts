import { setQuestRewardHandler } from '../../stores/questStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useProgressionStore } from '../../stores/progressionStore';
import { useFlagStore } from '../../stores/flagStore';
import { useRelationshipStore } from '../../stores/relationshipStore';

// POLI quest reward handler (seam #2).
// Preserves the kit default (items, exp, world flags) and adds trust-grant support.
// Trust gains are encoded as 'trust:{characterId}:{amount}' flag strings in reward.flags.
export function setupPoliQuestRewards(): void {
  setQuestRewardHandler((reward) => {
    reward.items?.forEach((it) =>
      useInventoryStore.getState().addItem(it.itemId, it.quantity ?? 1),
    );
    if (reward.exp) useProgressionStore.getState().addExp(reward.exp);
    reward.flags?.forEach((f) => {
      if (f.startsWith('trust:')) {
        const parts = f.split(':');
        const charId = parts[1];
        const amount = parseInt(parts[2], 10);
        if (charId && !isNaN(amount)) {
          useRelationshipStore.getState().increaseTrust(charId, amount);
        }
      } else {
        useFlagStore.getState().setFlag(f);
      }
    });
  });
}
