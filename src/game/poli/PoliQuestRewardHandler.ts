import { setQuestRewardHandler, useQuestStore } from '../../stores/questStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useProgressionStore } from '../../stores/progressionStore';
import { useFlagStore } from '../../stores/flagStore';
import { useRelationshipStore } from '../../stores/relationshipStore';
import { useJinResearchStore } from '../../stores/jinResearchStore';
import { useWalletStore } from '../../stores/walletStore';
import { useEditorQuestStore } from '../../stores/editorQuestStore';
import { syncEditorQuests } from '../editor/editorQuestToQuest';
import { markQuestCompleted } from '../quest/questPrereqs';
import { playSfx } from '../audio/sfx';

// POLI quest reward handler (seam #2).
// Preserves the kit default (items, exp, world flags) and adds trust-grant support.
// Trust gains are encoded as 'trust:{characterId}:{amount}' flag strings in reward.flags.
export function setupPoliQuestRewards(): void {
  setQuestRewardHandler((reward, quest) => {
    playSfx('questComplete');
    useJinResearchStore.getState().addPoints(1); // helping residents earns a research point
    reward.items?.forEach((it) =>
      useInventoryStore.getState().addItem(it.itemId, it.quantity ?? 1),
    );
    if (reward.exp) useProgressionStore.getState().addExp(reward.exp);
    if (reward.coins) useWalletStore.getState().addCoins(reward.coins);
    markQuestCompleted(quest.id); // for repeat-cooldown gating
    // Branching: when this quest defines a nextQuestId, auto-start it on completion.
    const eq = useEditorQuestStore.getState().quests.find((q) => q.id === quest.id);
    if (eq?.nextQuestId) { syncEditorQuests(); useQuestStore.getState().startQuest(eq.nextQuestId); }
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
