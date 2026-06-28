import { createEditorCollection } from './createEditorCollection';
import { nanoid } from 'nanoid';
import type { StorySceneDefinition } from '../../types/game/storyScene';
import { SEED_STORY_SCENES } from '../../data/game/storyScenes';

// Phase 14 — editable Story Scenes (trigger → dialogue tree). Edited in the 💬 Story Scenes tab.
export const useStorySceneStore = createEditorCollection<StorySceneDefinition>({
  storageKey: 'aero-rescue-editor-story-scene-v1',
  seed: SEED_STORY_SCENES,
  makeId: () => `story_${nanoid(6)}`,
});

export function getStoryScenes(): StorySceneDefinition[] {
  return useStorySceneStore.getState().items;
}
