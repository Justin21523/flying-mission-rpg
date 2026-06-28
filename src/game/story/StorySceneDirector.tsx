import { useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/game/useGameStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useSaveStore } from '../../stores/useSaveStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import { resolveStoryScene, type StorySceneEvent } from './storySceneResolver';
import { getStoryScenes } from '../../stores/game/useStorySceneStore';

// Phase 14 — non-visual host: maps mission-lifecycle signals → a Story Scene → the existing dialogue engine.
// Mounted once globally in App. The DialogueBox that actually renders the beat is mounted by the briefing /
// results screens (and is already present in the Hangar for rescue beats).

// Resolve + play a scene for an event; returns true if a scene started. Records once-gated scenes as played.
function fireStoryEvent(event: StorySceneEvent): boolean {
  const ds = useDialogueStore.getState();
  if (ds.isActive) return false; // never interrupt an in-progress conversation
  const played = new Set(useSaveStore.getState().save.progress.playedStorySceneIds);
  const scene = resolveStoryScene(event, getStoryScenes(), played);
  if (!scene) return false;
  ds.startDialogue(scene.dialogueTreeId);
  if (scene.once !== false) useSaveStore.getState().addProgressId('playedStorySceneIds', scene.id);
  return true;
}

export const StorySceneDirector = () => {
  const phase = useGameStore((s) => s.phase);
  const rescued = useSaveStore((s) => s.save.progress.rescuedNpcIds);
  const prevRescued = useRef<string[]>(rescued);

  // Briefing → mission-start; results → mission-complete (fired on entering the phase).
  useEffect(() => {
    const missionId = useMissionStore.getState().currentMissionId ?? undefined;
    if (phase === 'MISSION_BRIEFING') fireStoryEvent({ type: 'mission-start', missionId });
    else if (phase === 'MISSION_RESULTS') fireStoryEvent({ type: 'mission-complete', missionId });
  }, [phase]);

  // rescuedNpcIds grew → play a rescue beat for the first newly-rescued resident.
  useEffect(() => {
    const prev = prevRescued.current;
    prevRescued.current = rescued;
    for (const npcId of rescued) {
      if (prev.includes(npcId)) continue;
      if (fireStoryEvent({ type: 'rescue', npcId })) break;
    }
  }, [rescued]);

  return null;
};
