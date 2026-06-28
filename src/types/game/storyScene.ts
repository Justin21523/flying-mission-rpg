// Phase 14 — Story-Beat Scenes. A thin, data-driven layer that plays an EXISTING dialogue tree at a
// mission-lifecycle moment (briefing / mission-complete / rescue). Reuses the dialogue engine + DialogueBox —
// no new dialogue runtime. Edited in the 💬 Story Scenes tab.

export type StorySceneTrigger =
  | { type: 'mission-start'; missionId?: string } // played when a mission's briefing opens (missionId omitted = any mission)
  | { type: 'mission-complete'; missionId?: string } // played on the mission-results screen
  | { type: 'rescue'; npcId?: string }; // played when a resident is rescued (npcId omitted = any rescue)

export type StorySceneTriggerType = StorySceneTrigger['type'];

export interface StorySceneDefinition {
  id: string;
  label?: string; // editor-only label
  trigger: StorySceneTrigger;
  dialogueTreeId: string; // an existing dialogue tree (resolved via dialogueRegistry.getDialogueTree)
  once?: boolean; // play only once per save (default true). false → replays every time the trigger fires
  enabled?: boolean;
}
