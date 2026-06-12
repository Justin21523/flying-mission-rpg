import type { DialogueTree } from '../types/dialogue';
import { POLI_DIALOGUES } from './dialogues/poliDialogues';

// Kit — sample dialogue trees. `dlg_guide` shows choices, a startQuest effect, a node-entry action
// (completeObjective), and a condition-gated branch. The door trees are system messages reused by the
// interaction handler.
export const SEED_DIALOGUES: DialogueTree[] = [
  {
    id: 'dlg_guide',
    rootNodeId: 'start',
    nodes: {
      // Once the quest is done, greet differently (condition redirect → fallback).
      start: {
        id: 'start',
        speaker: 'Village Guide',
        text: 'Ah, you again! Could you help me open the old storehouse?',
        emotion: 'happy',
        conditions: [{ type: 'questCompleted', targetId: 'quest_intro' }],
        fallbackNodeId: 'offer',
        nextNodeId: 'thanks',
      },
      thanks: {
        id: 'thanks',
        speaker: 'Village Guide',
        text: 'Thanks again for opening that storehouse. The herbs inside were a fine reward!',
        emotion: 'excited',
        nextNodeId: null,
      },
      offer: {
        id: 'offer',
        speaker: 'Village Guide',
        text: 'The storehouse has been locked for years. Will you find the key and open it?',
        choices: [
          { id: 'accept', text: 'Of course — I will help.', nextNodeId: 'accepted', effect: { type: 'startQuest', questId: 'quest_intro' } },
          { id: 'decline', text: 'Maybe later.', nextNodeId: null },
        ],
      },
      accepted: {
        id: 'accepted',
        speaker: 'Village Guide',
        text: 'Wonderful! The Old Key is somewhere out in the field. Bring it to the storehouse door.',
        emotion: 'happy',
        actions: [{ type: 'completeObjective', questId: 'quest_intro', objectiveId: 'obj_talk' }],
        nextNodeId: null,
      },
    },
  },
  {
    id: 'dialogue_door_locked',
    rootNodeId: 'n',
    nodes: { n: { id: 'n', speaker: 'System', text: 'The storehouse door is locked tight. You need a key.', nextNodeId: null } },
  },
  {
    id: 'dialogue_door_unlocked',
    rootNodeId: 'n',
    nodes: { n: { id: 'n', speaker: 'System', text: 'The old key turns with a satisfying clunk — the storehouse creaks open!', nextNodeId: null } },
  },

  // ── Old Tovi (side-quest: Friendly Faces). Three condition-gated trees the destination talk handler picks
  // between in priority order: thanks (done) → progress (active) → offer (default). ──
  {
    id: 'dlg_tovi_thanks',
    label: 'Tovi — after the favour',
    condition: { type: 'questCompleted', targetId: 'quest_tovi_hello' },
    rootNodeId: 'n',
    nodes: { n: { id: 'n', speaker: 'Old Tovi', text: 'Thank you for going round to say hello! The harbor feels warmer already.', emotion: 'excited', nextNodeId: null } },
  },
  {
    id: 'dlg_tovi_progress',
    label: 'Tovi — in progress',
    condition: { type: 'questInProgress', targetId: 'quest_tovi_hello' },
    rootNodeId: 'n',
    nodes: { n: { id: 'n', speaker: 'Old Tovi', text: 'Have you said hello to Mina and Postmistress Pip yet? They love a friendly face.', emotion: 'happy', nextNodeId: null } },
  },
  {
    id: 'dlg_tovi_offer',
    label: 'Tovi — offer',
    rootNodeId: 'start',
    nodes: {
      start: {
        id: 'start', speaker: 'Old Tovi', emotion: 'happy',
        text: 'Welcome to Sunny Harbor! Would you help an old man make our newcomers feel at home?',
        choices: [
          { id: 'accept', text: "I'd be glad to.", nextNodeId: 'accepted', effect: { type: 'startQuest', questId: 'quest_tovi_hello' } },
          { id: 'decline', text: 'Maybe later.', nextNodeId: null },
        ],
      },
      accepted: { id: 'accepted', speaker: 'Old Tovi', emotion: 'excited', text: 'Wonderful! Go say hello to Mina and Postmistress Pip — then come tell me how it went.', nextNodeId: null },
    },
  },

  // ── Marina (side-quest: A Warm Welcome). ──
  {
    id: 'dlg_marina_thanks',
    label: 'Marina — after the favour',
    condition: { type: 'questCompleted', targetId: 'quest_marina_welcome' },
    rootNodeId: 'n',
    nodes: { n: { id: 'n', speaker: 'Marina', text: 'You really brightened everyone’s day — here, a little something from the food stand!', emotion: 'excited', nextNodeId: null } },
  },
  {
    id: 'dlg_marina_progress',
    label: 'Marina — in progress',
    condition: { type: 'questInProgress', targetId: 'quest_marina_welcome' },
    rootNodeId: 'n',
    nodes: { n: { id: 'n', speaker: 'Marina', text: 'Still doing the rounds? Old Tovi and Mina will be happy to see you.', emotion: 'happy', nextNodeId: null } },
  },
  {
    id: 'dlg_marina_offer',
    label: 'Marina — offer',
    rootNodeId: 'start',
    nodes: {
      start: {
        id: 'start', speaker: 'Marina', emotion: 'happy',
        text: 'A warm welcome starts with a friendly hello. Care to greet a couple of folks for me?',
        choices: [
          { id: 'accept', text: 'Sure, point me to them.', nextNodeId: 'accepted', effect: { type: 'startQuest', questId: 'quest_marina_welcome' } },
          { id: 'decline', text: 'Not right now.', nextNodeId: null },
        ],
      },
      accepted: { id: 'accepted', speaker: 'Marina', emotion: 'excited', text: 'Lovely! Say hello to Old Tovi and Mina, then swing back by my stand.', nextNodeId: null },
    },
  },
  ...POLI_DIALOGUES,
];
