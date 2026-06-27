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
  // ── Batch E — Hub resident side-quests. Offered from the Hangar Rescue Roster once the resident is rescued;
  // a single favour the player fulfils from the panel, rewarding coins (routed through the POLI reward handler). ──
  {
    id: 'sq_hub_skipper',
    title: 'Skipper\'s Thanks',
    description: 'Skipper wants to restock the harbor dock — lend a hand around the Hangar.',
    status: 'NotStarted',
    source: 'seed',
    giverNpcId: 'npc_hub_skipper',
    objectives: [{ id: 'obj_skipper', description: 'Help Skipper restock the dock crates', isCompleted: false }],
    reward: { coins: 60, exp: 40 },
  },
  {
    id: 'sq_hub_signal',
    title: 'Signal Restored',
    description: 'Signa offers to retune the Hangar comms in exchange for a small favour.',
    status: 'NotStarted',
    source: 'seed',
    giverNpcId: 'npc_hub_signal',
    objectives: [{ id: 'obj_signal', description: 'Help Signa retune the Hangar comms array', isCompleted: false }],
    reward: { coins: 80, exp: 50 },
  },
  {
    id: 'sq_hub_forge',
    title: 'Forge\'s Tune-Up',
    description: 'Forge will tune up your craft if you help him haul parts across the Hangar.',
    status: 'NotStarted',
    source: 'seed',
    giverNpcId: 'npc_hub_forge',
    objectives: [{ id: 'obj_forge', description: 'Help Forge haul machine parts', isCompleted: false }],
    reward: { coins: 100, exp: 60 },
  },
  // World-build Wave 1 — side-quests for the 7 newly rescued residents (rewards escalate with stage difficulty).
  {
    id: 'sq_hub_drift',
    title: 'Survey the Shortcut',
    description: 'Drift mapped a hidden tunnel shortcut and wants help marking it for the rescue crew.',
    status: 'NotStarted', source: 'seed', giverNpcId: 'npc_hub_drift',
    objectives: [{ id: 'obj_drift', description: 'Help Drift mark the tunnel shortcut', isCompleted: false }],
    reward: { coins: 120, exp: 70 },
  },
  {
    id: 'sq_hub_skye',
    title: 'Clear the Launch Lane',
    description: 'Skye needs the Hangar launch lane cleared and re-coordinated for the next dispatch.',
    status: 'NotStarted', source: 'seed', giverNpcId: 'npc_hub_skye',
    objectives: [{ id: 'obj_skye', description: 'Help Skye clear the launch lane', isCompleted: false }],
    reward: { coins: 140, exp: 80 },
  },
  {
    id: 'sq_hub_lumen',
    title: 'Steady the Grid',
    description: 'Lumen is rewiring the Hangar grid and could use a steady hand on the breakers.',
    status: 'NotStarted', source: 'seed', giverNpcId: 'npc_hub_lumen',
    objectives: [{ id: 'obj_lumen', description: 'Help Lumen stabilize the Hangar grid', isCompleted: false }],
    reward: { coins: 150, exp: 85, items: [{ itemId: 'item_herb', quantity: 1 }] },
  },
  {
    id: 'sq_hub_tide',
    title: 'Stock the Infirmary',
    description: 'Tide is setting up the Hangar infirmary and needs supplies sorted.',
    status: 'NotStarted', source: 'seed', giverNpcId: 'npc_hub_tide',
    objectives: [{ id: 'obj_tide', description: 'Help Tide stock the infirmary', isCompleted: false }],
    reward: { coins: 160, exp: 90 },
  },
  {
    id: 'sq_hub_rail',
    title: 'Route the Supply Carts',
    description: 'Rail wants the Hangar supply carts re-routed for faster turnaround.',
    status: 'NotStarted', source: 'seed', giverNpcId: 'npc_hub_rail',
    objectives: [{ id: 'obj_rail', description: 'Help Rail route the supply carts', isCompleted: false }],
    reward: { coins: 175, exp: 95 },
  },
  {
    id: 'sq_hub_aero',
    title: 'Watch the Airspace',
    description: 'Aero is mapping Hangar airspace lanes and needs a second set of eyes.',
    status: 'NotStarted', source: 'seed', giverNpcId: 'npc_hub_aero',
    objectives: [{ id: 'obj_aero', description: 'Help Aero map the airspace lanes', isCompleted: false }],
    reward: { coins: 190, exp: 100, items: [{ itemId: 'item_herb', quantity: 1 }] },
  },
  {
    id: 'sq_hub_mayor',
    title: 'Rally the Town',
    description: 'Mayor Vance wants to rally the rescued townsfolk and fund the next mission.',
    status: 'NotStarted', source: 'seed', giverNpcId: 'npc_hub_mayor',
    objectives: [{ id: 'obj_mayor', description: 'Help Mayor Vance rally the town', isCompleted: false }],
    reward: { coins: 250, exp: 140 },
  },
  ...POLI_QUESTS,
];
