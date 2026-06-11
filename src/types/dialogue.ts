// Kit — generic dialogue model. The yokai-game's codex/friendship/battle/activity condition & effect
// kinds were removed; what remains is engine-agnostic (items, quests, doors, world flags, player level).
// Add your own kinds by extending the unions below + the evaluateCondition / executeEffect switches.
export type DialogueEmotion =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'worried'
  | 'thinking'
  | 'excited';

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  nextNodeId?: string | null;
  choices?: DialogueChoice[];
  emotion?: DialogueEmotion;          // portrait mood
  actions?: DialogueEffect[];         // effects fired once when the node is entered
  conditions?: DialogueCondition[];   // all must pass on entry, else jump to fallbackNodeId/end
  fallbackNodeId?: string | null;     // redirect target when conditions fail
}

export interface DialogueTree {
  id: string;
  rootNodeId: string;
  nodes: Record<string, DialogueNode>;
  allowLoop?: boolean; // opt-in: allow cycling back to a visited node
  // Tree-level gate: when an NPC has several trees, on interact the FIRST tree (in the NPC's order) whose
  // condition passes is played (no condition = always eligible). Lets one NPC react to quest/flag/trust state.
  condition?: DialogueCondition;
  label?: string; // editor label (e.g. "After rescue") — UI only
}

// Discriminated union — each condition type carries its own required fields.
export type DialogueCondition =
  | { type: 'hasItem'; targetId: string }
  | { type: 'questInProgress'; targetId: string }
  | { type: 'questCompleted'; targetId: string }
  | { type: 'objectiveCompleted'; questId: string; objectiveId: string }
  | { type: 'doorUnlocked'; doorId: string }
  | { type: 'worldFlagSet'; flag: string }
  | { type: 'playerLevel'; level: number }
  | { type: 'trustLevel'; characterId: string; minTrust: number }
  | { type: 'toolUnlocked'; toolId: string }
  | { type: 'activeCharIs'; charId: string }
  | { type: 'activeFormIs'; form: string };

export type DialogueEffect =
  | { type: 'addItem'; itemId: string; quantity?: number }
  | { type: 'giveItem'; itemId: string; quantity?: number }
  | { type: 'giftItem'; itemId: string; characterId: string } // player gives item → NPC trust (item.giftTrust)
  | { type: 'updateObjective'; questId: string; objectiveId: string }
  | { type: 'completeObjective'; questId: string; objectiveId: string }
  | { type: 'startQuest'; questId: string }
  | { type: 'completeQuest'; questId: string }
  | { type: 'setWorldFlag'; flag: string }
  | { type: 'startBattle'; encounterId: string }
  | { type: 'startActivity'; activityId: string }
  | { type: 'closeDialogue' }
  | { type: 'increaseTrust'; characterId: string; amount: number }
  | { type: 'startIncident'; incidentId: string }
  | { type: 'unlockTool'; toolId: string }
  | { type: 'setForm'; form: string }
  | { type: 'setActiveCharacter'; charId: string }
  | { type: 'spawnRandomIncident' }
  // ── aero-rescue game effects (Batch 7) ──
  | { type: 'startMission'; missionId: string }
  | { type: 'openMiniGame'; miniGameId: string }
  | { type: 'startHunt' }; // start the destination yokai hunt

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string | null;
  condition?: DialogueCondition;
  effect?: DialogueEffect;
}
