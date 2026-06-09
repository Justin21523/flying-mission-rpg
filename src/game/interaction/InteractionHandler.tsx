import { useEffect } from 'react';
import { useInteractionStore } from '../../stores/interactionStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useWorldStore } from '../../stores/worldStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useQuestStore } from '../../stores/questStore';
import { useActivityStore } from '../../stores/activityStore';
import { useShopStore } from '../../stores/shopStore';
import { useDoorStore } from '../../stores/doorStore';
import { useFlagStore } from '../../stores/flagStore';
import { getKitArea } from '../../data/areas';
import { getNpcProfile } from '../../data/npcs';
import { getEditorNpc, getEditorDialogueTree } from '../../stores/editorNpcStore';
import { getDialogueTree } from '../dialogue/dialogueRegistry';
import { evaluateCondition } from '../evaluateCondition';
import type { EditorNpc } from '../../types/editorNPC';
import { getDoorDef } from '../../data/doors';
import { getAreaEntities } from '../../data/areaEntities';
import { getEditorTrigger } from '../../stores/editorTriggerStore';
import { fireEditorTrigger } from '../editor/fireEditorTrigger';
import { arrivalSpawn } from '../world/gateLayout';
import { executeEffect } from '../executeEffect';

// Pick which of an editor NPC's dialogue trees plays: the first (in order) whose tree-level condition passes.
function chooseNpcTreeId(enpc: EditorNpc): string | null {
  const ids = enpc.dialogueTreeIds?.length ? enpc.dialogueTreeIds : (enpc.dialogueTreeId ? [enpc.dialogueTreeId] : []);
  for (const id of ids) {
    const tree = getEditorDialogueTree(id) ?? getDialogueTree(id);
    const cond = tree?.condition;
    if (!cond || evaluateCondition(cond)) return id;
  }
  return ids[0] ?? null;
}

// Kit — non-visual [E] dispatcher. Reads the current interaction target (set by sensor colliders on
// gates / NPCs / items / doors) and acts on it: travel, start dialogue, pick up an item (+ its effects),
// or open a door if the player holds its key. Generic — no yokai/encounter/codex coupling.
export const InteractionHandler = () => {
  const currentTargetId = useInteractionStore((s) => s.currentTargetId);
  const targetType = useInteractionStore((s) => s.targetType);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || e.repeat || !currentTargetId || !targetType) return;
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (useDialogueStore.getState().isActive) return; // DialogueBox owns [E] while talking

      const interaction = useInteractionStore.getState();
      const areaId = usePlayerStore.getState().currentAreaId;

      if (targetType === 'gate') {
        const target = getKitArea(currentTargetId);
        if (!target) return;
        const spawn = arrivalSpawn(target.id, areaId);
        usePlayerStore.getState().travelToArea(target.id, spawn);
        useWorldStore.getState().discoverArea(target.id);
        interaction.clearTarget(target.id);
        return;
      }

      if (targetType === 'npc') {
        useFlagStore.getState().setFlag(`npc_talked_${currentTargetId}`);
        const npc = getNpcProfile(currentTargetId);
        // Editor NPCs can offer / accept quests via their startsQuestIds / completesQuestIds bindings.
        const enpc = getEditorNpc(currentTargetId);
        if (enpc) {
          const qs = useQuestStore.getState();
          const completable = (enpc.completesQuestIds ?? [])
            .map((id) => qs.getQuestById(id))
            .find((q) => q && q.status === 'InProgress' && q.objectives.every((o) => o.isCompleted));
          if (completable) { qs.completeQuest(completable.id); }
          const startable = (enpc.startsQuestIds ?? [])
            .map((id) => qs.getQuestById(id))
            .find((q) => q && q.status === 'NotStarted');
          if (startable) { qs.startQuest(startable.id); }
          // Functional roles: host starts a mini-game / hunt; vendor opens a shop.
          if (enpc.hostsActivityId) {
            const a = useActivityStore.getState();
            if (a.startActivity(enpc.hostsActivityId)) { a.begin(); return; }
          }
          if (enpc.sells && enpc.sells.length > 0) {
            useShopStore.getState().openShop(enpc.displayName, enpc.sells);
            return;
          }
        }
        // Pick the right tree (condition-gated) for editor NPCs; seed NPCs use their single tree.
        const treeId = enpc ? chooseNpcTreeId(enpc) : (npc?.dialogueTreeId ?? null);
        if (treeId) useDialogueStore.getState().startDialogue(treeId);
        return;
      }

      if (targetType === 'item') {
        useInventoryStore.getState().addItem(currentTargetId);
        useInventoryStore.getState().markPickedUp(currentTargetId);
        interaction.clearTarget(currentTargetId);
        getAreaEntities(areaId)?.items?.find((p) => p.itemId === currentTargetId)?.onPickupEffects?.forEach(executeEffect);
        return;
      }

      if (targetType === 'editorTrigger') {
        fireEditorTrigger(getEditorTrigger(currentTargetId));
        interaction.clearTarget(currentTargetId);
        return;
      }

      if (targetType === 'door') {
        const door = getDoorDef(currentTargetId);
        if (!door) return;
        if (useInventoryStore.getState().hasItem(door.unlockItemId)) {
          useDialogueStore.getState().startDialogue('dialogue_door_unlocked');
          useDoorStore.getState().unlockDoor(door.id);
          if (door.linkedQuestId && door.linkedObjectiveId) {
            useQuestStore.getState().updateObjective(door.linkedQuestId, door.linkedObjectiveId, true);
          }
          interaction.clearTarget(door.id);
        } else {
          useDialogueStore.getState().startDialogue('dialogue_door_locked');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentTargetId, targetType]);

  return null;
};
