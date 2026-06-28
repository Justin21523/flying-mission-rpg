import { describe, it, expect } from 'vitest';
import { resolveStoryScene } from './storySceneResolver';
import { SEED_STORY_SCENES } from '../../data/game/storyScenes';
import { getDialogueTree } from '../dialogue/dialogueRegistry';
import type { StorySceneDefinition } from '../../types/game/storyScene';

const generic: StorySceneDefinition = { id: 'g', trigger: { type: 'mission-complete' }, dialogueTreeId: 'tg', once: true, enabled: true };
const specific: StorySceneDefinition = { id: 's', trigger: { type: 'mission-complete', missionId: 'm1' }, dialogueTreeId: 'ts', once: true, enabled: true };

describe('resolveStoryScene', () => {
  const none = new Set<string>();

  it('matches a generic scene for any mission of that trigger', () => {
    expect(resolveStoryScene({ type: 'mission-complete', missionId: 'mX' }, [generic], none)?.id).toBe('g');
  });

  it('prefers a mission-specific scene over a generic one', () => {
    expect(resolveStoryScene({ type: 'mission-complete', missionId: 'm1' }, [generic, specific], none)?.id).toBe('s');
    // ...but a different mission falls back to generic
    expect(resolveStoryScene({ type: 'mission-complete', missionId: 'm2' }, [generic, specific], none)?.id).toBe('g');
  });

  it('skips once-played scenes (and keeps non-once scenes replayable)', () => {
    expect(resolveStoryScene({ type: 'mission-complete' }, [generic], new Set(['g']))).toBeNull();
    const replay = { ...generic, id: 'r', once: false };
    expect(resolveStoryScene({ type: 'mission-complete' }, [replay], new Set(['r']))?.id).toBe('r');
  });

  it('filters by trigger type + enabled flag', () => {
    expect(resolveStoryScene({ type: 'rescue', npcId: 'n' }, [generic], none)).toBeNull(); // wrong trigger type
    expect(resolveStoryScene({ type: 'mission-complete' }, [{ ...generic, enabled: false }], none)).toBeNull();
  });

  it('rescue scenes match on npcId (specific vs any)', () => {
    const anyRescue: StorySceneDefinition = { id: 'ra', trigger: { type: 'rescue' }, dialogueTreeId: 't', enabled: true };
    const npcRescue: StorySceneDefinition = { id: 'rn', trigger: { type: 'rescue', npcId: 'npc_skye' }, dialogueTreeId: 't', enabled: true };
    expect(resolveStoryScene({ type: 'rescue', npcId: 'npc_skye' }, [anyRescue, npcRescue], none)?.id).toBe('rn');
    expect(resolveStoryScene({ type: 'rescue', npcId: 'npc_other' }, [anyRescue, npcRescue], none)?.id).toBe('ra');
  });
});

describe('story scene content integrity', () => {
  it('every seeded story scene points at a resolvable dialogue tree', () => {
    for (const s of SEED_STORY_SCENES) {
      expect(getDialogueTree(s.dialogueTreeId), s.id).toBeTruthy();
    }
  });
});
