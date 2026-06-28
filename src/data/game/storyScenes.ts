import type { StorySceneDefinition } from '../../types/game/storyScene';

// Phase 14 — seed Story Scenes mapping a lifecycle trigger → a dialogue tree. Generic scenes (no missionId/
// npcId) act as a baseline for every mission/rescue; add mission- or npc-specific scenes to override them
// (a scene whose id matches wins over a generic one — see storySceneResolver). All editable in 💬 Story Scenes.
export const SEED_STORY_SCENES: StorySceneDefinition[] = [
  { id: 'story_briefing_generic', label: 'Briefing — any mission', trigger: { type: 'mission-start' }, dialogueTreeId: 'dlg_story_briefing_generic', once: true, enabled: true },
  { id: 'story_clear_generic', label: 'Clear — any mission', trigger: { type: 'mission-complete' }, dialogueTreeId: 'dlg_story_clear_generic', once: true, enabled: true },
  { id: 'story_rescue_generic', label: 'Rescue — any resident', trigger: { type: 'rescue' }, dialogueTreeId: 'dlg_story_rescue_generic', once: false, enabled: true },
];
