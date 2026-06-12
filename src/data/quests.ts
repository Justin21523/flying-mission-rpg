import type { Quest } from '../types/quest';
import { POLI_QUESTS } from './quests/poliQuests';

// Kit — sample quest. Objectives auto-complete the quest when all are done; the reward (items + player
// exp + a world flag) flows through questStore's onQuestReward hook.
export const SEED_QUESTS: Quest[] = [
  {
    id: 'quest_intro',
    title: 'A Helping Hand',
    description: 'Talk to the Village Guide, find the Old Key in the field, and open the storehouse.',
    status: 'NotStarted',
    source: 'seed',
    giverNpcId: 'npc_guide',
    objectives: [
      { id: 'obj_talk', description: 'Speak with the Village Guide', isCompleted: false },
      { id: 'obj_key', description: 'Find the Old Key', isCompleted: false },
      { id: 'obj_open_door', description: 'Open the storehouse door', isCompleted: false },
    ],
    reward: { items: [{ itemId: 'item_herb', quantity: 2 }], exp: 50, flags: ['intro_done'] },
  },
  // ── Destination resident SIDE-QUESTS (given via dialogue by harbor residents). talkToNPC objectives
  // auto-track off the `npc_talked_<id>` flag set when you greet a resident; the quest auto-completes + rewards
  // when all are done, and the giver's dialogue switches to its "thanks" tree. ──
  {
    id: 'quest_tovi_hello',
    title: 'Friendly Faces',
    description: 'Old Tovi asks you to make the harbor feel welcoming — go say hello to Mina and Postmistress Pip.',
    status: 'NotStarted',
    source: 'seed',
    giverNpcId: 'npc_tovi',
    objectives: [
      { id: 'obj_hi_mina', description: 'Say hello to Mina', isCompleted: false, track: { type: 'talkToNPC', targetId: 'npc_mina' } },
      { id: 'obj_hi_pip', description: 'Say hello to Postmistress Pip', isCompleted: false, track: { type: 'talkToNPC', targetId: 'npc_postmistress' } },
    ],
    reward: { exp: 40, coins: 20 },
  },
  {
    id: 'quest_marina_welcome',
    title: 'A Warm Welcome',
    description: 'Marina wants the newcomers to feel at home — greet Old Tovi and Mina around the docks.',
    status: 'NotStarted',
    source: 'seed',
    giverNpcId: 'npc_marina',
    objectives: [
      { id: 'obj_hi_tovi', description: 'Say hello to Old Tovi', isCompleted: false, track: { type: 'talkToNPC', targetId: 'npc_tovi' } },
      { id: 'obj_hi_mina2', description: 'Say hello to Mina', isCompleted: false, track: { type: 'talkToNPC', targetId: 'npc_mina' } },
    ],
    reward: { exp: 45, coins: 25, items: [{ itemId: 'item_herb', quantity: 1 }] },
  },
  ...POLI_QUESTS,
];
