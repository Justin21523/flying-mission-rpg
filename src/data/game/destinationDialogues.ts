import type { DialogueTree } from '../../types/dialogue';

// Seed destination dialogue trees (reuse the POLI dialogue engine). Mina greets the player after landing
// and starts the parcel mission via the `startMission` effect; she can also point at the beacon mini-game.
// Editable copies can be authored in the 🧑 NPC / Dialogue tab (editor trees shadow these by id).
export const GAME_DIALOGUES: DialogueTree[] = [
  {
    id: 'dlg_mina_harbor',
    rootNodeId: 'n_hello',
    label: 'Mina — harbor greeting',
    nodes: {
      n_hello: {
        id: 'n_hello',
        speaker: 'Mina',
        text: "You made it! Welcome to Sunny Harbor — that was an amazing landing. We've been waiting for you!",
        nextNodeId: 'n_brief',
        emotion: 'excited',
      },
      n_brief: {
        id: 'n_brief',
        speaker: 'Mina',
        text: "There's a parcel for Postmistress Pip, someone lost their cap near the lighthouse, and the harbor beacon is acting up again. Can you help?",
        choices: [
          { id: 'c_yes', text: "On it! I'll handle everything.", nextNodeId: 'n_go', effect: { type: 'startMission', missionId: 'mission_parcel_run' } },
          { id: 'c_later', text: 'Tell me again — what needs doing?', nextNodeId: 'n_brief' },
        ],
        emotion: 'happy',
      },
      n_go: {
        id: 'n_go',
        speaker: 'Mina',
        text: 'The parcel is by the road, the cap is near the lighthouse, and the beacon needs rewiring. Good luck!',
        nextNodeId: null,
        emotion: 'happy',
      },
    },
  },
];
