import { describe, it, expect, beforeEach } from 'vitest';
import { getEditorCharacter, syncAutoCharacterModelsFromLibrary, useEditorCharacterStore } from './editorCharacterStore';
import { SEED_CHARACTERS } from '../../data/game/characters';

describe('editorCharacterStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorCharacterStore.getState().reset();
  });

  it('merges seed characters idempotently', () => {
    useEditorCharacterStore.getState().mergeMissingFromSeed();
    expect(useEditorCharacterStore.getState().items.length).toBe(SEED_CHARACTERS.length);
    // Running again must not duplicate.
    useEditorCharacterStore.getState().mergeMissingFromSeed();
    expect(useEditorCharacterStore.getState().items.length).toBe(SEED_CHARACTERS.length);
    expect(getEditorCharacter('char_jett')?.codename).toBe('Jett');
  });

  it('does not clobber a user edit on re-merge', () => {
    useEditorCharacterStore.getState().mergeMissingFromSeed();
    useEditorCharacterStore.getState().update('char_jett', { name: 'My Jett' });
    useEditorCharacterStore.getState().mergeMissingFromSeed();
    expect(getEditorCharacter('char_jett')?.name).toBe('My Jett');
  });

  it('refreshes auto-derived pose models without clobbering user character edits', () => {
    useEditorCharacterStore.getState().mergeMissingFromSeed();
    useEditorCharacterStore.getState().update('char_jett', { name: 'My Jett', poseModels: [] });
    syncAutoCharacterModelsFromLibrary();
    const jett = getEditorCharacter('char_jett');
    expect(jett?.name).toBe('My Jett');
    expect(jett?.poseModels?.length).toBeGreaterThan(0);
  });

  it('repairs missing model ids while preserving valid user-selected model ids', () => {
    useEditorCharacterStore.getState().mergeMissingFromSeed();
    useEditorCharacterStore.getState().update('char_paul', {
      modelAssetId: 'super-wings/missing-paul-transformer',
      planeModelAssetId: 'super-wings/Paul pose 3d model',
    });
    syncAutoCharacterModelsFromLibrary();
    const paul = getEditorCharacter('char_paul');
    expect(paul?.modelAssetId).toBe('super-wings/Paul+transformer+3d+model');
    expect(paul?.planeModelAssetId).toBe('super-wings/Paul pose 3d model');
  });

  it('duplicates with a fresh id', () => {
    useEditorCharacterStore.getState().mergeMissingFromSeed();
    const count = useEditorCharacterStore.getState().items.length;
    const id = useEditorCharacterStore.getState().duplicate('char_jett');
    expect(id).toBeTruthy();
    expect(id).not.toBe('char_jett');
    expect(useEditorCharacterStore.getState().items.length).toBe(count + 1);
  });
});
