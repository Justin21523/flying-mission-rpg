import type { DialogueTree } from '../../types/dialogue';

// Phase 14 — narrative beat trees played by Story Scenes at mission-lifecycle moments. Short, single-speaker
// beats (a line + dismiss). Authored as normal dialogue trees so they ride the existing DialogueBox engine and
// can be branched/extended in the editor like any other tree.
export const STORY_DIALOGUES: DialogueTree[] = [
  {
    id: 'dlg_story_briefing_generic',
    label: 'Story — generic briefing',
    rootNodeId: 'start',
    nodes: {
      start: {
        id: 'start', speaker: 'Dispatch', emotion: 'worried',
        text: 'Another call for help just came in. The harbor is counting on you — fly safe and bring everyone home.',
        nextNodeId: null,
      },
    },
  },
  {
    id: 'dlg_story_clear_generic',
    label: 'Story — generic mission clear',
    rootNodeId: 'start',
    nodes: {
      start: {
        id: 'start', speaker: 'Dispatch', emotion: 'happy',
        text: 'Mission complete — outstanding work out there! Everyone is safe thanks to you. Head home for a well-earned rest.',
        nextNodeId: null,
      },
    },
  },
  {
    id: 'dlg_story_rescue_generic',
    label: 'Story — generic rescue',
    rootNodeId: 'start',
    nodes: {
      start: {
        id: 'start', speaker: 'Rescued Resident', emotion: 'excited',
        text: 'You found me! I thought I was stranded for good. I’ll make myself useful around the hangar — thank you, hero!',
        nextNodeId: null,
      },
    },
  },
];
