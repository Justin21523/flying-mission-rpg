import type { StorySceneDefinition, StorySceneTriggerType } from '../../types/game/storyScene';

// Phase 14 — pure resolver: given a lifecycle event, pick the Story Scene to play. Unit-tested; the React
// host (StorySceneDirector) only wires live signals into this + fires startDialogue.
export interface StorySceneEvent {
  type: StorySceneTriggerType;
  missionId?: string; // mission-start / mission-complete
  npcId?: string; // rescue
}

function sceneTargetId(s: StorySceneDefinition): string | undefined {
  return s.trigger.type === 'rescue' ? s.trigger.npcId : s.trigger.missionId;
}

export function resolveStoryScene(
  event: StorySceneEvent,
  scenes: StorySceneDefinition[],
  playedIds: ReadonlySet<string>,
): StorySceneDefinition | null {
  const candidates = scenes.filter((s) => {
    if (s.enabled === false) return false;
    if (s.trigger.type !== event.type) return false;
    if (s.once !== false && playedIds.has(s.id)) return false; // once-gated (default true)
    const want = sceneTargetId(s);
    const have = event.type === 'rescue' ? event.npcId : event.missionId;
    return !want || want === have; // a named scene only fires for that mission/npc; generic always eligible
  });
  if (candidates.length === 0) return null;
  // A specific (id-bearing) scene wins over a generic baseline one.
  return candidates.find((s) => !!sceneTargetId(s)) ?? candidates[0];
}
