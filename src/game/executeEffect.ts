import type { DialogueEffect } from '../types/dialogue';
import type { ToolId } from '../types/tool';
import { useInventoryStore } from '../stores/inventoryStore';
import { getItem } from '../data/items';
import { useQuestStore } from '../stores/questStore';
import { useFlagStore } from '../stores/flagStore';
import { useDialogueStore } from '../stores/dialogueStore';
import { getEditorEncounter } from '../stores/editorEncounterStore';
import { startEditorEncounter } from './battle/startEncounter';
import { useActivityStore } from '../stores/activityStore';
import { useRelationshipStore } from '../stores/relationshipStore';
import { useRescueOperationStore } from '../stores/rescueOperationStore';
import { useToolStore } from '../stores/toolStore';
import { useTransformStore } from '../stores/transformStore';
import type { PoliCharId, PoliForm } from '../stores/transformStore';
import { spawnRandomIncident } from './incident/spawnIncident';

// Kit — apply a generic dialogue/choice/quest effect to the live stores. Add a case here when you add
// an effect kind to DialogueEffect.
export function executeEffect(effect: DialogueEffect): void {
  switch (effect.type) {
    case 'addItem':
    case 'giveItem':
      useInventoryStore.getState().addItem(effect.itemId, effect.quantity ?? 1);
      break;
    case 'giftItem': {
      // Player gives an item to an NPC → remove it + raise that NPC's trust by the item's giftTrust.
      const inv = useInventoryStore.getState();
      if (inv.hasItem(effect.itemId)) {
        inv.removeItem(effect.itemId, 1);
        const gt = getItem(effect.itemId)?.giftTrust ?? 0;
        if (gt > 0) useRelationshipStore.getState().increaseTrust(effect.characterId, gt);
      }
      break;
    }
    case 'updateObjective':
    case 'completeObjective':
      useQuestStore.getState().updateObjective(effect.questId, effect.objectiveId, true);
      break;
    case 'startQuest':
      useQuestStore.getState().startQuest(effect.questId);
      break;
    case 'completeQuest':
      useQuestStore.getState().completeQuest(effect.questId);
      break;
    case 'setWorldFlag':
      useFlagStore.getState().setFlag(effect.flag);
      break;
    case 'startBattle':
      useDialogueStore.getState().endDialogue();
      startEditorEncounter(getEditorEncounter(effect.encounterId));
      break;
    case 'startActivity':
      useDialogueStore.getState().endDialogue();
      useActivityStore.getState().startActivity(effect.activityId);
      break;
    case 'closeDialogue':
      useDialogueStore.getState().endDialogue();
      break;
    case 'increaseTrust':
      useRelationshipStore.getState().increaseTrust(effect.characterId, effect.amount);
      break;
    case 'startIncident':
      useDialogueStore.getState().endDialogue();
      useRescueOperationStore.getState().startRescue(effect.incidentId);
      break;
    case 'unlockTool':
      useToolStore.getState().unlockTool(effect.toolId as ToolId);
      break;
    case 'setForm':
      useTransformStore.setState({ form: effect.form as PoliForm });
      break;
    case 'setActiveCharacter':
      useTransformStore.setState({ charId: effect.charId as PoliCharId, flying: false });
      break;
    case 'spawnRandomIncident':
      spawnRandomIncident();
      break;
  }
}
